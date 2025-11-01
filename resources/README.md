# Resources Folder

This folder contains external resources bundled with the RFID client installer.

## LibreHardwareMonitor

**Purpose:** Provides CPU temperature monitoring on Windows systems.

**Location:** `LibreHardwareMonitor/`

**Download:** Run `node download-librehardwaremonitor.js` from the project root to download the latest version.

**Version:** Check `LibreHardwareMonitor/version.txt` for the current version.

**License:** LibreHardwareMonitor is licensed under the Mozilla Public License 2.0 (MPL 2.0)
- Source: https://github.com/LibreHardwareMonitor/LibreHardwareMonitor
- License: https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/blob/master/LICENSE

## How It's Used

When the RFID client starts:
1. `HardwareMonitorManager` checks if LibreHardwareMonitor exists
2. Starts `LibreHardwareMonitor.exe` in minimized mode
3. `WindowsHardwareMonitor` reads temperature data via WMI
4. Data is sent to the server along with other metrics

## Building Without LibreHardwareMonitor

If you want to build the installer without LibreHardwareMonitor:
1. Skip the download step
2. The client will still work, but CPU temperature will return `null`
3. Overclocking detection will still work (doesn't require LibreHardwareMonitor)

## Updating LibreHardwareMonitor

To update to a newer version:
```bash
# From project root
rmdir /s /q resources\LibreHardwareMonitor
node download-librehardwaremonitor.js
```

