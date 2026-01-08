const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  restartServer: () => ipcRenderer.invoke('restart-server'),
  
  onServerEvent: (callback) => {
    ipcRenderer.on('server-event', (_, data) => callback(data));
  }
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Mini ERP loaded successfully');
});
