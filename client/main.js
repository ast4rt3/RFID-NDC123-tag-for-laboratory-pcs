const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
// const AutoUpdater = require('./auto-updater'); // Disabled for now

let loggerProcess;
let tray;
let settingsWindow;
let licensingWindow;
let autoUpdater;

// Create system tray icon
function createTray() {
  // Create tray icon (use existing icon or create a simple one)
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (error) {
    // Create a simple icon if the file doesn't exist
    trayIcon = nativeImage.createEmpty();
  }
  
  // If icon is empty, create a simple colored icon
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
  
  // Create context menu
  updateTrayMenu();
}

function updateTrayMenu() {
  const menuItems = [
    {
      label: 'RFID Laboratory Monitor',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        showSettingsWindow();
      }
    },
    {
      label: 'Licensing & Documentation',
      click: () => {
        showLicensingWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'View Status',
      click: () => {
        showStatusWindow();
      }
    }
  ];

  // Add update options if available - DISABLED for now
  // if (autoUpdater) {
  //   const updateStatus = autoUpdater.getUpdateStatus();
  //   
  //   if (updateStatus.updateAvailable || updateStatus.updateDownloaded) {
  //     menuItems.push({ type: 'separator' });
  //     
  //     if (updateStatus.updateDownloaded) {
  //       menuItems.push({
  //         label: '🔄 Restart to Update',
  //         click: () => {
  //           autoUpdater.quitAndInstall();
  //         }
  //       });
  //     } else if (updateStatus.updateAvailable) {
  //       menuItems.push({
  //         label: '⬇️ Download Update',
  //         click: () => {
  //           autoUpdater.checkForUpdates();
  //         }
  //       });
  //     }
  //   } else {
  //     menuItems.push({ type: 'separator' });
  //     menuItems.push({
  //       label: '🔍 Check for Updates',
  //       click: () => {
  //         autoUpdater.checkForUpdates();
  //       }
  //     });
  //   }
  // }

  menuItems.push(
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      }
    }
  );
  
  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

function showSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: true,
    frame: true,
    title: 'RFID Monitor - Settings',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function showLicensingWindow() {
  if (licensingWindow) {
    licensingWindow.focus();
    return;
  }

  licensingWindow = new BrowserWindow({
    width: 700,
    height: 600,
    resizable: true,
    frame: true,
    title: 'RFID Monitor - Licensing & Documentation',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  licensingWindow.setMenuBarVisibility(false);
  licensingWindow.loadFile(path.join(__dirname, 'licensing.html'));

  licensingWindow.on('closed', () => {
    licensingWindow = null;
  });
}

function showStatusWindow() {
  const statusWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: true,
    frame: true,
    title: 'RFID Monitor - Status',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  statusWindow.setMenuBarVisibility(false);
  statusWindow.loadFile(path.join(__dirname, 'status.html'));

  // Send status data to the window
  ipcMain.once('get-status', (event) => {
    event.reply('status-data', {
      isRunning: loggerProcess && !loggerProcess.killed,
      uptime: process.uptime(),
      version: app.getVersion(),
      config: getConfig()
    });
  });
}

function getConfig() {
  try {
    const configPath = path.join(path.dirname(process.resourcesPath), 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading config:', error);
  }
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

// IPC handlers for settings
ipcMain.handle('get-config', () => {
  return getConfig();
});

ipcMain.handle('save-config', (event, config) => {
  return saveConfig(config);
});

ipcMain.handle('restart-logger', () => {
  if (loggerProcess) {
    loggerProcess.kill();
  }
  startLoggerProcess();
  return true;
});

ipcMain.handle('get-status', () => {
  return {
    isRunning: loggerProcess && !loggerProcess.killed,
    uptime: process.uptime(),
    version: app.getVersion(),
    config: getConfig()
  };
});

function startLoggerProcess() {
  // Determine correct path for pc-logger.js
  const isPackaged = __dirname.includes('app.asar');
  const loggerPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'client', 'pc-logger.js')
    : path.join(__dirname, 'pc-logger.js');

  // Set NODE_PATH for the child process
  const nodeModulesPath = isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules')
    : path.join(__dirname, '..', 'node_modules');

  // Start the logger process with proper environment
  loggerProcess = spawn('node', [loggerPath], {
    env: {
      ...process.env,
      NODE_PATH: nodeModulesPath
    }
  });

  // Safely attach listeners
  if (loggerProcess && loggerProcess.stdout) {
    loggerProcess.stdout.on('data', (data) => {
      console.log(`pc-logger: ${data}`);
    });
    loggerProcess.stderr.on('data', (data) => {
      console.error(`pc-logger error: ${data}`);
    });
    loggerProcess.on('error', (err) => {
      console.error('Failed to start logger process:', err);
    });
    loggerProcess.on('exit', (code) => {
      console.log(`Logger process exited with code ${code}`);
      // Restart logger if it exits unexpectedly
      setTimeout(() => {
        if (!loggerProcess || loggerProcess.killed) {
          startLoggerProcess();
        }
      }, 5000);
    });
  }
}

app.whenReady().then(async () => {
  // Create system tray
  createTray();
  
  // Initialize auto-updater
  // autoUpdater = new AutoUpdater({ tray, updateTrayMenu }); // Disabled for now
  
  // Start the logger process
  startLoggerProcess();

  // Prevent the app from showing in the dock (macOS) or taskbar (Windows)
  app.dock?.hide();
  
  // Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our tray instead
      if (tray) {
        tray.displayBalloon({
          title: 'RFID Monitor',
          content: 'RFID Monitor is already running in the system tray.',
          icon: nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.ico'))
        });
      }
    });
  }
});

app.on('before-quit', (event) => {
  event.preventDefault();
  if (loggerProcess) {
    loggerProcess.kill();
  }
  app.exit();
});