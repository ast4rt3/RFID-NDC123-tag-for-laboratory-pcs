# APPENDIX B: SOURCE CODE / CORE SCRIPTS

## B.1 Electron Client Application

### B.1.1 Main Process (`client/main.js`)
Handles application lifecycle, system tray integration, and background process management.

```javascript
const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const HardwareMonitorManager = require('./hardware-monitor-manager');

let loggerProcess;
let tray;
let settingsWindow;
let statusWindow;
let hardwareMonitor;
let currentIdleStatus = false;

// Create system tray icon
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (error) {
    trayIcon = nativeImage.createEmpty();
  }

  if (trayIcon.isEmpty()) {
    const size = 16;
    trayIcon = nativeImage.createFromDataURL(`data:image/png;base64,${Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#4f46e5"/>
        <text x="8" y="12" font-family="Arial" font-size="10" fill="white" text-anchor="middle">R</text>
      </svg>
    `).toString('base64')}`);
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('RFID Laboratory Monitor');
  updateTrayMenu();
}

function updateTrayMenu() {
  const menuItems = [
    { label: 'RFID Laboratory Monitor', enabled: false },
    { type: 'separator' },
    { label: 'Settings', click: () => showSettingsWindow() },
    { type: 'separator' },
    { label: 'View Status', click: () => showStatusWindow() },
    { type: 'separator' },
    { label: 'Exit', click: () => app.quit() }
  ];
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

function showSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 500, height: 400, resizable: true, frame: true,
    title: 'RFID Monitor - Settings',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
  settingsWindow.on('close', (event) => {
    event.preventDefault();
    settingsWindow.hide();
  });
}

function showStatusWindow() {
  if (statusWindow) {
    statusWindow.show();
    statusWindow.focus();
    return;
  }
  statusWindow = new BrowserWindow({
    width: 400, height: 300, resizable: true, frame: true,
    title: 'RFID Monitor - Status',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  statusWindow.setMenuBarVisibility(false);
  statusWindow.loadFile(path.join(__dirname, 'status.html'));
  statusWindow.on('close', (event) => {
    event.preventDefault();
    statusWindow.hide();
  });
}

function getConfig() {
  try {
    const configPath = path.join(path.dirname(process.resourcesPath), 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) { console.error('Error reading config:', error); }
  return { serverIP: '192.168.1.100', serverPort: 8080 };
}

function saveConfig(config) {
  try {
    const configPath = path.join(path.dirname(process.resourcesPath), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

ipcMain.handle('get-config', () => getConfig());
ipcMain.handle('save-config', (event, config) => saveConfig(config));
ipcMain.handle('get-status', () => ({
  isRunning: !!loggerProcess,
  uptime: process.uptime(),
  version: app.getVersion(),
  config: getConfig(),
  isIdle: currentIdleStatus
}));

ipcMain.handle('restart-logger', () => {
  if (loggerProcess) loggerProcess.kill();
  setTimeout(() => startLoggerProcess(), 1000);
  return true;
});

function startLoggerProcess() {
  const isPackaged = app.isPackaged;
  const loggerPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'client', 'pc-logger.js')
    : path.join(__dirname, 'pc-logger.js');
  const nodeModulesPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules')
    : path.join(__dirname, '..', 'node_modules');

  loggerProcess = spawn(process.execPath, [loggerPath], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_PATH: nodeModulesPath }
  });

  if (loggerProcess && loggerProcess.stdout) {
    loggerProcess.stdout.on('data', (data) => console.log(`pc-logger: ${data}`));
    loggerProcess.stderr.on('data', (data) => console.error(`pc-logger error: ${data}`));
    loggerProcess.on('exit', (code) => {
      console.log(`Logger process exited with code ${code}`);
      setTimeout(() => {
        if (!loggerProcess || loggerProcess.killed) startLoggerProcess();
      }, 5000);
    });
    loggerProcess.on('message', (msg) => {
      if (msg && msg.type === 'idle-status') {
        currentIdleStatus = msg.isIdle;
        const wins = BrowserWindow.getAllWindows();
        wins.forEach(win => {
          if (win.title === 'RFID Monitor - Status') {
            win.webContents.send('idle-status-update', currentIdleStatus);
          }
        });
      }
    });
  }
}

app.whenReady().then(async () => {
  createTray();
  hardwareMonitor = new HardwareMonitorManager();
  await hardwareMonitor.start();
  startLoggerProcess();
  app.dock?.hide();
  
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (tray) tray.displayBalloon({ title: 'RFID Monitor', content: 'Already running.' });
    });
  }
});

app.on('window-all-closed', (event) => event.preventDefault());
app.on('before-quit', (event) => {
  event.preventDefault();
  if (loggerProcess) loggerProcess.kill();
  app.exit();
});
```

### B.1.2 Preload Script (`client/preload.js`)
Exposes safe APIs to the renderer process.

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  getStatus: () => ipcRenderer.invoke('get-status'),
  restartLogger: () => ipcRenderer.invoke('restart-logger'),
  onIdleStatusUpdate: (callback) => {
    const listener = (event, isIdle) => callback(isIdle);
    ipcRenderer.on('idle-status-update', listener);
    return () => ipcRenderer.removeListener('idle-status-update', listener);
  }
});
```

