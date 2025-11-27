// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),

  // Status and control
  getStatus: () => ipcRenderer.invoke('get-status'),
  restartLogger: () => ipcRenderer.invoke('restart-logger'),

  // Event subscription
  onIdleStatusUpdate: (callback) => {
    const listener = (event, isIdle) => callback(isIdle);
    ipcRenderer.on('idle-status-update', listener);
    return () => ipcRenderer.removeListener('idle-status-update', listener);
  }
});
