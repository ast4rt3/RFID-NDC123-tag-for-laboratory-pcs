const os = require('os');
const { exec } = require('child_process');

class OverclockingDetector {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.baselineFrequencies = new Map(); // Store baseline frequencies for comparison
    this.overclockThreshold = 0.05; // 5% above baseline is considered overclocked
  }

  async detectCPUOverclocking() {
    try {
      const currentFreq = await this.getCurrentCPUFrequency();
      const baselineFreq = await this.getBaselineCPUFrequency();
      
      if (!currentFreq || !baselineFreq) {
        return { isOverclocked: false, currentFreq: null, baselineFreq: null, overclockPercent: 0 };
      }

      const overclockPercent = ((currentFreq - baselineFreq) / baselineFreq) * 100;
      const isOverclocked = overclockPercent > (this.overclockThreshold * 100);

      return {
        isOverclocked,
        currentFreq,
        baselineFreq,
        overclockPercent: Math.round(overclockPercent * 100) / 100
      };
    } catch (error) {
      console.error('Error detecting CPU overclocking:', error);
      return { isOverclocked: false, currentFreq: null, baselineFreq: null, overclockPercent: 0 };
    }
  }

  async detectRAMOverclocking() {
    try {
      const currentFreq = await this.getCurrentRAMFrequency();
      const baselineFreq = await this.getBaselineRAMFrequency();
      
      if (!currentFreq || !baselineFreq) {
        return { isOverclocked: false, currentFreq: null, baselineFreq: null, overclockPercent: 0 };
      }

      const overclockPercent = ((currentFreq - baselineFreq) / baselineFreq) * 100;
      const isOverclocked = overclockPercent > (this.overclockThreshold * 100);

      return {
        isOverclocked,
        currentFreq,
        baselineFreq,
        overclockPercent: Math.round(overclockPercent * 100) / 100
      };
    } catch (error) {
      console.error('Error detecting RAM overclocking:', error);
      return { isOverclocked: false, currentFreq: null, baselineFreq: null, overclockPercent: 0 };
    }
  }

  async getCurrentCPUFrequency() {
    try {
      if (this.isWindows) {
        return await this.getWindowsCPUFrequency();
      } else {
        return await this.getLinuxCPUFrequency();
      }
    } catch (error) {
      console.error('Error getting CPU frequency:', error);
      return null;
    }
  }

  async getWindowsCPUFrequency() {
    return new Promise((resolve) => {
      exec('wmic cpu get MaxClockSpeed /value', (error, stdout) => {
        if (!error && stdout) {
          const match = stdout.match(/MaxClockSpeed=(\d+)/);
          if (match) {
            resolve(parseInt(match[1]));
            return;
          }
        }
        
        // Try alternative method
        exec('powershell "Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty MaxClockSpeed"', (error, stdout) => {
          if (!error && stdout.trim()) {
            const freq = parseInt(stdout.trim());
            if (!isNaN(freq)) {
              resolve(freq);
              return;
            }
          }
          resolve(null);
        });
      });
    });
  }

  async getLinuxCPUFrequency() {
    return new Promise((resolve) => {
      exec('lscpu | grep "CPU max MHz"', (error, stdout) => {
        if (!error && stdout) {
          const match = stdout.match(/CPU max MHz:\s*(\d+)/);
          if (match) {
            resolve(parseInt(match[1]));
            return;
          }
        }
        
        // Try alternative method
        exec('cat /proc/cpuinfo | grep "cpu MHz" | head -1', (error, stdout) => {
          if (!error && stdout) {
            const match = stdout.match(/cpu MHz\s*:\s*(\d+\.\d+)/);
            if (match) {
              resolve(Math.round(parseFloat(match[1])));
              return;
            }
          }
          resolve(null);
        });
      });
    });
  }

  async getCurrentRAMFrequency() {
    try {
      if (this.isWindows) {
        return await this.getWindowsRAMFrequency();
      } else {
        return await this.getLinuxRAMFrequency();
      }
    } catch (error) {
      console.error('Error getting RAM frequency:', error);
      return null;
    }
  }

  async getWindowsRAMFrequency() {
    return new Promise((resolve) => {
      exec('wmic memorychip get Speed /value', (error, stdout) => {
        if (!error && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (line.includes('Speed=')) {
              const speed = parseInt(line.split('=')[1]);
              if (!isNaN(speed) && speed > 0) {
                resolve(speed);
                return;
              }
            }
          }
        }
        resolve(null);
      });
    });
  }

  async getLinuxRAMFrequency() {
    return new Promise((resolve) => {
      exec('dmidecode -t memory | grep -i speed', (error, stdout) => {
        if (!error && stdout) {
          const lines = stdout.split('\n');
          for (const line of lines) {
            const match = line.match(/Speed:\s*(\d+)\s*MHz/);
            if (match) {
              resolve(parseInt(match[1]));
              return;
            }
          }
        }
        resolve(null);
      });
    });
  }

  async getBaselineCPUFrequency() {
    const pcName = os.hostname();
    const key = `cpu_${pcName}`;
    
    if (this.baselineFrequencies.has(key)) {
      return this.baselineFrequencies.get(key);
    }

    // Try to get from system info or use a reasonable default
    try {
      const currentFreq = await this.getCurrentCPUFrequency();
      if (currentFreq) {
        // For now, assume current frequency is baseline
        // In a real implementation, you'd store this persistently
        this.baselineFrequencies.set(key, currentFreq);
        return currentFreq;
      }
    } catch (error) {
      console.error('Error getting baseline CPU frequency:', error);
    }

    // Fallback to reasonable defaults based on common CPU types
    return 3000; // 3GHz default
  }

  async getBaselineRAMFrequency() {
    const pcName = os.hostname();
    const key = `ram_${pcName}`;
    
    if (this.baselineFrequencies.has(key)) {
      return this.baselineFrequencies.get(key);
    }

    // Try to get from system info or use a reasonable default
    try {
      const currentFreq = await this.getCurrentRAMFrequency();
      if (currentFreq) {
        // For now, assume current frequency is baseline
        this.baselineFrequencies.set(key, currentFreq);
        return currentFreq;
      }
    } catch (error) {
      console.error('Error getting baseline RAM frequency:', error);
    }

    // Fallback to reasonable defaults
    return 2400; // 2400MHz default
  }

  async detectAllOverclocking() {
    const [cpuOverclock, ramOverclock] = await Promise.all([
      this.detectCPUOverclocking(),
      this.detectRAMOverclocking()
    ]);

    return {
      cpu: cpuOverclock,
      ram: ramOverclock,
      anyOverclocked: cpuOverclock.isOverclocked || ramOverclock.isOverclocked
    };
  }

  // Calculate temperature impact of overclocking
  calculateTemperatureImpact(overclockPercent, baseTemp) {
    if (!baseTemp || overclockPercent <= 0) return 0;
    
    // Rough estimation: 1% overclock = ~0.5°C temperature increase
    const tempIncrease = (overclockPercent / 100) * 0.5;
    return Math.round(tempIncrease * 10) / 10;
  }

  // Generate overclocking alert
  generateAlert(pcName, component, overclockData, temperatureImpact) {
    return {
      pc_name: pcName,
      alert_type: `${component.toLowerCase()}_overclock`,
      component_name: component,
      original_frequency: overclockData.baselineFreq,
      current_frequency: overclockData.currentFreq,
      overclock_percentage: overclockData.overclockPercent,
      temperature_impact: temperatureImpact,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = OverclockingDetector;
