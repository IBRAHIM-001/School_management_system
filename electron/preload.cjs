const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  ping: () => 'pong',
  getSQLiteInfo: () => ipcRenderer.invoke('get-sqlite-info'),
  backupSQLiteDatabase: () => ipcRenderer.invoke('backup-sqlite-db'),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder')
});
