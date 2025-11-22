# LibreHardwareMonitor.exe Code Reference

## Overview
LibreHardwareMonitor.exe is launched automatically when the RFID client application starts. It runs in the background to provide hardware monitoring capabilities (CPU temperature, overclocking detection, etc.).

## Main Entry Point

**File:** `client/main.js`  
**Lines:** 302-310

```javascript
// Initialize and start hardware monitor (LibreHardwareMonitor)
hardwareMonitor = new HardwareMonitorManager();
const hwMonitorStarted = await hardwareMonitor.start();

if (hwMonitorStarted) {
  console.log('✅ LibreHardwareMonitor started successfully');
} else {
  console.log('⚠️  LibreHardwareMonitor not available (CPU temperature will return null)');
}
```

This code runs when the Electron app starts (`app.whenReady()`), before the logger process starts.

---

## Hardware Monitor Manager Class

**File:** `client/hardware-monitor-manager.js`

### Constructor (Lines 12-28)

Determines the path to LibreHardwareMonitor.exe:

```javascript
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
```

**Paths:**
- **Development:** `[ProjectRoot]/resources/LibreHardwareMonitor/LibreHardwareMonitor.exe`
- **Production:** `[InstallDir]/resources/LibreHardwareMonitor/LibreHardwareMonitor.exe`

### Start Method (Lines 49-93)

The actual code that launches LibreHardwareMonitor.exe:

```javascript
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
    this.lhmProcess = spawn(this.lhmPath, ['-minimized'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false // We want it in system tray
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
```

**Key Details:**
- **Command:** `LibreHardwareMonitor.exe -minimized`
- **Process Options:**
  - `detached: true` - Runs independently of parent process
  - `stdio: 'ignore'` - Doesn't capture output
  - `windowsHide: false` - Shows in system tray
- **Behavior:** 
  - Checks if already running before starting
  - Runs detached so it continues even if the client crashes
  - Waits 2 seconds for initialization

### Check If Running (Lines 98-114)

Checks if LibreHardwareMonitor.exe is already running:

```javascript
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
```

Uses Windows `tasklist` command to check if the process is running.

---

## How It's Used

### 1. Application Startup Flow

```
app.whenReady()
  ↓
Create System Tray
  ↓
Initialize HardwareMonitorManager
  ↓
hardwareMonitor.start()
  ↓
  ├─ Check if LibreHardwareMonitor.exe exists
  ├─ Check if already running
  └─ spawn('LibreHardwareMonitor.exe', ['-minimized'])
  ↓
Start Logger Process (pc-logger.js)
```

### 2. Hardware Data Collection

**File:** `client/windows-hardware-monitor.js`

Once LibreHardwareMonitor.exe is running, the `windows-hardware-monitor.js` module connects to it via WMI to read hardware data:

```javascript
// Reads CPU temperature from LibreHardwareMonitor's WMI interface
async getCpuTemperature() {
  // Connects to WMI namespace created by LibreHardwareMonitor
  // Returns temperature data
}
```

---

## Troubleshooting

### Check if LibreHardwareMonitor.exe is Running

**Windows Task Manager:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Details" tab
3. Look for "LibreHardwareMonitor.exe"

**Command Line:**
```cmd
tasklist /FI "IMAGENAME eq LibreHardwareMonitor.exe"
```

### Manual Start (for testing)

**Development:**
```cmd
cd resources\LibreHardwareMonitor
LibreHardwareMonitor.exe -minimized
```

**Production:**
```cmd
cd "C:\Users\[Username]\AppData\Local\Programs\RFID NDC123 Client\resources\LibreHardwareMonitor"
LibreHardwareMonitor.exe -minimized
```

### Check Logs

The client logs hardware monitor status to:
- Console output (when running in development)
- `rfid-client-debug.log` (in application directory)

Look for these messages:
- `[HWMonitor] LibreHardwareMonitor path: ...`
- `[HWMonitor] Starting LibreHardwareMonitor...`
- `✅ LibreHardwareMonitor started successfully`
- `⚠️ LibreHardwareMonitor not available`

---

## Related Files

| File | Purpose |
|------|---------|
| `client/main.js` | Entry point - starts HardwareMonitorManager |
| `client/hardware-monitor-manager.js` | Manages LibreHardwareMonitor.exe lifecycle |
| `client/windows-hardware-monitor.js` | Reads data from LibreHardwareMonitor via WMI |
| `client/pc-logger.js` | Uses hardware data for monitoring |
| `resources/LibreHardwareMonitor/LibreHardwareMonitor.exe` | The actual monitoring executable |

---

## Summary

**Where it runs:** Line 304 in `client/main.js`
```javascript
const hwMonitorStarted = await hardwareMonitor.start();
```

**How it runs:** Line 72 in `client/hardware-monitor-manager.js`
```javascript
this.lhmProcess = spawn(this.lhmPath, ['-minimized'], {
  detached: true,
  stdio: 'ignore',
  windowsHide: false
});
```

**When it runs:** Automatically when the RFID client application starts, before the logger process begins monitoring.