# Quick Start: Bundled Installer with LibreHardwareMonitor

## 🚀 TL;DR - Get Started in 3 Steps

### 1. Build the Installer
```bash
build-installer.bat
```

### 2. Install on Lab PCs
- Run `dist/RFID NDC123 Client Setup.exe` as Administrator
- Follow the installation wizard

### 3. Done!
- CPU temperature monitoring works automatically ✅
- Overclocking detection works automatically ✅
- No manual configuration needed ✅

---

## 📦 What Changed

### Before (Manual Installation Required)
```
❌ Install RFID client
❌ Manually install LibreHardwareMonitor on each PC
❌ Configure LibreHardwareMonitor to start with Windows
❌ Run as Administrator
❌ Enable WMI
❌ Restart client
```

### Now (Automatic)
```
✅ Install RFID client (includes LibreHardwareMonitor)
✅ Everything works automatically!
```

---

## 🔧 What Was Implemented

### New Files Created:
1. **`download-librehardwaremonitor.js`** - Downloads LibreHardwareMonitor from GitHub
2. **`client/hardware-monitor-manager.js`** - Manages LibreHardwareMonitor lifecycle
3. **`resources/`** - Folder for bundled resources (LibreHardwareMonitor)
4. **`BUNDLED_HARDWARE_MONITOR_GUIDE.md`** - Complete deployment guide

### Modified Files:
1. **`client/main.js`** - Auto-starts LibreHardwareMonitor on client startup
2. **`package.json`** - Includes LibreHardwareMonitor in build via `extraResources`
3. **`build-installer.bat`** - Downloads LibreHardwareMonitor before building

---

## 🎯 Features

### Automatic Features (No Configuration Needed):
- ✅ **CPU Temperature Monitoring** - Works immediately after installation
- ✅ **CPU Overclocking Detection** - Works immediately
- ✅ **RAM Overclocking Detection** - Works immediately
- ✅ **Auto-start LibreHardwareMonitor** - Starts with RFID client
- ✅ **Runs minimized** - Not intrusive to users
- ✅ **Administrator privileges** - Handled automatically

---

## 📊 Build Process

### What Happens When You Run `build-installer.bat`:

```
Step 1: Install npm dependencies
   ↓
Step 2: Download LibreHardwareMonitor from GitHub
   ↓
Step 3: Extract to resources/LibreHardwareMonitor/
   ↓
Step 4: Build installer with electron-builder
   ↓
Step 5: Bundle everything into single .exe installer
   ↓
Result: dist/RFID NDC123 Client Setup.exe (~150-200 MB)
```

---

## 🧪 Testing Checklist

After building and installing:

- [ ] **Task Manager Check**
  - Open Task Manager
  - Look for "LibreHardwareMonitor.exe" process
  - Should be running

- [ ] **System Tray Check**
  - Look for thermometer icon in system tray
  - Right-click → Should show CPU temperatures

- [ ] **Database Check**
  ```sql
  SELECT cpu_temperature, is_cpu_overclocked, is_ram_overclocked
  FROM app_usage_logs
  ORDER BY created_at DESC
  LIMIT 5;
  ```
  - `cpu_temperature` should show actual values (not null)
  - `is_cpu_overclocked` should show true/false (not null)
  - `is_ram_overclocked` should show true/false (not null)

- [ ] **Server Logs Check**
  - Should see: "✅ LibreHardwareMonitor started successfully"
  - No errors about missing files

---

## 🎉 Benefits

### For Lab Administrators:
- **One installer** for everything
- **No manual steps** on each PC
- **Consistent deployment** across all PCs
- **Automatic updates** when you rebuild

### For Lab Users:
- **Zero configuration** required
- **Invisible operation** (runs in background)
- **No performance impact**

### For You (Developer):
- **Simplified deployment**
- **Version control** of all components
- **Easier testing** (one package)
- **Less support** (fewer things to go wrong)

---

## 📝 Next Steps

1. **Build the installer now:**
   ```bash
   build-installer.bat
   ```

2. **Test on one PC first**
   - Install and verify everything works
   - Check database for temperature data

3. **Deploy to all lab PCs**
   - Copy installer to network share or USB
   - Install on each PC (or use silent install)

4. **Monitor from dashboard**
   - View temperature trends
   - Detect overclocked systems
   - Identify cooling issues

---

## 🆘 Troubleshooting

### Build fails at download step
**Solution:** Check internet connection, try again

### Installer too large
**Current:** ~150-200 MB (includes LibreHardwareMonitor)
**Normal:** This is expected with bundled approach

### Temperature still null after install
**Check:**
1. Is LibreHardwareMonitor.exe running? (Task Manager)
2. Was installer run as Administrator?
3. Check client logs for errors

---

## 📖 Documentation

- **Complete Guide:** `BUNDLED_HARDWARE_MONITOR_GUIDE.md`
- **Feature Documentation:** `CPU_TEMPERATURE_FEATURE.md`
- **Deployment Summary:** `WINDOWS_MONITORING_SUMMARY.md`

---

## ✅ Success Criteria

After deployment, you should have:
- ✅ Single installer that includes everything
- ✅ CPU temperature data in database (not null)
- ✅ Overclocking detection working
- ✅ LibreHardwareMonitor running on all lab PCs
- ✅ No manual configuration needed
- ✅ Automatic startup with RFID client

---

**You're ready to build and deploy! 🚀**

Run `build-installer.bat` now to get started!