---

## B.2 Background Monitoring Services

### B.2.1 Core Logger Logic (`client/pc-logger.js`)
The central script for tracking activity, hardware stats, and communicating with the server.

```javascript
const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win');
const pidusage = require('pidusage');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');
const WindowsHardwareMonitor = require('./windows-hardware-monitor');
const HardwareMonitorManager = require('./hardware-monitor-manager');
const config = require('./config');

const pcName = os.hostname();
let ws = null;
let reconnectAttempts = 0;
let isReconnecting = false;
let lastApp = null;
let lastStart = new Date();
let appActive = false;
let isIdle = false;
let idleStartTime = null;
const IDLE_THRESHOLD_MS = 1 * 60 * 1000; // 1 minute

// Hardware Monitor Setup
let windowsHardwareMonitor = null;
if (process.platform === 'win32') {
  try {
    windowsHardwareMonitor = new WindowsHardwareMonitor();
  } catch (error) {
    console.error('Failed to initialize Windows hardware monitor:', error.message);
  }
}

// WebSocket Connection
function connect() {
  const wsUrl = config.getWebSocketURL() || 'ws://127.0.0.1:8080';
  ws = new WebSocket(wsUrl);

  ws.on('open', async () => {
    console.log('Connected to server');
    sendMessage({ type: 'start', pc_name: pcName });
    setupAppUsageTracking();
    setupIdleDetection();
    setupHeartbeat();
    setupBrowserHistoryTracking();
    setupSystemLoadTracking();
    setTimeout(sendSystemInfo, 2000);
  });

  ws.on('close', () => {
    console.log('Disconnected');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => console.error('WebSocket error:', err.message));
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// App Usage Tracking
function setupAppUsageTracking() {
  setInterval(async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const result = await activeWin();
    if (!result) return;

    const appName = result.owner.name;
    const windowTitle = result.title || '';
    const windowUrl = result.url || '';
    const now = new Date();

    // Browser Tracking Logic
    if (isBrowserApp(appName)) {
      const browserData = extractBrowserData(appName, windowTitle, windowUrl);
      if (browserData.searchQuery || windowUrl) {
        sendMessage({
          type: 'browser_activity',
          pc_name: pcName,
          browser: appName,
          url: windowUrl,
          search_query: browserData.searchQuery,
          search_engine: browserData.searchEngine,
          timestamp: now.toISOString()
        });
      }
    }

    // Hardware Telemetry
    const hardwareData = await getHardwareTelemetry();
    maybeSendTemperatureLog(hardwareData, now);

    // Session Logic
    if (!appActive) {
      sendMessage({
        type: 'app_usage_start',
        pc_name: pcName,
        app_name: appName,
        start_time: now.toISOString(),
        cpu_temperature: hardwareData?.cpuTemperature
      });
      lastApp = appName;
      lastStart = now;
      appActive = true;
    } else if (appName !== lastApp) {
      sendMessage({
        type: 'app_usage_end',
        pc_name: pcName,
        app_name: lastApp,
        start_time: lastStart.toISOString(),
        end_time: now.toISOString(),
        duration_seconds: Math.floor((now - lastStart) / 1000)
      });
      sendMessage({
        type: 'app_usage_start',
        pc_name: pcName,
        app_name: appName,
        start_time: now.toISOString()
      });
      lastApp = appName;
      lastStart = now;
    } else {
      sendMessage({
        type: 'app_usage_update',
        pc_name: pcName,
        app_name: appName,
        start_time: lastStart.toISOString(),
        end_time: now.toISOString(),
        duration_seconds: Math.floor((now - lastStart) / 1000)
      });
    }
  }, 3000);
}

// Idle Detection
function checkSystemIdleTime() {
  const psScript = path.join(__dirname, 'check-idle.ps1');
  exec(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, (error, stdout) => {
    if (error) return;
    const idleMillis = parseInt(stdout.trim(), 10);
    const shouldBeIdle = idleMillis >= IDLE_THRESHOLD_MS;

    if (shouldBeIdle !== isIdle) {
      isIdle = shouldBeIdle;
      if (isIdle) idleStartTime = new Date();
      else {
        // Idle ended
        const duration = Math.floor((new Date() - idleStartTime) / 1000);
        sendMessage({
          type: 'idle_session',
          pc_name: pcName,
          start_time: idleStartTime.toISOString(),
          end_time: new Date().toISOString(),
          duration_seconds: duration
        });
      }
      sendMessage({ type: 'idle_status', pc_name: pcName, is_idle: isIdle });
      if (process.send) process.send({ type: 'idle-status', isIdle: isIdle });
    }
  });
}

function setupIdleDetection() {
  setInterval(checkSystemIdleTime, 5000);
}

// Start
connect();
```

