const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // Listen for window state changes
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', callback),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window-unmaximized', callback),
  
  // Navigation
  onNavigateToPage: (callback) => ipcRenderer.on('navigate-to-page', (event, pageName) => callback(pageName)),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value),
  restoreDefaultSettings: () => ipcRenderer.invoke('restore-default-settings'),
  exportSettings: () => ipcRenderer.invoke('export-settings'),
  updateGlobalShortcuts: () => ipcRenderer.invoke('update-global-shortcuts'),
  
  // Splash Screen
  splashComplete: () => ipcRenderer.invoke('splash-complete'),
});

// Remove listeners
contextBridge.exposeInMainWorld('electronAPI', {
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
