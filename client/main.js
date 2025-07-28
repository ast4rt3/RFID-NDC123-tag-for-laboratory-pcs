const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const config = require('./config');

let loggerProcess;
let win; // <-- Keep a reference

function createWindow () {
  win = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false, 
    resizable: true, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

function showIPConfigWindow() {
  const configWin = new BrowserWindow({
    width: 350,
    height: 180,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  configWin.setMenuBarVisibility(false);
  configWin.loadFile(path.join(__dirname, 'ip-config.html'));

  ipcMain.once('save-ip', (event, ip) => {
    const configPath = path.join(process.resourcesPath || __dirname, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ serverIP: ip }, null, 2));
    configWin.close();
  });
}

app.whenReady().then(async () => {
  // Show IP configuration window on first run
  const configPath = path.join(process.resourcesPath || __dirname, 'config.json');
  if (!fs.existsSync(configPath)) {
    await showIPConfigWindow();
  }

  // Determine correct path for pc-logger.js
  const isPackaged = __dirname.includes('app.asar');
  const loggerPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'client', 'pc-logger.js')
    : path.join(__dirname, 'pc-logger.js');

  // Start the logger process
  loggerProcess = spawn('node', [loggerPath]);

  // Safely attach listeners
  if (loggerProcess && loggerProcess.stdout) {
    loggerProcess.stdout.on('data', (data) => {
      console.log(`pc-logger: ${data}`);
      if (win) {
        win.webContents.send('app-update', data.toString().trim());
      }
    });
    loggerProcess.stderr.on('data', (data) => {
      console.error(`pc-logger error: ${data}`);
    });
    loggerProcess.on('error', (err) => {
      console.error('Failed to start logger process:', err);
    });
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', (event) => {
  event.preventDefault();
  if (loggerProcess) {
    loggerProcess.kill();
  }
  app.exit();
});