/**
 * Windows Hardware Monitoring Module
 * Provides CPU temperature and overclocking detection for Windows systems
 * Uses PowerShell and WMI to access hardware sensors
 */

const { exec } = require('child_process');
const os = require('os');

class WindowsHardwareMonitor {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.lastCpuTemp = null;
    this.lastOverclockCheck = null;
    this.cacheTimeout = 5000; // Cache results for 5 seconds
  }

  /**
   * Get CPU temperature using multiple methods
   * Tries WMI, then falls back to Open Hardware Monitor if available
   */
  async getCpuTemperature() {
    if (!this.isWindows) {
      return null;
    }

    // Return cached value if recent
    if (this.lastCpuTemp && this.lastCpuTemp.timestamp > Date.now() - this.cacheTimeout) {
      return this.lastCpuTemp.value;
    }

    try {
      // Method 1: Try WMI MSAcpi_ThermalZoneTemperature (works on some systems)
      const wmiTemp = await this.getCpuTempFromWMI();
      if (wmiTemp !== null) {
        this.lastCpuTemp = { value: wmiTemp, timestamp: Date.now() };
        return wmiTemp;
      }

      // Method 2: Try Open Hardware Monitor WMI namespace (if installed)
      const ohmTemp = await this.getCpuTempFromOHM();
      if (ohmTemp !== null) {
        this.lastCpuTemp = { value: ohmTemp, timestamp: Date.now() };
        return ohmTemp;
      }

      // Method 3: Try reading from LibreHardwareMonitor (if installed)
      const lhmTemp = await this.getCpuTempFromLHM();
      if (lhmTemp !== null) {
        this.lastCpuTemp = { value: lhmTemp, timestamp: Date.now() };
        return lhmTemp;
      }

      return null;
    } catch (err) {
      console.error('Error getting CPU temperature:', err.message);
      return null;
    }
  }

  /**
   * Get CPU temperature from WMI MSAcpi_ThermalZoneTemperature
   */
  getCpuTempFromWMI() {
    return new Promise((resolve) => {
      const cmd = 'powershell -Command "Get-WmiObject -Namespace root/wmi -Class MSAcpi_ThermalZoneTemperature | Select-Object -First 1 -ExpandProperty CurrentTemperature"';
      
      exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
        if (err || stderr) {
          resolve(null);
          return;
        }

        const temp = parseInt(stdout.trim());
        if (!isNaN(temp) && temp > 0) {
          // Convert from tenths of Kelvin to Celsius
          const celsius = (temp / 10) - 273.15;
          resolve(Math.round(celsius * 10) / 10);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get CPU temperature from Open Hardware Monitor WMI
   */
  getCpuTempFromOHM() {
    return new Promise((resolve) => {
      const cmd = 'powershell -Command "Get-WmiObject -Namespace root/OpenHardwareMonitor -Class Sensor | Where-Object {$_.SensorType -eq \'Temperature\' -and $_.Name -like \'*CPU*\'} | Select-Object -First 1 -ExpandProperty Value"';
      
      exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
        if (err || stderr) {
          resolve(null);
          return;
        }

        const temp = parseFloat(stdout.trim());
        if (!isNaN(temp) && temp > 0 && temp < 150) {
          resolve(Math.round(temp * 10) / 10);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get CPU temperature from LibreHardwareMonitor WMI
   */
  getCpuTempFromLHM() {
    return new Promise((resolve) => {
      const cmd = 'powershell -Command "Get-WmiObject -Namespace root/LibreHardwareMonitor -Class Sensor | Where-Object {$_.SensorType -eq \'Temperature\' -and $_.Name -like \'*CPU*\'} | Select-Object -First 1 -ExpandProperty Value"';
      
      exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
        if (err || stderr) {
          resolve(null);
          return;
        }

        const temp = parseFloat(stdout.trim());
        if (!isNaN(temp) && temp > 0 && temp < 150) {
          resolve(Math.round(temp * 10) / 10);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Detect if CPU is overclocked
   * Compares current CPU speed with base speed
   */
  async isCpuOverclocked() {
    if (!this.isWindows) {
      return null;
    }

    // Return cached value if recent
    if (this.lastOverclockCheck && this.lastOverclockCheck.timestamp > Date.now() - 30000) {
      return this.lastOverclockCheck.cpuOverclocked;
    }

    try {
      const result = await this.checkOverclocking();
      this.lastOverclockCheck = {
        cpuOverclocked: result.cpuOverclocked,
        ramOverclocked: result.ramOverclocked,
        timestamp: Date.now()
      };
      return result.cpuOverclocked;
    } catch (err) {
      console.error('Error checking CPU overclocking:', err.message);
      return null;
    }
  }

  /**
   * Detect if RAM is overclocked
   * Compares current RAM speed with standard speeds
   */
  async isRamOverclocked() {
    if (!this.isWindows) {
      return null;
    }

    // Return cached value if recent
    if (this.lastOverclockCheck && this.lastOverclockCheck.timestamp > Date.now() - 30000) {
      return this.lastOverclockCheck.ramOverclocked;
    }

    try {
      const result = await this.checkOverclocking();
      this.lastOverclockCheck = {
        cpuOverclocked: result.cpuOverclocked,
        ramOverclocked: result.ramOverclocked,
        timestamp: Date.now()
      };
      return result.ramOverclocked;
    } catch (err) {
      console.error('Error checking RAM overclocking:', err.message);
      return null;
    }
  }

  /**
   * Check both CPU and RAM overclocking status
   */
  checkOverclocking() {
    return new Promise((resolve) => {
      // Use separate PowerShell commands to avoid escaping issues
      const cpuCmd = 'powershell -Command "Get-WmiObject -Class Win32_Processor | Select-Object -First 1 | ForEach-Object { Write-Output ($_.MaxClockSpeed.ToString() + \',\' + $_.CurrentClockSpeed.ToString()) }"';
      const ramCmd = 'powershell -Command "Get-WmiObject -Class Win32_PhysicalMemory | Select-Object -First 1 | ForEach-Object { Write-Output $_.Speed }"';

      // Get CPU speeds
      exec(cpuCmd, { timeout: 5000 }, (cpuErr, cpuStdout, cpuStderr) => {
        if (cpuErr || cpuStderr) {
          resolve({ cpuOverclocked: null, ramOverclocked: null });
          return;
        }

        const cpuParts = cpuStdout.trim().split(',');
        if (cpuParts.length !== 2) {
          resolve({ cpuOverclocked: null, ramOverclocked: null });
          return;
        }

        const cpuMaxSpeed = parseInt(cpuParts[0]);
        const cpuCurrentSpeed = parseInt(cpuParts[1]);

        // Get RAM speed
        exec(ramCmd, { timeout: 5000 }, (ramErr, ramStdout, ramStderr) => {
          if (ramErr || ramStderr) {
            // CPU data is valid, but RAM failed
            const cpuOverclocked = !isNaN(cpuMaxSpeed) && !isNaN(cpuCurrentSpeed) && cpuCurrentSpeed > cpuMaxSpeed * 1.05;
            resolve({ cpuOverclocked, ramOverclocked: null });
            return;
          }

          const ramSpeed = parseInt(ramStdout.trim());

          // CPU is considered overclocked if current speed > max speed by more than 5%
          const cpuOverclocked = !isNaN(cpuMaxSpeed) && !isNaN(cpuCurrentSpeed) && cpuCurrentSpeed > cpuMaxSpeed * 1.05;

          // RAM is considered overclocked if speed is above standard JEDEC speeds
          // Standard DDR4 speeds: 2133, 2400, 2666, 2933, 3200
          // Standard DDR3 speeds: 1333, 1600, 1866
          const standardSpeeds = [1333, 1600, 1866, 2133, 2400, 2666, 2933, 3200];
          const ramOverclocked = !isNaN(ramSpeed) && ramSpeed > 0 && !standardSpeeds.includes(ramSpeed) && ramSpeed > 3200;

          resolve({ cpuOverclocked, ramOverclocked });
        });
      });
    });
  }

  /**
   * Get all hardware monitoring data at once
   */
  async getAllData() {
    const [cpuTemp, overclockData] = await Promise.all([
      this.getCpuTemperature(),
      this.checkOverclocking()
    ]);

    return {
      cpuTemperature: cpuTemp,
      isCpuOverclocked: overclockData.cpuOverclocked,
      isRamOverclocked: overclockData.ramOverclocked
    };
  }
}

module.exports = WindowsHardwareMonitor;

