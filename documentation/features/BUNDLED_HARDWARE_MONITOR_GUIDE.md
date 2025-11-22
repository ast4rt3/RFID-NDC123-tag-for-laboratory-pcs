# Bundled LibreHardwareMonitor - Deployment Guide

## 🎉 Overview

Your RFID client installer now **automatically includes LibreHardwareMonitor**, which means:
- ✅ **CPU temperature monitoring works out-of-the-box** on all lab PCs
- ✅ **No manual installation required** on each PC
- ✅ **Automatic startup** when the RFID client starts
- ✅ **One installer for everything** - simplified deployment

---

## 📦 What's Included

The installer now bundles:
1. **RFID Client Application** - Your monitoring software
2. **LibreHardwareMonitor** - Hardware monitoring driver (for CPU temperature)
3. **All dependencies** - Node.js modules, etc.

### Features That Work Automatically:
- ✅ **CPU Temperature Monitoring** - Works immediately after installation
- ✅ **CPU Overclocking Detection** - Works immediately (no drivers needed)
- ✅ **RAM Overclocking Detection** - Works immediately (no drivers needed)

---

## 🔨 Building the Installer

### Prerequisites
- Windows PC with Node.js installed
- Internet connection (to download LibreHardwareMonitor)

### Build Steps

#### Option 1: Using the Build Script (Recommended)
```bash
# Simply run the build script
build-installer.bat
```

The script will:
1. Install npm dependencies
2. Download the latest LibreHardwareMonitor
3. Bundle everything together
4. Create the installer in `dist/` folder

#### Option 2: Manual Steps
```bash
# 1. Install dependencies
npm install

# 2. Download LibreHardwareMonitor
node download-librehardwaremonitor.js

# 3. Build the installer
npm run build-installer
```

### Build Output
After building, you'll find:
- **Installer**: `dist/RFID NDC123 Client Setup X.X.X.exe`
- **Size**: ~150-200 MB (includes LibreHardwareMonitor)

---

## 🚀 Deploying to Lab PCs

### Installation Process

1. **Copy the installer** to each lab PC (or network share)
2. **Run the installer** as Administrator
   - Right-click → "Run as Administrator"
   - Follow the installation wizard
3. **Done!** The RFID client will start automatically

### What Happens During Installation:
- ✅ RFID client installed to `C:\Program Files\RFID NDC123 Client\`
- ✅ LibreHardwareMonitor installed to `C:\Program Files\RFID NDC123 Client\resources\LibreHardwareMonitor\`
- ✅ Desktop shortcut created
- ✅ Start menu shortcut created

### What Happens When Client Starts:
1. **LibreHardwareMonitor starts automatically** in the background
2. **Runs minimized** to system tray (not intrusive)
3. **RFID client connects** to the server
4. **Hardware monitoring begins** immediately
   - CPU temperature ✅
   - CPU overclocking status ✅
   - RAM overclocking status ✅

---

## ⚙️ How It Works

### Automatic Startup Flow

```
User starts RFID Client
         ↓
main.js initializes
         ↓
HardwareMonitorManager checks if LibreHardwareMonitor exists
         ↓
Starts LibreHardwareMonitor.exe (minimized)
         ↓
Waits 2 seconds for initialization
         ↓
Starts pc-logger.js (monitoring process)
         ↓
WindowsHardwareMonitor reads data from LibreHardwareMonitor via WMI
         ↓
Data sent to server every 3 seconds
```

### File Structure After Installation

```
C:\Program Files\RFID NDC123 Client\
├── RFID NDC123 Client.exe          (Main application)
├── resources\
│   ├── app.asar                     (Application code)
│   ├── app.asar.unpacked\           (Unpacked modules)
│   └── LibreHardwareMonitor\        (Hardware monitor)
│       ├── LibreHardwareMonitor.exe
│       ├── LibreHardwareMonitorLib.dll
│       └── ... (other DLL files)
└── config.json                      (Server configuration)
```

---

## 🧪 Testing

### Test on a Single PC First

1. **Build the installer**
   ```bash
   build-installer.bat
   ```

2. **Install on a test PC**
   - Run the installer as Administrator
   - Complete the installation

3. **Verify LibreHardwareMonitor is running**
   - Open Task Manager (Ctrl+Shift+Esc)
   - Look for "LibreHardwareMonitor.exe" in Processes
   - Should be running in background

4. **Check system tray**
   - Look for LibreHardwareMonitor icon (thermometer icon)
   - Right-click → Should show CPU temperatures

5. **Verify RFID client is monitoring**
   - Check server logs or database
   - Should see `cpu_temperature` with actual values (not null)
   - Should see `is_cpu_overclocked` and `is_ram_overclocked` values

### Expected Results

**In Database:**
```sql
SELECT 
  pc_name, 
  cpu_temperature, 
  is_cpu_overclocked, 
  is_ram_overclocked,
  created_at
