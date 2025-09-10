const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Enable live reload for development
if (process.argv.includes('--dev')) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
      ignore: /node_modules|[\/\\]\./,
      awaitWriteFinish: true
    });
  } catch (err) {
    console.log('Electron reload not available in production');
  }
}

class MainWindow {
  constructor() {
    this.window = null;
    this.createWindow();
    this.setupEventHandlers();
  }

  createWindow() {
    // Create the browser window with frameless configuration
    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      frame: false, // Frameless window
      titleBarStyle: 'hidden',
      backgroundColor: '#1a1a1a', // Dark background matching theme
      show: false, // Don't show until ready
      webPreferences: {
        nodeIntegration: false, // Security: disable node integration
        contextIsolation: true, // Security: enable context isolation
        enableRemoteModule: false, // Security: disable remote module
        preload: path.join(__dirname, '../preload/preload.js'), // Secure preload script
        webSecurity: true, // Security: enable web security
        allowRunningInsecureContent: false, // Security: block insecure content
        experimentalFeatures: false // Security: disable experimental features
      },
      icon: path.join(__dirname, '../../assets/icon.png')
    });

    // Load the app
    this.window.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Show window when ready to prevent visual flash
    this.window.once('ready-to-show', () => {
      this.window.show();
      
      // Focus the window
      if (this.window) {
        this.window.focus();
      }
    });

    // Handle window closed
    this.window.on('closed', () => {
      this.window = null;
    });

    // DevTools can be opened manually with Ctrl+Shift+I or F12 in development
    // Removed automatic opening to keep the interface clean
  }

  setupEventHandlers() {
    // Handle window controls from renderer process
    ipcMain.handle('window-minimize', () => {
      if (this.window) {
        this.window.minimize();
      }
    });

    ipcMain.handle('window-maximize', () => {
      if (this.window) {
        if (this.window.isMaximized()) {
          this.window.unmaximize();
        } else {
          this.window.maximize();
        }
      }
    });

    ipcMain.handle('window-close', () => {
      if (this.window) {
        this.window.close();
      }
    });

    ipcMain.handle('window-is-maximized', () => {
      return this.window ? this.window.isMaximized() : false;
    });

    // Handle maximize/unmaximize events to update UI
    if (this.window) {
      this.window.on('maximize', () => {
        this.window.webContents.send('window-maximized');
      });

      this.window.on('unmaximize', () => {
        this.window.webContents.send('window-unmaximized');
      });
    }
  }
}

// App event handlers
app.whenReady().then(() => {
  new MainWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      new MainWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});
