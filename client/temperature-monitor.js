const os = require('os');
const { exec } = require('child_process');

class TemperatureMonitor {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.temperatureThresholds = {
      cpu: { warning: 70, critical: 80 },
      gpu: { warning: 75, critical: 85 },
      system: { warning: 60, critical: 70 }
    };
  }

  async getCPUTemperature() {
    try {
      if (this.isWindows) {
        return await this.getWindowsCPUTemperature();
      } else {
        return await this.getLinuxCPUTemperature();
      }
    } catch (error) {
      console.error('Error getting CPU temperature:', error);
      return null;
    }
  }

  async getWindowsCPUTemperature() {
    return new Promise((resolve) => {
      // Try using wmic (Windows Management Instrumentation)
      exec('wmic /namespace:\\\\root\\wmi path MSAcpi_ThermalZoneTemperature get CurrentTemperature /value', (error, stdout) => {
        if (!error && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line.includes('CurrentTemperature=')) {
              const temp = parseInt(line.split('=')[1]);
              if (!isNaN(temp)) {
                // Convert from tenths of Kelvin to Celsius
                const celsius = (temp / 10) - 273.15;
                resolve(Math.round(celsius * 10) / 10);
                return;
              }
            }
          }
        }
        
        // Fallback: Try using PowerShell with WMI
        exec('powershell "Get-WmiObject -Namespace root\\wmi -Class MSAcpi_ThermalZoneTemperature | Select-Object -ExpandProperty CurrentTemperature"', (error, stdout) => {
          if (!error && stdout.trim()) {
            const temp = parseInt(stdout.trim());
            if (!isNaN(temp)) {
              const celsius = (temp / 10) - 273.15;
              resolve(Math.round(celsius * 10) / 10);
              return;
            }
          }
          resolve(null);
        });
      });
    });
  }

  async getLinuxCPUTemperature() {
    return new Promise((resolve) => {
      // Try common temperature sensor paths
      const sensorPaths = [
        '/sys/class/thermal/thermal_zone0/temp',
        '/sys/class/hwmon/hwmon0/temp1_input',
        '/sys/class/hwmon/hwmon1/temp1_input',
        '/sys/class/hwmon/hwmon2/temp1_input'
      ];

      const tryNext = (index) => {
        if (index >= sensorPaths.length) {
          resolve(null);
          return;
        }

        exec(`cat ${sensorPaths[index]}`, (error, stdout) => {
          if (!error && stdout.trim()) {
            const temp = parseInt(stdout.trim());
            if (!isNaN(temp)) {
              // Convert from millidegrees to Celsius
              const celsius = temp / 1000;
              resolve(Math.round(celsius * 10) / 10);
              return;
            }
          }
          tryNext(index + 1);
        });
      };

      tryNext(0);
    });
  }

  async getGPUTemperature() {
    try {
      if (this.isWindows) {
        return await this.getWindowsGPUTemperature();
      } else {
        return await this.getLinuxGPUTemperature();
      }
    } catch (error) {
      console.error('Error getting GPU temperature:', error);
      return null;
    }
  }

  async getWindowsGPUTemperature() {
    return new Promise((resolve) => {
      // Try nvidia-smi for NVIDIA GPUs
      exec('nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits', (error, stdout) => {
        if (!error && stdout.trim()) {
          const temp = parseFloat(stdout.trim());
          if (!isNaN(temp)) {
            resolve(temp);
            return;
          }
        }
        
        // Try AMD GPU
        exec('wmic path win32_VideoController get name', (error, stdout) => {
          if (!error && stdout.includes('AMD')) {
            // AMD GPU temperature detection would go here
            // This is a placeholder as AMD GPU temp detection is more complex
            resolve(null);
          } else {
            resolve(null);
          }
        });
      });
    });
  }

  async getLinuxGPUTemperature() {
    return new Promise((resolve) => {
      // Try nvidia-smi
      exec('nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits', (error, stdout) => {
        if (!error && stdout.trim()) {
          const temp = parseFloat(stdout.trim());
          if (!isNaN(temp)) {
            resolve(temp);
            return;
          }
        }
        
        // Try AMD GPU sensors
        exec('sensors | grep -i "radeon\|amdgpu" | grep -o "[0-9]*\.[0-9]*°C" | head -1', (error, stdout) => {
          if (!error && stdout.trim()) {
            const temp = parseFloat(stdout.trim().replace('°C', ''));
            if (!isNaN(temp)) {
              resolve(temp);
              return;
            }
          }
          resolve(null);
        });
      });
    });
  }

  async getSystemTemperature() {
    try {
      if (this.isWindows) {
        return await this.getWindowsSystemTemperature();
      } else {
        return await this.getLinuxSystemTemperature();
      }
    } catch (error) {
      console.error('Error getting system temperature:', error);
      return null;
    }
  }

  async getWindowsSystemTemperature() {
    return new Promise((resolve) => {
      // Try using Open Hardware Monitor or similar tools
      exec('wmic /namespace:\\\\root\\wmi path MSAcpi_ThermalZoneTemperature get CurrentTemperature /value', (error, stdout) => {
        if (!error && stdout) {
          const lines = stdout.split('\n');
          let temps = [];
          for (const line of lines) {
            if (line.includes('CurrentTemperature=')) {
              const temp = parseInt(line.split('=')[1]);
              if (!isNaN(temp)) {
                const celsius = (temp / 10) - 273.15;
                temps.push(celsius);
              }
            }
          }
          if (temps.length > 0) {
            resolve(Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10);
            return;
          }
        }
        resolve(null);
      });
    });
  }

  async getLinuxSystemTemperature() {
    return new Promise((resolve) => {
      exec('sensors | grep -i "temp" | grep -o "[0-9]*\.[0-9]*°C" | head -1', (error, stdout) => {
        if (!error && stdout.trim()) {
          const temp = parseFloat(stdout.trim().replace('°C', ''));
          if (!isNaN(temp)) {
            resolve(temp);
            return;
          }
        }
        resolve(null);
      });
    });
  }

  async getAmbientTemperature() {
    // This would require external sensors or motherboard sensors
    // For now, return null as it's not easily accessible
    return null;
  }

  async getAllTemperatures() {
    const [cpuTemp, gpuTemp, systemTemp, ambientTemp] = await Promise.all([
      this.getCPUTemperature(),
      this.getGPUTemperature(),
      this.getSystemTemperature(),
      this.getAmbientTemperature()
    ]);

    return {
      cpu: cpuTemp,
      gpu: gpuTemp,
      system: systemTemp,
      ambient: ambientTemp
    };
  }

  isTemperatureCritical(temperature, type) {
    if (!temperature) return false;
    
    const threshold = this.temperatureThresholds[type];
    if (!threshold) return false;
    
    return temperature >= threshold.critical;
  }

  isTemperatureWarning(temperature, type) {
    if (!temperature) return false;
    
    const threshold = this.temperatureThresholds[type];
    if (!threshold) return false;
    
    return temperature >= threshold.warning;
  }

  getTemperatureStatus(temperature, type) {
    if (!temperature) return 'unknown';
    
    if (this.isTemperatureCritical(temperature, type)) return 'critical';
    if (this.isTemperatureWarning(temperature, type)) return 'warning';
    return 'normal';
  }
}

module.exports = TemperatureMonitor;