FROM app_usage_logs
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Output:**
```
pc_name     | cpu_temperature | is_cpu_overclocked | is_ram_overclocked | created_at
------------|-----------------|--------------------|--------------------|-------------------
LAB-PC-01   | 45.5            | false              | false              | 2025-11-01 10:30:00
LAB-PC-01   | 46.0            | false              | false              | 2025-11-01 10:29:57
LAB-PC-01   | 45.8            | false              | false              | 2025-11-01 10:29:54
```

✅ **Success**: Temperature shows actual values (not null)

---

## 🔧 Troubleshooting

### Issue: LibreHardwareMonitor not starting

**Check:**
1. Open Task Manager → Look for "LibreHardwareMonitor.exe"
2. If not running, check client logs

**Solution:**
- Ensure installer was run as Administrator
- Check if antivirus is blocking it
- Manually start: `C:\Program Files\RFID NDC123 Client\resources\LibreHardwareMonitor\LibreHardwareMonitor.exe`

### Issue: Temperature still showing null

**Possible causes:**
1. LibreHardwareMonitor not running
2. WMI not enabled in LibreHardwareMonitor
3. Hardware doesn't support temperature sensors

**Solution:**
1. Check if LibreHardwareMonitor is running (Task Manager)
2. Open LibreHardwareMonitor manually → Options → Enable WMI
3. Restart RFID client

### Issue: "Access Denied" errors

**Cause:** LibreHardwareMonitor needs Administrator privileges

**Solution:**
- Run RFID client as Administrator
- Or: Configure to always run as Administrator:
  - Right-click RFID client shortcut
  - Properties → Compatibility → "Run as Administrator"

### Issue: Installer is too large

**Current size:** ~150-200 MB (with LibreHardwareMonitor)

**Options:**
1. **Keep it bundled** (recommended) - Easier deployment
2. **Separate installer** - Create two installers:
   - RFID Client only (~50 MB)
   - LibreHardwareMonitor separate (~5 MB)

---

## 📊 Deployment Strategies

### Strategy 1: Manual Installation (Small Labs)
- Copy installer to USB drive
- Install on each PC manually
- Best for: 5-20 PCs

### Strategy 2: Network Share (Medium Labs)
- Place installer on network share
- Users run from network
- Best for: 20-50 PCs

### Strategy 3: Group Policy Deployment (Large Labs)
- Use GPO to deploy MSI installer
- Automatic installation on all domain PCs
- Best for: 50+ PCs

**Note:** Current installer is NSIS (.exe). For GPO, you may need to convert to MSI.

### Strategy 4: Silent Installation (Automated)
```bash
# Silent install (no UI)
"RFID NDC123 Client Setup.exe" /S

# Silent install with custom directory
"RFID NDC123 Client Setup.exe" /S /D=C:\CustomPath
```

---

## ✅ Advantages of Bundled Approach

### For IT Administrators:
- ✅ **Single installer** - No need to install multiple components
- ✅ **Consistent deployment** - Same setup on all PCs
- ✅ **Automatic updates** - Update both components together
- ✅ **Less support calls** - Everything works out-of-the-box

### For End Users:
- ✅ **Zero configuration** - Just install and it works
- ✅ **Automatic startup** - No manual steps needed
- ✅ **Invisible operation** - Runs in background

### For Developers:
- ✅ **Version control** - Bundle specific LibreHardwareMonitor version
- ✅ **Compatibility** - Tested combination of components
- ✅ **Simplified testing** - One package to test

---

## 🔄 Updating LibreHardwareMonitor

To update to a newer version of LibreHardwareMonitor:

1. **Delete old version**
   ```bash
   rmdir /s /q resources\LibreHardwareMonitor
   ```

2. **Download new version**
   ```bash
   node download-librehardwaremonitor.js
   ```

3. **Rebuild installer**
   ```bash
   npm run build-installer
   ```

4. **Deploy updated installer** to lab PCs

---

## 📝 Summary

### What You Get:
- ✅ **One-click installation** for lab PCs
- ✅ **CPU temperature monitoring** works immediately
- ✅ **Overclocking detection** works immediately
- ✅ **Automatic startup** of all components
- ✅ **Simplified deployment** - no manual steps

### Next Steps:
1. ✅ Build the installer: `build-installer.bat`
2. ✅ Test on one PC
3. ✅ Verify temperature data in database
4. ✅ Deploy to all lab PCs
5. ✅ Monitor from central dashboard

---

## 🎯 Quick Start Checklist

- [ ] Run `build-installer.bat`
- [ ] Verify installer created in `dist/` folder
- [ ] Test install on one PC
- [ ] Check Task Manager for LibreHardwareMonitor.exe
- [ ] Verify temperature data in database (not null)
- [ ] Deploy to remaining lab PCs
- [ ] Monitor all PCs from dashboard

**You're ready to deploy! 🚀**

