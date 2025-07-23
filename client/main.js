const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let loggerProcess;
let win; // <-- Keep a reference

function createWindow () {
  win = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false, 
    resizable: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(() => {
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