/**
 * Hardware Monitor Manager
 * Manages LibreHardwareMonitor lifecycle alongside the RFID client
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class HardwareMonitorManager {
  constructor() {
    this.lhmProcess = null;
    this.isRunning = false;
    
    // Determine the path to LibreHardwareMonitor
    // In production (packaged app), it will be in resources
    // In development, it will be in the project root
    const isDev = !process.resourcesPath;
    
    if (isDev) {
      this.lhmPath = path.join(__dirname, '..', 'resources', 'LibreHardwareMonitor', 'LibreHardwareMonitor.exe');
    } else {
      this.lhmPath = path.join(process.resourcesPath, 'LibreHardwareMonitor', 'LibreHardwareMonitor.exe');
    }
    
    console.log('[HWMonitor] LibreHardwareMonitor path:', this.lhmPath);
  }

  /**
   * Check if LibreHardwareMonitor is available
   */
  isAvailable() {
    if (os.platform() !== 'win32') {
      console.log('[HWMonitor] Not on Windows, hardware monitor not needed');
      return false;
    }

    const exists = fs.existsSync(this.lhmPath);
    if (!exists) {
      console.log('[HWMonitor] LibreHardwareMonitor.exe not found at:', this.lhmPath);
    }
    return exists;
  }

  /**
   * Start LibreHardwareMonitor in the background
   */
  async start() {
    if (!this.isAvailable()) {
      console.log('[HWMonitor] LibreHardwareMonitor not available, skipping');
      return false;
    }

    if (this.isRunning) {
      console.log('[HWMonitor] Already running');
      return true;
    }

    try {
      console.log('[HWMonitor] Starting LibreHardwareMonitor...');

      // Check if already running (from previous instance)
      const isAlreadyRunning = await this.checkIfRunning();
      if (isAlreadyRunning) {
        console.log('[HWMonitor] LibreHardwareMonitor already running (from previous instance)');
        this.isRunning = true;
        return true;
      }

      // Start LibreHardwareMonitor minimized
      this.lhmProcess = spawn('cmd.exe', ['/c', `"${this.lhmPath}" -minimized`], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true
      });


      // Don't wait for the process to exit
      this.lhmProcess.unref();

      this.isRunning = true;
      console.log('[HWMonitor] LibreHardwareMonitor started successfully');

      // Wait a bit for it to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      return true;

    } catch (err) {
      console.error('[HWMonitor] Failed to start LibreHardwareMonitor:', err.message);
      return false;
    }
  }


  
  /**
   * Check if LibreHardwareMonitor is already running
   */
  async checkIfRunning() {
    if (os.platform() !== 'win32') {
      return false;
    }

    try {
      const { execSync } = require('child_process');
      const output = execSync('tasklist /FI "IMAGENAME eq LibreHardwareMonitor.exe" /NH', {
        encoding: 'utf8',
        windowsHide: true
      });

      return output.includes('LibreHardwareMonitor.exe');
    } catch (err) {
      return false;
    }
  }

  /**
   * Stop LibreHardwareMonitor
   * Note: We generally don't stop it, as it should keep running for monitoring
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.lhmProcess && !this.lhmProcess.killed) {
        this.lhmProcess.kill();
        console.log('[HWMonitor] LibreHardwareMonitor stopped');
      }
      this.isRunning = false;
    } catch (err) {
      console.error('[HWMonitor] Error stopping LibreHardwareMonitor:', err.message);
    }
  }

  /**
   * Get status information
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      running: this.isRunning,
      path: this.lhmPath
    };
  }
}

module.exports = HardwareMonitorManager;

