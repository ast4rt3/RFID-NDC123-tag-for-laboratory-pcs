# 📦 Manual Deployment Guide
## RFID Monitor - Flash Drive Installation with Auto-Updates

### 📋 Overview

This guide explains how to manually deploy the RFID monitoring system using a flash drive, while maintaining automatic update capabilities for installed clients.

---

## 🎯 **Deployment Strategy**

### **Manual Installation Process**
1. **Create installer** on central server
2. **Copy to flash drive** for distribution
3. **Install on each PC** manually
4. **Configure auto-updates** for future maintenance

### **Auto-Update System**
- ✅ **Automatic update checks** on startup
- ✅ **Tray menu integration** for manual checks
- ✅ **Background download** of updates
- ✅ **User notification** when updates are ready
- ✅ **One-click restart** to apply updates

---

## 🖥️ **Server Setup (Central PC)**

### **Step 1: Build the Installer**

```powershell
# Navigate to project directory
cd C:\RFID-Server

# Install dependencies
npm install

# Build the installer
npm run build-installer

# The installer will be created in: dist/RFID NDC123 Client Setup.exe
```

### **Step 2: Configure Auto-Update Server**

You have several options for hosting updates:

#### **Option A: GitHub Releases (Recommended)**
```json
// In package.json, update the publish section:
"publish": {
  "provider": "github",
  "owner": "your-github-username",
  "repo": "rfid-monitor-releases"
}
```

#### **Option B: Your Own Server**
```json
// In package.json, update the publish section:
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates/"
}
```

#### **Option C: Local Network Server**
```json
// In package.json, update the publish section:
"publish": {
  "provider": "generic",
  "url": "http://192.168.1.100:3000/updates/"
}
```

### **Step 3: Create Update Server (If using local network)**

Create a simple update server:

```javascript
// update-server.js
const express = require('express');
const path = require('path');
const app = express();

app.use('/updates', express.static(path.join(__dirname, 'dist')));

app.get('/updates/latest.yml', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'latest.yml'));
});

app.listen(3000, () => {
  console.log('Update server running on port 3000');
});
```

---

## 💾 **Flash Drive Preparation**

### **Step 1: Prepare Installation Package**

```
📁 RFID-Monitor-Flash-Drive/
├── 📄 RFID NDC123 Client Setup.exe
├── 📄 README-Installation.txt
├── 📄 Server-Configuration.txt
└── 📁 Documentation/
    ├── 📄 User-Manual.pdf
    ├── 📄 Troubleshooting-Guide.pdf
    └── 📄 Support-Contacts.txt
```

### **Step 2: Create Installation Instructions**

Create `README-Installation.txt`:

```
RFID Laboratory Monitor - Installation Instructions
=================================================

1. INSTALLATION:
   - Run "RFID NDC123 Client Setup.exe" as Administrator
   - Follow the installation wizard
   - The application will start automatically in system tray

2. CONFIGURATION:
   - Right-click the RFID icon in system tray (bottom-right)
   - Select "Settings"
   - Enter server IP address: [YOUR_SERVER_IP]
   - Click "Save Settings"

3. VERIFICATION:
   - Right-click tray icon → "View Status"
   - Verify "Logger Status: Running"
   - Check "Server Address" matches your configuration

4. UPDATES:
   - Updates are automatic and will be downloaded in background
   - You'll be notified when updates are ready
   - Right-click tray icon → "Check for Updates" for manual check

5. SUPPORT:
   - Check Documentation folder for detailed guides
   - Contact: [YOUR_CONTACT_INFO]
```

### **Step 3: Create Server Configuration File**

Create `Server-Configuration.txt`:

```
RFID Monitor Server Configuration
================================

Server IP Address: 192.168.1.100
WebSocket Port: 8080
Web Dashboard: http://192.168.1.100:3000

Update Server: http://192.168.1.100:3000/updates/
(For automatic updates)

Contact Information:
- System Administrator: [YOUR_CONTACT]
- IT Support: [IT_CONTACT]
- Project Lead: [LEAD_CONTACT]
```

---

## 🖥️ **Client PC Installation**

### **Step 1: Installation Process**

1. **Insert flash drive** into laboratory PC
2. **Run installer** as Administrator:
   ```
   RFID NDC123 Client Setup.exe
   ```
3. **Follow installation wizard**:
   - Choose installation directory (default: `C:\Program Files\RFID Monitor`)
   - Create desktop shortcut (optional)
   - Start application after installation

### **Step 2: Initial Configuration**

1. **Application starts** in system tray (no visible window)
2. **Right-click tray icon** → **Settings**
3. **Configure server**:
   - Server IP: `192.168.1.100` (or your server IP)
   - Port: `8080`
   - Click **Save Settings**
