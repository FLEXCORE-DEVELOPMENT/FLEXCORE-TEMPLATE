const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');

// Enable live reload for development
if (process.argv.includes('--dev')) {
  try {
    require('electron-reload')(path.join(__dirname, '..'), {
      electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
      ignore: /node_modules|[\/\\]\.|\.git/,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });
  } catch (err) {
    console.log('Electron reload not available in production');
  }
}

class MainWindow {
  constructor() {
    this.window = null;
    this.tray = null;
    this.createWindow();
    this.createTray();
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
      icon: path.join(__dirname, '../../assets/favicon.ico')
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
    // IPC handlers for window controls
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

  createTray() {
    // Create tray icon
    const trayIconPath = path.join(__dirname, '../../assets/favicon.ico');
    this.tray = new Tray(trayIconPath);
    
    // Set initial tray menu
    this.updateTrayMenu();

    // Set tray properties with enhanced styling
    this.tray.setToolTip('FlexCore Application - Double-click to toggle, Right-click for menu');
    
    // Platform-specific tray enhancements
    if (process.platform === 'win32') {
      // Windows-specific tray styling
      this.tray.setIgnoreDoubleClickEvents(false);
    } else if (process.platform === 'darwin') {
      // macOS-specific tray styling
      this.tray.setPressedImage(trayIconPath);
    }
    
    // Handle tray double-click (show/hide window)
    this.tray.on('double-click', () => {
      if (this.window.isVisible()) {
        this.window.hide();
      } else {
        this.window.show();
        this.window.focus();
      }
      // Update menu after visibility change
      setTimeout(() => this.updateTrayMenu(), 100);
    });
  }

  updateTrayMenu() {
    const isVisible = this.window && this.window.isVisible();
    
    // Create dynamic context menu based on window visibility
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'FLEXCORE TEMPLATE',
        enabled: false,
        type: 'normal'
      },
      { type: 'separator' },
      {
        label: 'SETTINGS',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          this.window.show();
          this.window.focus();
          this.window.webContents.send('navigate-to-page', 'config');
          setTimeout(() => this.updateTrayMenu(), 100);
        }
      },
      {
        label: 'ABOUT',
        accelerator: 'CmdOrCtrl+I',
        click: () => {
          this.window.show();
          this.window.focus();
          this.window.webContents.send('navigate-to-page', 'about');
          setTimeout(() => this.updateTrayMenu(), 100);
        }
      },
      { type: 'separator' },
      // Show 'Show' only when window is hidden
      ...(isVisible ? [] : [{
        label: 'SHOW',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => {
          this.window.show();
          this.window.focus();
          setTimeout(() => this.updateTrayMenu(), 100);
        }
      }]),
      // Show 'Hide' only when window is visible
      ...(isVisible ? [{
        label: 'HIDE',
        accelerator: 'CmdOrCtrl+Shift+H',
        click: () => {
          this.window.hide();
          setTimeout(() => this.updateTrayMenu(), 100);
        }
      }] : []),
      {
        label: 'CLOSE',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
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