### B.2.2 Hardware Monitor Wrapper (`client/windows-hardware-monitor.js`)
Interacts with LibreHardwareMonitor via WMI/PowerShell.

```javascript
const { exec } = require('child_process');
const os = require('os');

class WindowsHardwareMonitor {
  constructor() {
    this.isWindows = os.platform() === 'win32';
  }

  async getCpuTemperature() {
    if (!this.isWindows) return null;
    return new Promise((resolve) => {
      const cmd = 'powershell -Command "Get-WmiObject -Namespace root/LibreHardwareMonitor -Class Sensor | Where-Object {$_.SensorType -eq \'Temperature\' -and $_.Name -like \'*CPU*\'} | Select-Object -First 1 -ExpandProperty Value"';
      exec(cmd, { timeout: 3000 }, (err, stdout) => {
        const temp = parseFloat(stdout.trim());
        resolve(!isNaN(temp) && temp > 0 ? temp : null);
      });
    });
  }

  async getAllData() {
    const cpuTemp = await this.getCpuTemperature();
    return { cpuTemperature: cpuTemp };
  }
}
module.exports = WindowsHardwareMonitor;
```

---

## B.3 Node.js Backend Server

### B.3.1 Server Entry Point (`server/server.js`)
Express server with WebSocket support for real-time communication.

```javascript
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('./database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

const db = new Database();
const wss = new WebSocket.Server({ port: wsPort, host: '0.0.0.0' });
const activeSessions = {};

wss.on('connection', ws => {
  let clientId = null;

  ws.on('message', async (msg) => {
    const data = JSON.parse(msg);

    if (data.type === 'start') {
      clientId = data.pc_name;
      activeSessions[clientId] = { start_time: new Date().toISOString() };
      await db.updatePCStatus(clientId, true, new Date().toISOString());
    } 
    else if (data.type === 'app_usage_end') {
      await db.insertAppUsageLog(
        data.pc_name, data.app_name, data.start_time, data.end_time,
        data.duration_seconds, data.memory_usage_bytes, data.cpu_percent,
        data.gpu_percent, data.cpu_temperature
      );
    }
    else if (data.type === 'browser_activity') {
      await db.insertBrowserSearchLog(
        data.pc_name, data.browser, data.url, 
        data.search_query, data.search_engine, data.timestamp
      );
    }
    else if (data.type === 'system_info') {
      await db.upsertSystemInfo(
        data.pc_name, data.cpu_model, data.cpu_cores, 
        data.cpu_speed_ghz, data.total_memory_gb, data.gpu_model
      );
    }
    else if (data.type === 'heartbeat') {
      if (activeSessions[data.pc_name]) {
        await db.updatePCStatus(data.pc_name, true, new Date().toISOString());
      }
    }
  });

  ws.on('close', () => {
    if (clientId) {
      db.updatePCStatus(clientId, false, new Date().toISOString());
      delete activeSessions[clientId];
    }
  });
});

// API Routes
app.get('/logs', async (req, res) => {
  const logs = await db.getTimeLogs();
  res.json(logs);
});

app.get('/browser-logs', async (req, res) => {
  const logs = await db.getBrowserLogs(req.query.pc_name, req.query.search_engine);
  res.json(logs);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
```

### B.3.2 Database Model (`server/database.js`)
Abstraction layer for Supabase/SQLite interactions.

```javascript
const fs = require('fs');
require('dotenv').config();

class Database {
  constructor() {
    if (process.env.SUPABASE_URL) {
      this.type = 'supabase';
      const SupabaseDB = require('./supabase-client');
      this.db = new SupabaseDB();
    } else {
      this.type = 'memory';
      this.db = { timeLogs: [], appUsageLogs: [], browserSearchLogs: [], pcStatus: {} };
    }
  }

  async updatePCStatus(pcName, isOnline, lastSeen) {
    if (this.type === 'supabase') {
      await this.db.updatePCStatus({ pc_name: pcName, is_online: isOnline, last_seen: lastSeen });
    } else {
      this.db.pcStatus[pcName] = { is_online: isOnline, last_seen: lastSeen };
    }
  }

  async insertAppUsageLog(pcName, appName, startTime, endTime, duration, mem, cpu, gpu, temp) {
    if (this.type === 'supabase') {
      await this.db.insertAppUsageLog(pcName, appName, startTime, endTime, duration, mem, cpu, gpu, temp);
    } else {
      this.db.appUsageLogs.push({ pc_name: pcName, app_name: appName, duration_seconds: duration });
    }
  }
  
  // ... (Other methods for browser logs, system info, etc.)
}
module.exports = Database;
```

---

## B.4 Configuration Template (`.env.sample`)

```ini
# Server Configuration
PORT=3000
WS_PORT=8080

# Database Configuration (Supabase)
DB_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Client Configuration (config.json)
# {
#   "serverIP": "192.168.1.100",
#   "serverPort": 8080
# }
```