4. **Verify connection**:
   - Right-click tray icon → **View Status**
   - Check "Logger Status: Running"

### **Step 3: Verify Auto-Update**

1. **Right-click tray icon** → **Check for Updates**
2. **System will check** for available updates
3. **Updates download** automatically in background
4. **Notification appears** when update is ready

---

## 🔄 **Update Process**

### **Automatic Updates**

#### **How It Works:**
1. **Client checks** for updates on startup
2. **Background download** if update available
3. **Tray notification** when download complete
4. **User prompted** to restart for update

#### **Tray Menu Options:**
```
┌─────────────────────────────┐
│ RFID Laboratory Monitor     │
├─────────────────────────────┤
│ ⚙️ Settings                │
│ 📄 Licensing & Documentation│
├─────────────────────────────┤
│ 📊 View Status             │
├─────────────────────────────┤
│ 🔍 Check for Updates       │  ← Manual check
│ ⬇️ Download Update         │  ← When available
│ 🔄 Restart to Update       │  ← When ready
├─────────────────────────────┤
│ 🚪 Exit                    │
└─────────────────────────────┘
```

### **Manual Update Process**

#### **For You (System Administrator):**

1. **Build new version**:
   ```powershell
   npm run build-installer
   ```

2. **Publish update**:
   ```powershell
   # For GitHub releases
   npm run publish
   
   # For local server
   copy dist\*.exe C:\RFID-Server\updates\
   copy dist\latest.yml C:\RFID-Server\updates\
   ```

3. **Update version number** in `package.json`:
   ```json
   "version": "1.0.1"
   ```

#### **For End Users:**
- **No action required** - updates happen automatically
- **Tray notification** when update is ready
- **One-click restart** to apply update

---

## 📊 **Update Server Setup (Optional)**

### **Local Network Update Server**

If you want to host updates on your local network:

#### **Step 1: Create Update Server**
```javascript
// Create update-server.js
const express = require('express');
const path = require('path');
const app = express();

app.use('/updates', express.static(path.join(__dirname, 'dist')));

app.get('/updates/latest.yml', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'latest.yml'));
});

app.listen(3000, () => {
  console.log('Update server running on http://192.168.1.100:3000');
});
```

#### **Step 2: Start Update Server**
```powershell
node update-server.js
```

#### **Step 3: Update Client Configuration**
```json
// In package.json
"publish": {
  "provider": "generic",
  "url": "http://192.168.1.100:3000/updates/"
}
```

---

## 🎯 **Benefits of This Approach**

### **For You (Administrator):**
✅ **Simple deployment** - Just copy installer to flash drive  
✅ **Easy updates** - Build and publish new versions  
✅ **Centralized control** - All clients update automatically  
✅ **No manual intervention** - Users get updates seamlessly  

### **For End Users:**
✅ **One-time installation** - No complex setup  
✅ **Automatic updates** - No manual update process  
✅ **System tray integration** - Clean, professional interface  
✅ **Easy configuration** - Right-click access to settings  

### **For Maintenance:**
✅ **Version tracking** - Know which clients have which version  
✅ **Rollback capability** - Can revert to previous versions  
✅ **Update notifications** - Users know when updates are available  
✅ **Background downloads** - No interruption to work  

---

## 🛠️ **Troubleshooting Updates**

### **Common Issues:**

#### **Update Not Available**
- Check update server is running
- Verify version number is higher than current
- Check network connectivity

#### **Update Download Failed**
- Check disk space on client PC
- Verify update server accessibility
- Check firewall settings

#### **Update Installation Failed**
- Ensure application is not running
- Check file permissions
- Verify installer integrity

### **Manual Update Process (Fallback):**
1. **Download new installer** from flash drive
2. **Uninstall old version** from Control Panel
3. **Install new version** from flash drive
4. **Reconfigure settings** if needed

---

## 📞 **Support & Maintenance**

### **For System Administrators:**
- **Build process**: `npm run build-installer`
- **Update process**: `npm run publish`
- **Version management**: Update `package.json` version
- **Server monitoring**: Check update server logs

### **For End Users:**
- **Installation**: Run installer from flash drive
- **Configuration**: Right-click tray icon → Settings
- **Updates**: Automatic, with tray notifications
- **Support**: Check Documentation folder

### **Contact Information:**
- **System Administrator**: [Your Contact]
- **IT Support**: [IT Contact]
- **Project Lead**: [Lead Contact]

---

## 🎉 **Summary**

Your RFID monitoring system now supports:

✅ **Manual deployment** via flash drive  
✅ **Automatic updates** for installed clients  
✅ **System tray interface** with update options  
✅ **Professional installation** experience  
✅ **Easy maintenance** and version management  

**The best of both worlds: Simple manual deployment with sophisticated auto-update capabilities!**
