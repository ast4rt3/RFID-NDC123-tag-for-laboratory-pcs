const { app, BrowserWindow, dialog } = require('electron');
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
    resizable: false, 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

async function showIPConfigDialog() {
  const configPath = path.join(process.resourcesPath || __dirname, 'config.json');
  
  // Check if config already exists
  if (fs.existsSync(configPath)) {
    return; // Config already exists, skip dialog
  }

  const result = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Configure', 'Use Default'],
    title: 'Server Configuration',
    message: 'Server IP Configuration Required',
    detail: 'The application needs to know the server IP address to connect to the RFID monitoring system. Click "Configure" to enter the IP address, or "Use Default" to use localhost.',
    defaultId: 0
  });

  if (result.response === 0) {
    // Show input dialog using a simple prompt
    const inputResult = await dialog.showMessageBox({
      type: 'question',
      buttons: ['OK'],
      title: 'Server IP Address',
      message: 'Please enter the server IP address in the next dialog.',
      detail: 'Default: localhost\n\nYou can change this later by editing the config.json file in the application directory.'
    });

    // For now, use localhost as default, user can edit config.json manually
    const configData = { serverIP: 'localhost' };
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log('Configuration saved with default localhost. User can edit config.json to change IP.');
  } else {
    // Use default localhost
    const configData = { serverIP: 'localhost' };
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log('Configuration saved with default localhost');
  }
}

app.whenReady().then(async () => {
  // Show IP configuration dialog on first run
  await showIPConfigDialog();

  // Start the logger process
  loggerProcess = spawn('node', [path.join(__dirname, 'pc-logger.js')]);

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