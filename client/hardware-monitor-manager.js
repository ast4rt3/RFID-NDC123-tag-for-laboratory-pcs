/**
 * Hardware Monitor Manager
 * Manages LibreHardwareMonitor lifecycle alongside the RFID client
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getResourcesRoot } = require('./utils/resource-path');

class HardwareMonitorManager {
  constructor() {
    this.lhmProcess = null;
    this.isRunning = false;

    // Determine the path to LibreHardwareMonitor
    // In production (packaged app), it will be in resources
    // In development, it will be in the project root
    const resourcesRoot = getResourcesRoot();
    this.lhmPath = path.join(resourcesRoot, 'LibreHardwareMonitor', 'LibreHardwareMonitor.exe');

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
   * Start monitoring (Passive mode)
   * Checks if LibreHardwareMonitor is running, but does NOT start it automatically
   * as the user wants to manage it manually.
   */
  async start() {
    if (!this.isAvailable()) {
      console.log('[HWMonitor] LibreHardwareMonitor not available, skipping');
      return false;
    }

    console.log('[HWMonitor] Checking for LibreHardwareMonitor...');

    // Check if running
    const isRunning = await this.checkIfRunning();
    if (isRunning) {
      console.log('[HWMonitor] ✅ LibreHardwareMonitor is running');
      this.isRunning = true;
      return true;
    } else {
      console.warn('[HWMonitor] ⚠️ LibreHardwareMonitor is NOT running');
      console.warn('[HWMonitor] Please launch LibreHardwareMonitor.exe manually as Administrator');
      this.isRunning = false;
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
   * Stop monitoring
   * In passive mode, this just updates internal state
   */
  async stop() {
    this.isRunning = false;
  }

  /**
   * Restart requested (No-op in manual mode)
   */
  async restartLHM() {
    console.log('[HWMonitor] Restart requested, but running in manual mode.');
    console.log('[HWMonitor] Please restart LibreHardwareMonitor manually if needed.');
    return this.start();
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

