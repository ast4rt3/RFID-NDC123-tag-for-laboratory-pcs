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