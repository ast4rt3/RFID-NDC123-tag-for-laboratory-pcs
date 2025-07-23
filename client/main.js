const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let loggerProcess;

function createWindow () {
  const win = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false, // Remove window controls
    resizable: false, // Prevent resizing
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Start the logger process (send 'start')
  loggerProcess = spawn('node', [path.join(__dirname, 'pc-logger.js'), 'start']);

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', (event) => {
  // Send 'stop' to the logger
  // This will run the stop command and wait for it to finish before quitting
  event.preventDefault();
  const stopProcess = spawn('node', [path.join(__dirname, 'pc-logger.js'), 'stop']);
  stopProcess.on('close', () => {
    app.exit();
  });
});