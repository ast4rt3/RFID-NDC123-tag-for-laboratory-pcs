const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('timerAPI', {
  onTick: (callback) => {
    let seconds = 0;
    setInterval(() => {
      seconds++;
      callback(seconds);
    }, 1000);
  }
});

contextBridge.exposeInMainWorld('appAPI', {
  onAppUpdate: (callback) => ipcRenderer.on('app-update', (event, appName) => callback(appName))
});