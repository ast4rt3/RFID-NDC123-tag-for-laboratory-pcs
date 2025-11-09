const { app, Tray, Menu, nativeImage, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let serverProcess = null;
let tray = null;
let statusWindow = null;
let serverStatus = {
  isRunning: false,
  port: process.env.PORT || 3000,
  wsPort: process.env.WS_PORT || 8080,
  connectedPCs: 0,
  startTime: null
};

// Get server script path
const serverScriptPath = path.join(__dirname, '..', 'server', 'server.js');
const startServerScriptPath = path.join(__dirname, '..', 'start-server.js');

// Create system tray icon
function createTray() {
  const iconPath = path.join(__dirname, '..', 'client', 'assets', 'icon.ico');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (error) {
    // Create a simple icon if the file doesn't exist
    const size = 16;
    trayIcon = nativeImage.createFromDataURL(`data:image/png;base64,${Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#4f46e5"/>
        <text x="8" y="12" font-family="Arial" font-size="10" fill="white" text-anchor="middle">S</text>
      </svg>
    `).toString('base64')}`);
  }
  
  tray = new Tray(trayIcon);
  tray.setToolTip('RFID Server - ' + (serverStatus.isRunning ? 'Running' : 'Stopped'));
  
  // Update menu
  updateTrayMenu();
}

function updateTrayMenu() {
  const menuItems = [
    {
      label: 'RFID Server',
      enabled: false
    },
    {
      label: serverStatus.isRunning ? '● Running' : '○ Stopped',
      enabled: false
    },
    { type: 'separator' },
    {
      label: serverStatus.isRunning ? 'Stop Server' : 'Start Server',
      click: () => {
        if (serverStatus.isRunning) {
          stopServer();
        } else {
          startServer();
        }
      }
    },
    {
      label: 'Restart Server',
      enabled: serverStatus.isRunning,
      click: () => {
        restartServer();
      }
    },
    { type: 'separator' },
    {
      label: 'View Status',
      click: () => {
        showStatusWindow();
      }
    },
    {
      label: 'View Logs',
      click: () => {
        showLogsWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        if (serverStatus.isRunning) {
          stopServer(() => {
            app.quit();
          });
        } else {
          app.quit();
        }
      }
    }
  ];
  
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

function startServer() {
  if (serverProcess) {
    return; // Already running
  }

  // Load environment variables
  const env = { ...process.env };
  
  // Try to load server-config.env or .env
  try {
    const fs = require('fs');
    const envPath = path.join(__dirname, '..', 'server-config.env');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          env[match[1].trim()] = match[2].trim();
        }
      });
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }

  // Start server using start-server.js or directly
  const scriptToRun = fs.existsSync(startServerScriptPath) ? startServerScriptPath : serverScriptPath;
  
  serverProcess = spawn('node', [scriptToRun], {
    env: env,
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverStatus.isRunning = true;
  serverStatus.startTime = new Date();

  // Capture stdout and stderr
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    // Parse server output to update status
    if (output.includes('Server started')) {
      updateServerStatus();
    }
    if (output.includes('PC connected')) {
      serverStatus.connectedPCs++;
      updateTrayMenu();
    }
    if (output.includes('PC disconnected')) {
      serverStatus.connectedPCs = Math.max(0, serverStatus.connectedPCs - 1);
      updateTrayMenu();
    }
  });

  serverProcess.stderr.on('data', (data) => {
    // Log errors but don't spam
    const error = data.toString();
    if (error.includes('Error') || error.includes('error')) {
      console.error('Server error:', error);
    }
  });

  serverProcess.on('exit', (code) => {
    serverProcess = null;
    serverStatus.isRunning = false;
    serverStatus.connectedPCs = 0;
    updateTrayMenu();
    tray.setToolTip('RFID Server - Stopped');
    
    if (code !== 0 && code !== null) {
      // Server crashed, show notification
      const iconPath = path.join(__dirname, '..', 'client', 'assets', 'icon.ico');
      let notificationIcon;
      try {
        notificationIcon = nativeImage.createFromPath(iconPath);
      } catch (error) {
        notificationIcon = null;
      }
      
      tray.displayBalloon({
        title: 'RFID Server',
        content: 'Server stopped unexpectedly. Click to restart.',
        icon: notificationIcon
      });
    }
  });

  updateTrayMenu();
  tray.setToolTip('RFID Server - Running');
  
  // Get icon path for notification
  const iconPath = path.join(__dirname, '..', 'client', 'assets', 'icon.ico');
  let notificationIcon;
  try {
    notificationIcon = nativeImage.createFromPath(iconPath);
  } catch (error) {
    notificationIcon = null;
  }
  
  tray.displayBalloon({
    title: 'RFID Server',
    content: 'Server started successfully',
    icon: notificationIcon
  });
}

function stopServer(callback) {
  if (!serverProcess) {
    if (callback) callback();
    return;
  }

  serverProcess.kill('SIGTERM');
  
  // Wait for process to exit
  const checkInterval = setInterval(() => {
    if (!serverProcess || serverProcess.killed) {
      clearInterval(checkInterval);
      serverStatus.isRunning = false;
      serverStatus.connectedPCs = 0;
      updateTrayMenu();
      tray.setToolTip('RFID Server - Stopped');
      if (callback) callback();
    }
  }, 100);

  // Force kill after 5 seconds
  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGKILL');
      clearInterval(checkInterval);
      serverStatus.isRunning = false;
      serverStatus.connectedPCs = 0;
      updateTrayMenu();
      tray.setToolTip('RFID Server - Stopped');
      if (callback) callback();
    }
  }, 5000);
}

function restartServer() {
  stopServer(() => {
    setTimeout(() => {
      startServer();
    }, 1000);
  });
}

function updateServerStatus() {
  // Update status from server if needed
  updateTrayMenu();
}

function showStatusWindow() {
  if (statusWindow) {
    statusWindow.focus();
    return;
  }

  statusWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: true,
    frame: true,
    title: 'RFID Server - Status',
    icon: path.join(__dirname, '..', 'client', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  statusWindow.setMenuBarVisibility(false);
  
  // Create simple HTML content
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>RFID Server Status</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          background: #f5f5f5;
        }
        .status-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .status-item:last-child {
          border-bottom: none;
        }
        .status-label {
          font-weight: 600;
          color: #333;
        }
        .status-value {
          color: #666;
        }
        .status-running {
          color: #22c55e;
        }
        .status-stopped {
          color: #ef4444;
        }
        h1 {
          margin: 0 0 20px 0;
          color: #333;
        }
      </style>
    </head>
    <body>
      <h1>RFID Server Status</h1>
      <div class="status-card">
        <div class="status-item">
          <span class="status-label">Status:</span>
          <span class="status-value ${serverStatus.isRunning ? 'status-running' : 'status-stopped'}">
            ${serverStatus.isRunning ? '● Running' : '○ Stopped'}
          </span>
        </div>
        <div class="status-item">
          <span class="status-label">HTTP Port:</span>
          <span class="status-value">${serverStatus.port}</span>
        </div>
        <div class="status-item">
          <span class="status-label">WebSocket Port:</span>
          <span class="status-value">${serverStatus.wsPort}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Connected PCs:</span>
          <span class="status-value">${serverStatus.connectedPCs}</span>
        </div>
        <div class="status-item">
          <span class="status-label">Uptime:</span>
          <span class="status-value" id="uptime">-</span>
        </div>
      </div>
      <script>
        const startTime = ${serverStatus.startTime ? new Date(serverStatus.startTime).getTime() : 'null'};
        function updateUptime() {
          if (startTime) {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            document.getElementById('uptime').textContent = 
              hours + 'h ' + minutes + 'm ' + seconds + 's';
          } else {
            document.getElementById('uptime').textContent = '-';
          }
        }
        updateUptime();
        setInterval(updateUptime, 1000);
      </script>
    </body>
    </html>
  `;
  
  statusWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  statusWindow.on('closed', () => {
    statusWindow = null;
  });
}

function showLogsWindow() {
  // Open a simple window showing recent server output
  const logsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    frame: true,
    title: 'RFID Server - Logs',
    icon: path.join(__dirname, '..', 'client', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  logsWindow.setMenuBarVisibility(false);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>RFID Server Logs</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          padding: 10px;
          background: #1e1e1e;
          color: #d4d4d4;
          margin: 0;
        }
        #logs {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 12px;
          line-height: 1.5;
        }
        .log-line {
          margin: 2px 0;
        }
        .log-error {
          color: #f48771;
        }
        .log-success {
          color: #89d185;
        }
        .log-info {
          color: #569cd6;
        }
      </style>
    </head>
    <body>
      <div id="logs">Server logs will appear here when the server is running...</div>
      <script>
        // This is a placeholder - in a real implementation, you'd capture server output
        document.getElementById('logs').textContent = 
          'Logs are captured from server output.\\n' +
          'To view full logs, check the server console or log files.';
      </script>
    </body>
    </html>
  `;
  
  logsWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// Initialize app
app.whenReady().then(() => {
  createTray();
  
  // Auto-start server on launch
  startServer();
  
  // Prevent app from showing in dock/taskbar
  app.dock?.hide();
  
  // Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (tray) {
        const iconPath = path.join(__dirname, '..', 'client', 'assets', 'icon.ico');
        let notificationIcon;
        try {
          notificationIcon = nativeImage.createFromPath(iconPath);
        } catch (error) {
          notificationIcon = null;
        }
        
        tray.displayBalloon({
          title: 'RFID Server',
          content: 'RFID Server is already running in the system tray.',
          icon: notificationIcon
        });
      }
    });
  }
});

app.on('before-quit', (event) => {
  if (serverProcess) {
    event.preventDefault();
    stopServer(() => {
      app.quit();
    });
  }
});

app.on('window-all-closed', () => {
  // Don't quit when windows are closed, keep tray running
});

