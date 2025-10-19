# 🎯 Tray-Based Client Application Guide
## RFID Monitor - System Tray Interface

### 📋 Overview

The RFID monitoring client now runs as a **system tray application** without a visible window. Users can access settings, licensing information, and status through right-click context menus.

---

## 🖥️ System Tray Features

### **Tray Icon**
- **Location**: System tray (bottom-right corner of Windows)
- **Icon**: RFID Monitor icon with "R" symbol
- **Tooltip**: "RFID Laboratory Monitor"

### **Right-Click Menu Options**

#### 1. **Settings** ⚙️
- Configure server IP address
- Set WebSocket port
- Adjust reconnection settings
- View current status
- Restart logger service

#### 2. **Licensing & Documentation** 📄
- Software license information
- Privacy policy details
- Support contact information
- System requirements
- Troubleshooting guide

#### 3. **View Status** 📊
- Real-time system status
- Logger running status
- Connection information
- Uptime and version details

#### 4. **Exit** 🚪
- Safely close the application
- Stop all monitoring processes

---

## 🔧 Configuration

### **Settings Window Features**

#### **Server Configuration**
- **Server IP Address**: Central server IP (default: 192.168.1.100)
- **WebSocket Port**: Communication port (default: 8080)
- **Reconnection Interval**: Retry interval in milliseconds (default: 5000ms)
- **Max Reconnection Attempts**: Maximum retry attempts (default: 10)

#### **Status Monitoring**
- **Logger Status**: Running/Stopped indicator
- **Uptime**: Application runtime
- **Version**: Current application version
- **Server Address**: Connected server details

#### **Control Functions**
- **Save Settings**: Apply configuration changes
- **Restart Logger**: Restart monitoring service
- **Auto-refresh**: Status updates every 5 seconds

---

## 📱 User Interface

### **Settings Window**
```
┌─────────────────────────────────┐
│ ⚙️ Settings                     │
├─────────────────────────────────┤
│ Server IP: [192.168.1.100    ] │
│ Port:      [8080             ] │
│ Reconnect: [5000ms           ] │
│ Max Retry: [10               ] │
│                                 │
│ [💾 Save Settings] [🔄 Restart] │
│                                 │
│ 📊 Current Status              │
│ ● Logger: Running              │
│ ⏱️ Uptime: 2h 15m 30s         │
│ 📋 Version: 1.0.0              │
│ 🌐 Server: 192.168.1.100:8080  │
└─────────────────────────────────┘
```

### **Licensing Window**
```
┌─────────────────────────────────┐
│ 📄 Licensing & Documentation    │
├─────────────────────────────────┤
│ [Overview] [License] [Privacy]  │
│                                 │
│ 🔍 System Overview             │
│ • Real-time application usage   │
│ • Browser activity tracking     │
│ • System resource monitoring    │
│ • Centralized data collection   │
│                                 │
│ 📋 Version Information         │
│ Application Version: 1.0.0      │
│ Build Date: 2024-01-15          │
│ Node.js Version: 18.17.0        │
│ Electron Version: 37.2.3        │
└─────────────────────────────────┘
```

### **Status Window**
```
┌─────────────────────────────────┐
│ 📊 System Status                │
├─────────────────────────────────┤
│ ● Logger Status: Running        │
│ ⏱️ Uptime: 2h 15m 30s          │
│ 📋 Version: 1.0.0               │
│ 🌐 Server: 192.168.1.100:8080   │
│ 🔗 Connection: Connected        │
│ 📊 Data Collection: Active      │
│                                 │
│ [🔄 Refresh Status]             │
│                                 │
│ Last updated: 14:30:25          │
└─────────────────────────────────┘
```

---

## 🚀 Installation & Usage

### **Installation**
1. **Run the installer** or extract the application
2. **First launch** will create system tray icon
3. **No visible window** - application runs in background
4. **Automatic startup** - starts with Windows

### **Daily Usage**
1. **Right-click tray icon** to access menu
2. **Select "Settings"** to configure server
3. **Check "View Status"** for system health
4. **Use "Licensing & Documentation"** for help

### **Configuration**
1. **Right-click tray icon** → **Settings**
2. **Enter server IP address** (e.g., 192.168.1.100)
3. **Set WebSocket port** (default: 8080)
4. **Click "Save Settings"**
5. **Restart logger** if needed

---

## 🔒 Security & Privacy

### **Data Collection**
- **Application usage** monitoring
- **Browser activity** tracking
- **System resource** information
- **No personal data** collection

### **Data Transmission**
- **Encrypted communication** with server
- **Secure WebSocket** connection
- **Local configuration** storage
- **No external data** sharing

### **Access Control**
- **Administrator privileges** required for installation
- **Local configuration** files only
- **No remote access** capabilities
- **User-controlled** settings

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **Tray Icon Not Visible**
- Check system tray settings
- Ensure application is running
- Restart the application
- Check Windows notification area

#### **Settings Not Saving**
- Run as administrator
- Check file permissions
- Verify disk space
- Restart application

#### **Connection Issues**
- Verify server IP address
- Check network connectivity
- Confirm firewall settings
- Test server availability

#### **Status Not Updating**
- Restart logger service
- Check application logs
- Verify server connection
- Update configuration

### **Log Files**
- **Client Logs**: `C:\RFID-Client\logs\client.log`
- **Deployment Logs**: `C:\RFID-Client\deployment.log`
- **System Logs**: Windows Event Viewer

---

## 📞 Support

### **Getting Help**
1. **Right-click tray icon** → **Licensing & Documentation**
2. **Check Support tab** for contact information
3. **Review troubleshooting** section
4. **Contact system administrator**

### **Contact Information**
- **System Administrator**: [Your Contact]
- **IT Support**: [IT Contact]
- **Project Lead**: [Lead Contact]

---

## 🎯 Benefits of Tray-Based Design

### **User Experience**
✅ **Minimal interface** - No cluttered windows  
✅ **Always accessible** - Right-click from anywhere  
✅ **Background operation** - Runs silently  
✅ **Quick access** - Instant settings and status  

### **System Integration**
✅ **Windows integration** - Native tray support  
✅ **Startup integration** - Auto-start with Windows  
✅ **Resource efficient** - Minimal memory usage  
✅ **Professional appearance** - Clean, modern interface  

### **Administrative Benefits**
✅ **Centralized management** - Easy deployment  
✅ **Remote configuration** - Server-based settings  
✅ **Status monitoring** - Real-time health checks  
✅ **Troubleshooting support** - Built-in diagnostics  

---

## 🔄 Updates & Maintenance

### **Automatic Updates**
- **Background updates** via deployment scripts
- **Configuration preservation** during updates
- **Seamless restarts** without user intervention
- **Version tracking** and status reporting

### **Manual Updates**
- **Right-click tray** → **Settings** → **Restart Logger**
- **Check status** for update confirmation
- **Verify connectivity** after updates
- **Contact support** if issues persist

---

**🎉 Your RFID monitoring client now runs efficiently in the system tray with full configuration and status access!**
