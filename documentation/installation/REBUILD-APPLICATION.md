# Rebuild Application Guide

## Problem Fixed

The built application was missing the `windows-hardware-monitor.js` file, causing the error:
```
Error: Cannot find module './windows-hardware-monitor'
```

This has been fixed by adding `client/windows-hardware-monitor.js` to the `asarUnpack` list in `package.json`.

## Steps to Rebuild

### 1. Update Configuration

First, make sure the config.json has the correct server IP:

```json
{
  "serverIP": "192.168.1.11",
  "serverPort": 8080
}
```

Or run:
```bash
update-client-config.bat
```

### 2. Clean Previous Build

```bash
# Remove old build artifacts
rmdir /s /q dist
rmdir /s /q node_modules\.cache
```

### 3. Install Dependencies (if needed)

```bash
npm install
```

### 4. Build the Application

```bash
npm run build
```

This will:
1. Download LibreHardwareMonitor (if not present)
2. Package the application with electron-builder
3. Create the installer in the `dist` folder

### 5. Install the New Build

1. Navigate to the `dist` folder
2. Run the installer (e.g., `RFID NDC123 Client Setup 1.2.0.exe`)
3. Follow the installation wizard

### 6. Update Config (if needed)

After installation, if the server IP is different, run:
```bash
update-client-config.bat
```

This will update the config in the installed application directory.

### 7. Verify Installation

1. **Check if the application starts:**
   - Look for the RFID icon in the system tray

2. **Check if LibreHardwareMonitor starts:**
   - Open Task Manager
   - Look for "LibreHardwareMonitor.exe" in the Details tab

3. **Check if it connects to the server:**
   - On the server console, you should see:
     ```
     💻 PC connected
     ▶ Started session for [PC_NAME]
     📊 Received system info from [PC_NAME]
     ```

4. **Check the client logs:**
   - Navigate to: `C:\Users\[Username]\AppData\Local\Programs\RFID NDC123 Client`
   - Look for `rfid-client-debug.log`
   - Should NOT contain the error: `Cannot find module './windows-hardware-monitor'`

## Troubleshooting

### Build Fails

**Error: Cannot find module 'electron-builder'**
```bash
npm install --save-dev electron-builder
```

**Error: LibreHardwareMonitor not found**
```bash
node download-librehardwaremonitor.js
```

### Application Doesn't Connect

1. **Check server is running:**
   ```bash
   node server/server.js
   ```

2. **Check server IP in config:**
   ```bash
   # Should match the IP shown in server console
   # Update if needed
   update-client-config.bat
   ```

3. **Check firewall:**
   - Windows Firewall might block port 8080
   - Add inbound rule for port 8080

### Still Getting Module Not Found Error

If you still get the error after rebuilding:

1. **Verify package.json has the fix:**
   ```json
   "asarUnpack": [
     "client/pc-logger.js",
     "client/config.js",
     "client/windows-hardware-monitor.js",  // <-- This line should be present
     ...
   ]
   ```

2. **Clean and rebuild:**
   ```bash
   rmdir /s /q dist
   rmdir /s /q node_modules\.cache
   npm run build
   ```

3. **Check the unpacked files:**
   After installation, verify that `windows-hardware-monitor.js` exists at:
   ```
   C:\Users\[Username]\AppData\Local\Programs\RFID NDC123 Client\resources\app.asar.unpacked\client\windows-hardware-monitor.js
   ```

## Quick Rebuild Script

Create a file `rebuild.bat`:

```batch
@echo off
echo ========================================
echo Rebuilding RFID NDC123 Client
echo ========================================

echo.
echo Step 1: Cleaning old build...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Step 2: Building application...
call npm run build

echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo Installer location: dist\RFID NDC123 Client Setup 1.2.0.exe
echo.
pause
```

Then run:
```bash
rebuild.bat
```

## Changes Made

### package.json
- Added `client/windows-hardware-monitor.js` to `asarUnpack` array
- This ensures the file is extracted from the asar archive and accessible to the application

### Why This Fix Works

Electron packages most files into an `app.asar` archive for faster loading. However, some files (like native modules and files loaded dynamically) need to be unpacked. The `windows-hardware-monitor.js` file is required by `pc-logger.js` at runtime, so it must be in the unpacked directory.

## Files Updated

- ✅ `package.json` - Added windows-hardware-monitor.js to asarUnpack
- ✅ `config.json` - Updated with correct server IP
- ✅ `REBUILD-APPLICATION.md` - This guide