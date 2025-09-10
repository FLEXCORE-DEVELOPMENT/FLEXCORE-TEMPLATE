const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

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
    this.splashWindow = null;
    this.tray = null;
    this.settingsPath = path.join(__dirname, '../config/settings.json');
    this.settings = this.loadSettings();
    this.globalShortcuts = new Map();
    this.isForceQuitting = false;
    this.createSplashWindow();
    this.setupEventHandlers();
    this.registerGlobalShortcuts();
    this.setupAutoLaunch();
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        return JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
    
    // Return default settings if file doesn't exist or error occurs
    return {
      appearance: {
        theme: "dark",
        fontFamily: "smooch-sans",
        accentColor: "#00a2ff",
        titlebarButtonStyle: "round"
      },
      behavior: {
        defaultWindowState: "normal",
        rememberWindowSize: true,
        launchOnStartup: false,
        startMinimizedToTray: false,
        minimizeToTray: false,
        closeToTray: false,
        alwaysOnTop: false
      },
      window: {
        width: 1200,
        height: 800,
        x: null,
        y: null
      }
    };
  }

  saveSettings() {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }

  createSplashWindow() {
    // Create splash screen window
    this.splashWindow = new BrowserWindow({
      width: 500,
      height: 350,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      skipTaskbar: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../preload/preload.js')
      }
    });

    // Load splash screen HTML
    this.splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));

    // Center the splash window
    this.splashWindow.center();

    // Show splash window when ready
    this.splashWindow.once('ready-to-show', () => {
      this.splashWindow.show();
      
      // Don't create main window yet - wait for splash completion
    });

    // Handle splash window closed
    this.splashWindow.on('closed', () => {
      this.splashWindow = null;
    });
  }

  createWindow() {
    // Use saved window size if remember window size is enabled
    const windowConfig = {
      width: this.settings.behavior?.rememberWindowSize && this.settings.window?.width ? this.settings.window.width : 1200,
      height: this.settings.behavior?.rememberWindowSize && this.settings.window?.height ? this.settings.window.height : 800,
      minWidth: 800,
      minHeight: 600,
      frame: false, // Frameless window
      titleBarStyle: 'hidden',
      backgroundColor: '#1a1a1a', // Dark background matching theme
      show: !this.settings.behavior?.startMinimizedToTray, // Don't show if starting minimized to tray
      alwaysOnTop: this.settings.behavior?.alwaysOnTop || false, // Apply always on top setting
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
    };

    // Set window position if remembered
    if (this.settings.behavior?.rememberWindowSize && this.settings.window?.x !== null && this.settings.window?.y !== null) {
      windowConfig.x = this.settings.window.x;
      windowConfig.y = this.settings.window.y;
    }

    // Create the browser window with frameless configuration
    this.window = new BrowserWindow(windowConfig);

    // Load the app
    this.window.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Show window when ready to prevent visual flash
    this.window.once('ready-to-show', () => {
      if (this.settings.behavior?.startMinimizedToTray) {
        // Create tray and minimize to it if setting is enabled
        this.createTray();
        this.window.hide();
      } else {
        this.window.show();
        
        // Focus the window
        if (this.window) {
          this.window.focus();
        }
      }
    });

    // Handle window minimize event
    this.window.on('minimize', () => {
      if (this.settings.behavior?.minimizeToTray) {
        // Ensure tray exists and hide window instead of minimizing
        if (!this.tray) this.createTray();
        this.window.hide();
      }
    });

    // Handle window close event
    this.window.on('close', (event) => {
      if (this.settings.behavior?.closeToTray && !this.isForceQuitting) {
        // Prevent the window from closing and hide it instead (unless force quitting from tray)
        event.preventDefault();
        if (!this.tray) this.createTray();
        this.window.hide();
      }
    });

    // Handle window closed
    this.window.on('closed', () => {
      this.window = null;
    });

    // Never show main window automatically - wait for splash completion
    // The window will be shown by closeSplashAndShowMain() when splash finishes

    // Save window size and position when window is resized or moved (if remember window size is enabled)
    this.window.on('resize', () => {
      if (this.settings.behavior?.rememberWindowSize && this.window && !this.window.isDestroyed()) {
        const bounds = this.window.getBounds();
        this.settings.window = {
          ...this.settings.window,
          width: bounds.width,
          height: bounds.height
        };
        this.saveSettings();
      }
    });

    this.window.on('move', () => {
      if (this.settings.behavior?.rememberWindowSize && this.window && !this.window.isDestroyed()) {
        const bounds = this.window.getBounds();
        this.settings.window = {
          ...this.settings.window,
          x: bounds.x,
          y: bounds.y
        };
        this.saveSettings();
      }
    });

    // DevTools can be opened manually with Ctrl+Shift+I or F12 in development
    // Removed automatic opening to keep the interface clean
  }

  setupAutoLaunch() {
    // Set auto launch based on current setting
    this.setAutoLaunch(this.settings.behavior?.launchOnStartup || false);
  }

  setAutoLaunch(enabled) {
    try {
      if (enabled) {
        app.setLoginItemSettings({
          openAtLogin: true,
          path: process.execPath,
          args: []
        });
      } else {
        app.setLoginItemSettings({
          openAtLogin: false
        });
      }
    } catch (error) {
      console.error('Error setting auto launch:', error);
    }
  }

  createTray() {
    if (this.tray) return; // Tray already exists

    try {
      // Create tray icon
      const trayIconPath = path.join(__dirname, '../../assets/favicon.ico');
      this.tray = new Tray(trayIconPath);
      
      // Set tray tooltip
      this.tray.setToolTip('FlexCore Template');
      
      // Create tray context menu
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show Window',
          click: () => {
            if (this.window) {
              this.window.show();
              this.window.focus();
            }
          }
        },
        {
          label: 'Hide Window',
          click: () => {
            if (this.window) {
              this.window.hide();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          click: () => {
            // Set flag to indicate this is a forced quit from tray
            this.isForceQuitting = true;
            app.quit();
          }
        }
      ]);
      
      this.tray.setContextMenu(contextMenu);
      
      // Handle tray click to show/hide window
      this.tray.on('click', () => {
        if (this.window) {
          if (this.window.isVisible()) {
            this.window.hide();
          } else {
            this.window.show();
            this.window.focus();
          }
        }
      });
    } catch (error) {
      console.error('Error creating tray:', error);
    }
  }

  setupEventHandlers() {
    // IPC handlers for window controls
    ipcMain.handle('window-minimize', () => {
      if (this.window) {
        if (this.settings.behavior?.minimizeToTray) {
          // Ensure tray exists and hide window
          if (!this.tray) this.createTray();
          this.window.hide();
        } else {
          this.window.minimize();
        }
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
        if (this.settings.behavior?.closeToTray) {
          // Ensure tray exists and hide window
          if (!this.tray) this.createTray();
          this.window.hide();
        } else {
          this.window.close();
        }
      }
    });

    ipcMain.handle('window-is-maximized', () => {
      return this.window ? this.window.isMaximized() : false;
    });

    // Settings IPC handlers
    ipcMain.handle('get-settings', () => {
      return this.settings;
    });

    ipcMain.handle('save-settings', (event, newSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings();
      return this.settings;
    });

    // Splash screen IPC handlers
    ipcMain.handle('splash-complete', () => {
      console.log('Received splash-complete signal');
      // Add a small delay to ensure splash animations complete
      setTimeout(() => {
        this.closeSplashAndShowMain();
      }, 100);
    });

    // Settings management handlers
    ipcMain.handle('save-setting', (event, key, value) => {
      const keys = key.split('.');
      let current = this.settings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Apply settings immediately for certain keys
      if (key === 'behavior.alwaysOnTop' && this.window) {
        this.window.setAlwaysOnTop(value);
      } else if (key === 'behavior.launchOnStartup') {
        this.setAutoLaunch(value);
      }
      
      this.saveSettings();
      return true;
    });

    ipcMain.handle('navigate-to-page', (event, pageName) => {
      if (this.window) {
        this.window.webContents.send('navigate-to-page', pageName);
      }
    });

    // Settings management handlers
    ipcMain.handle('restore-default-settings', () => {
      this.settings = {
        appearance: {
          theme: "dark",
          fontFamily: "inconsolata",
          fontSize: "small",
          accentColor: "#28ca42",
          titlebarButtonStyle: "square"
        },
        behavior: {
          defaultWindowState: "normal",
          rememberWindowSize: true,
          launchOnStartup: false,
          startMinimizedToTray: true,
          minimizeToTray: false,
          closeToTray: true,
          alwaysOnTop: false
        },
        advanced: {
          keyboardShortcuts: {
            close: "Ctrl+Q",
            minimize: "Ctrl+M",
            maximize: "Ctrl+Shift+M",
            show: "Ctrl+Shift+S",
            hide: "Ctrl+H"
          }
        },
        window: {
          width: 1200,
          height: 800,
          x: null,
          y: null
        }
      };
      this.saveSettings();
      return this.settings;
    });

    ipcMain.handle('export-settings', async () => {
      const { dialog } = require('electron');
      
      const result = await dialog.showSaveDialog(this.window, {
        title: 'Export Settings',
        defaultPath: 'settings.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['createDirectory']
      });

      if (!result.canceled && result.filePath) {
        try {
          const fs = require('fs');
          fs.writeFileSync(result.filePath, JSON.stringify(this.settings, null, 2));
          return { success: true, path: result.filePath };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      
      return { success: false, canceled: true };
    });

    ipcMain.handle('update-global-shortcuts', () => {
      this.updateGlobalShortcuts();
      return true;
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

  closeSplashAndShowMain() {
    console.log('closeSplashAndShowMain called');
    
    // Create main window now if it doesn't exist
    if (!this.window) {
      console.log('Creating main window');
      this.createWindow();
    }

    // Close splash window
    if (this.splashWindow && !this.splashWindow.isDestroyed()) {
      console.log('Closing splash window');
      this.splashWindow.hide();
      this.splashWindow.destroy();
      this.splashWindow = null;
    }

    // Show main window
    if (this.window) {
      console.log('Showing main window');
      if (this.settings.behavior?.startMinimizedToTray) {
        console.log('Starting minimized to tray');
        this.createTray();
      } else {
        console.log('Showing and focusing main window');
        this.window.show();
        this.window.focus();
      }
    } else {
      console.log('Main window not ready yet');
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

// Add global shortcut methods to MainWindow class
MainWindow.prototype.registerGlobalShortcuts = function() {
  const { globalShortcut } = require('electron');
  
  // Clear existing shortcuts
  if (this.globalShortcuts) {
    this.globalShortcuts.forEach((accelerator) => {
      globalShortcut.unregister(accelerator);
    });
    this.globalShortcuts.clear();
  }

  const shortcuts = this.settings.advanced?.keyboardShortcuts;
  if (!shortcuts) return;

  // Register shortcuts
  const shortcutActions = {
    close: () => {
      if (this.window) {
        this.window.close();
      }
    },
    minimize: () => {
      if (this.window) {
        this.window.minimize();
      }
    },
    maximize: () => {
      if (this.window) {
        if (this.window.isMaximized()) {
          this.window.unmaximize();
        } else {
          this.window.maximize();
        }
      }
    },
    show: () => {
      if (this.window) {
        this.window.show();
        this.window.focus();
      }
    },
    hide: () => {
      if (this.window) {
        this.window.hide();
      }
    }
  };

  Object.entries(shortcuts).forEach(([action, accelerator]) => {
    if (accelerator && shortcutActions[action]) {
      try {
        const success = globalShortcut.register(accelerator, shortcutActions[action]);
        if (success) {
          this.globalShortcuts.set(action, accelerator);
          console.log(`Registered global shortcut: ${accelerator} for ${action}`);
        } else {
          console.warn(`Failed to register global shortcut: ${accelerator} for ${action}`);
        }
      } catch (error) {
        console.error(`Error registering shortcut ${accelerator}:`, error);
      }
    }
  });
};

MainWindow.prototype.updateGlobalShortcuts = function() {
  this.registerGlobalShortcuts();
};
