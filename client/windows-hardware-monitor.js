/**
 * Windows Hardware Monitoring Module
 * Provides CPU temperature and overclocking detection for Windows systems
 * Uses PowerShell and WMI to access hardware sensors
 */

const { exec } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { getResourcesRoot } = require('./utils/resource-path');

class WindowsHardwareMonitor {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.lastCpuTemp = null;
    this.lastOverclockCheck = null;
    this.cacheTimeout = 5000; // Cache results for 5 seconds
    this.warned = {
      wmi: false,
      ohm: false,
      lhmWmi: false,
      dll: false
    };

    const resourcesRoot = getResourcesRoot();
    this.lhmDir = path.join(resourcesRoot, 'LibreHardwareMonitor');
    this.lhmDllPath = path.join(this.lhmDir || '', 'LibreHardwareMonitorLib.dll');
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

      // Method 3: Try reading from LibreHardwareMonitor WMI (if installed)
      const lhmTemp = await this.getCpuTempFromLHM();
      if (lhmTemp !== null) {
        this.lastCpuTemp = { value: lhmTemp, timestamp: Date.now() };
        return lhmTemp;
      }

      // Method 4: Directly read via LibreHardwareMonitorLib.dll
      const dllTemp = await this.getCpuTempFromLHMDll();
      if (dllTemp !== null) {
        this.lastCpuTemp = { value: dllTemp, timestamp: Date.now() };
        return dllTemp;
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
          if (!this.warned.wmi) {
            console.warn('[HWMonitor] WMI thermal zone unavailable:', stderr?.trim() || err?.message);
            this.warned.wmi = true;
          }
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
          if (!this.warned.ohm) {
            console.warn('[HWMonitor] OpenHardwareMonitor WMI unavailable:', stderr?.trim() || err?.message);
            this.warned.ohm = true;
          }
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
          if (!this.warned.lhmWmi) {
            console.warn('[HWMonitor] LibreHardwareMonitor WMI unavailable:', stderr?.trim() || err?.message);
            this.warned.lhmWmi = true;
          }
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
   * Get CPU temperature by loading LibreHardwareMonitorLib.dll directly
   */
  getCpuTempFromLHMDll() {
    return new Promise((resolve) => {
      if (!this.lhmDllPath || !fs.existsSync(this.lhmDllPath)) {
        if (!this.warned.dll) {
          console.warn('[HWMonitor] LibreHardwareMonitorLib.dll not found at:', this.lhmDllPath);
          this.warned.dll = true;
        }
        resolve(null);
        return;
      }

      const escapedDllPath = this.lhmDllPath.replace(/\\/g, '\\\\');
      const script = `
        try {
          Add-Type -Path '${escapedDllPath}';
          $computer = New-Object LibreHardwareMonitor.Hardware.Computer;
          $computer.IsCpuEnabled = $true;
          $computer.Open();
          $temperature = $null;
          foreach ($hardware in $computer.Hardware) {
            if ($hardware.HardwareType -eq [LibreHardwareMonitor.Hardware.HardwareType]::CPU) {
              $hardware.Update();
              foreach ($sensor in $hardware.Sensors) {
                if ($sensor.SensorType -eq [LibreHardwareMonitor.Hardware.SensorType]::Temperature -and ($sensor.Name -like '*CPU*' -or $sensor.Name -like '*Package*')) {
                  $temperature = $sensor.Value;
                  break;
                }
              }
            }
            if ($temperature -ne $null) { break }
          }
          $computer.Close();
          if ($temperature -ne $null) {
            Write-Output ([math]::Round($temperature, 1));
          }
        } catch {
          Write-Error $_.Exception.Message;
        }
      `;

      const encoded = Buffer.from(script, 'utf16le').toString('base64');
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;

      exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err || stderr) {
          if (!this.warned.dll) {
            console.warn('[HWMonitor] Direct DLL read failed:', stderr?.trim() || err?.message);
            this.warned.dll = true;
          }
          resolve(null);
          return;
        }

        const temp = parseFloat(stdout.trim());
        if (!isNaN(temp) && temp > 0 && temp < 150) {
          resolve(temp);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Get CPU voltage and power from LibreHardwareMonitor
   */
  async getCpuVoltageAndPower() {
    try {
      // Try WMI first (faster)
      const result = await this.getVoltageAndPowerFromLHM();
      if (result.cpuVoltage !== null || result.cpuPower !== null) {
        return result;
      }

      // Fallback to DLL method
      return await this.getVoltageAndPowerFromLHMDll();
    } catch (err) {
      console.error('Error getting CPU voltage/power:', err.message);
      return { cpuVoltage: null, cpuPower: null };
    }
  }

  /**
   * Get CPU voltage and power from LibreHardwareMonitor WMI
   */
  getVoltageAndPowerFromLHM() {
    return new Promise((resolve) => {
      const cmd = `powershell -Command "Get-WmiObject -Namespace root/LibreHardwareMonitor -Class Sensor | Where-Object {($_.SensorType -eq 'Voltage' -and ($_.Name -like '*CPU*' -or $_.Name -like '*Core*' -or $_.Name -like '*VID*')) -or ($_.SensorType -eq 'Power' -and ($_.Name -like '*Package*' -or $_.Name -like '*CPU*'))} | Select-Object Name, Value, SensorType | ConvertTo-Json"`;

      exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
        if (err || stderr) {
          resolve({ cpuVoltage: null, cpuPower: null });
          return;
        }

        try {
          const output = stdout.trim();
          if (!output) {
            resolve({ cpuVoltage: null, cpuPower: null });
            return;
          }

          // Parse JSON (could be single object or array)
          let sensors = JSON.parse(output);
          if (!Array.isArray(sensors)) {
            sensors = [sensors];
          }

          let cpuVoltage = null;
          let cpuPower = null;

          // Find voltage and power values
          for (const sensor of sensors) {
            if (sensor.SensorType === 'Voltage' && cpuVoltage === null) {
              const val = parseFloat(sensor.Value);
              if (!isNaN(val) && val > 0 && val < 10) { // Reasonable voltage range
                cpuVoltage = Math.round(val * 1000) / 1000; // Round to 3 decimals
              }
            }
            if (sensor.SensorType === 'Power' && cpuPower === null) {
              const val = parseFloat(sensor.Value);
              if (!isNaN(val) && val > 0 && val < 1000) { // Reasonable power range
                cpuPower = Math.round(val * 10) / 10; // Round to 1 decimal
              }
            }
          }

          resolve({ cpuVoltage, cpuPower });
        } catch (parseErr) {
          resolve({ cpuVoltage: null, cpuPower: null });
        }
      });
    });
  }

  /**
   * Get CPU voltage and power from LibreHardwareMonitorLib.dll directly
   */
  getVoltageAndPowerFromLHMDll() {
    return new Promise((resolve) => {
      if (!this.lhmDllPath || !fs.existsSync(this.lhmDllPath)) {
        resolve({ cpuVoltage: null, cpuPower: null });
        return;
      }

      const escapedDllPath = this.lhmDllPath.replace(/\\/g, '\\\\');
      const script = `
        try {
          Add-Type -Path '${escapedDllPath}';
          $computer = New-Object LibreHardwareMonitor.Hardware.Computer;
          $computer.IsCpuEnabled = $true;
          $computer.Open();
          $voltage = $null;
          $power = $null;
          foreach ($hardware in $computer.Hardware) {
            if ($hardware.HardwareType -eq [LibreHardwareMonitor.Hardware.HardwareType]::CPU) {
              $hardware.Update();
              foreach ($sensor in $hardware.Sensors) {
                if ($sensor.SensorType -eq [LibreHardwareMonitor.Hardware.SensorType]::Voltage -and $voltage -eq $null) {
                  if ($sensor.Name -like '*CPU*' -or $sensor.Name -like '*Core*' -or $sensor.Name -like '*VID*') {
                    $voltage = $sensor.Value;
                  }
                }
                if ($sensor.SensorType -eq [LibreHardwareMonitor.Hardware.SensorType]::Power -and $power -eq $null) {
                  if ($sensor.Name -like '*Package*' -or $sensor.Name -like '*CPU*') {
                    $power = $sensor.Value;
                  }
                }
              }
            }
            if ($voltage -ne $null -and $power -ne $null) { break }
          }
          $computer.Close();
          $result = @{};
          if ($voltage -ne $null) { $result.voltage = [math]::Round($voltage, 3) }
          if ($power -ne $null) { $result.power = [math]::Round($power, 1) }
          Write-Output (ConvertTo-Json $result);
        } catch {
          Write-Error $_.Exception.Message;
        }
      `;

      const encoded = Buffer.from(script, 'utf16le').toString('base64');
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;

      exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err || stderr) {
          resolve({ cpuVoltage: null, cpuPower: null });
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve({
            cpuVoltage: result.voltage || null,
            cpuPower: result.power || null
          });
        } catch (parseErr) {
          resolve({ cpuVoltage: null, cpuPower: null });
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
   * Get all hardware data (temperature, overclocking status, voltage, power)
   */
  async getAllData() {
    const [cpuTemp, isCpuOC, isRamOC, voltageAndPower] = await Promise.all([
      this.getCpuTemperature(),
      this.detectCpuOverclock(),
      this.detectRamOverclock(),
      this.getCpuVoltageAndPower()
    ]);

    return {
      cpuTemperature: cpuTemp,
      isCpuOverclocked: isCpuOC,
      isRamOverclocked: isRamOC,
      cpuVoltage: voltageAndPower.cpuVoltage,
      cpuPower: voltageAndPower.cpuPower
    };
  }
}

module.exports = WindowsHardwareMonitor;
