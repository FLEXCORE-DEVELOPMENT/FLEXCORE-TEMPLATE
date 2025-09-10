// Renderer process script for handling UI interactions and window controls

class AppRenderer {
    constructor() {
        this.isMaximized = false;
        this.hasUnsavedChanges = false;
        this.pendingSettings = {};
        this.homePage = null;
        this.currentPage = 'home'; // Track current page
        this.init();
    }

    async init() {
        this.settings = await window.electronAPI.getSettings();
        
        // Load home page first
        await this.loadHomePage();
        
        this.setupWindowControls();
        this.setupWindowStateListeners();
        this.setupAppInteractions();
        this.setupMenuControls();
        this.setupTrayNavigation();
        this.setupThemeSelector();
        this.setupFontSelector();
        this.setupFontSizeSelector();
        this.setupButtonStyleSelector();
        this.setupAccentColorSelector();
        this.setupBehaviorSettings();
        this.setupAdvancedSettings();
        this.setupConfigActions();
        await this.updateMaximizeButton();
        
        // Apply saved settings on startup
        this.applyTheme(this.settings.appearance?.theme || 'dark');
        this.applyFont(this.settings.appearance?.fontFamily || 'smooch-sans');
        this.applyFontSize(this.settings.appearance?.fontSize || 'small');
        this.applyButtonStyle(this.settings.appearance?.titlebarButtonStyle || 'round');
        this.applyAccentColor(this.settings.appearance?.accentColor || '#00a2ff');
        
        // Update OS information on Details page (with delay to ensure DOM is ready)
        setTimeout(() => this.updateOSInfo(), 500);
    }

    async loadHomePage() {
        try {
            const response = await fetch('home.html');
            const homeContent = await response.text();
            
            const homeContainer = document.getElementById('home-page-container');
            if (homeContainer) {
                homeContainer.innerHTML = homeContent;
                
                // Show home page by default only on initial load
                homeContainer.classList.remove('hidden');
                
                // Initialize home page functionality
                if (window.HomePage) {
                    this.homePage = new window.HomePage();
                }
            }
        } catch (error) {
            console.error('Error loading home page:', error);
            // Fallback: create basic home page structure
            this.createFallbackHomePage();
        }
    }

    createFallbackHomePage() {
        const homeContainer = document.getElementById('home-page-container');
        if (homeContainer) {
            homeContainer.innerHTML = `
                <div class="page" id="home-page">
                    <header class="app-header">
                        <h1 class="app-title">FLEXCORE</h1>
                        <p class="app-subtitle">Modern Electron Application</p>
                    </header>
                    <main class="content-area">
                        <div class="feature-grid">
                            <div class="feature-card">
                                <div class="feature-icon"><i class="fas fa-palette"></i></div>
                                <h3>Modern UI</h3>
                                <p>Clean and modern interface with custom titlebar</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon"><i class="fas fa-shield-alt"></i></div>
                                <h3>Secure</h3>
                                <p>Built with Electron security best practices</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon"><i class="fas fa-desktop"></i></div>
                                <h3>Cross-Platform</h3>
                                <p>Works on Windows, macOS, and Linux</p>
                            </div>
                        </div>
                    </main>
                </div>
            `;
            
            // Show home page container for fallback
            homeContainer.classList.remove('hidden');
        }
    }

    setupWindowControls() {
        // Get window control buttons
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');

        // Add event listeners for window controls
        minimizeBtn.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });

        maximizeBtn.addEventListener('click', async () => {
            await window.electronAPI.maximizeWindow();
            await this.updateMaximizeButton();
        });

        closeBtn.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // Add hover effects
        this.addButtonHoverEffects();
    }

    setupWindowStateListeners() {
        // Listen for window maximize/unmaximize events
        window.electronAPI.onWindowMaximized(() => {
            this.isMaximized = true;
            this.updateMaximizeButtonIcon();
        });

        window.electronAPI.onWindowUnmaximized(() => {
            this.isMaximized = false;
            this.updateMaximizeButtonIcon();
        });
    }

    async updateMaximizeButton() {
        this.isMaximized = await window.electronAPI.isWindowMaximized();
        this.updateMaximizeButtonIcon();
    }

    updateMaximizeButtonIcon() {
        const maximizeBtn = document.getElementById('maximize-btn');
        const svg = maximizeBtn.querySelector('svg');
        
        if (this.isMaximized) {
            // Show restore icon (two overlapping squares)
            svg.innerHTML = `
                <rect x="2" y="0" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <rect x="0" y="2" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            `;
            maximizeBtn.title = 'Restore';
            maximizeBtn.classList.add('maximized');
        } else {
            // Show maximize icon (single square)
            svg.innerHTML = `
                <rect x="0" y="0" width="12" height="12" stroke="currentColor" stroke-width="1.5" fill="none"/>
            `;
            maximizeBtn.title = 'Maximize';
            maximizeBtn.classList.remove('maximized');
        }
    }

    addButtonHoverEffects() {
        const buttons = document.querySelectorAll('.titlebar-button');
        
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }

    setupAppInteractions() {
        // Add feature card interactions
        this.setupFeatureCards();
        
        // Prevent form submissions from navigating away
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
            });
        });
        
        // Prevent default behavior on config inputs
        const configInputs = document.querySelectorAll('.config-select, .config-checkbox');
        configInputs.forEach(input => {
            input.addEventListener('change', (event) => {
                event.stopPropagation();
            });
        });
    }

    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            // Add subtle animation on load
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '50px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        const colors = {
            primary: 'linear-gradient(135deg, #28ca42, #4db8ff)',
            secondary: '#3e3e42',
            info: '#0ea5e9',
            error: '#ef4444'
        };
        notification.style.background = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Utility method to handle keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + M to minimize
            if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
                event.preventDefault();
                window.electronAPI.minimizeWindow();
            }
            
            // F11 to toggle maximize
            if (event.key === 'F11') {
                event.preventDefault();
                window.electronAPI.maximizeWindow();
            }
            
            // Alt + F4 to close (Windows)
            if (event.altKey && event.key === 'F4') {
                event.preventDefault();
                window.electronAPI.closeWindow();
            }
        });
    }

    setupMenuControls() {
        const menuBtn = document.getElementById('menu-btn');
        const slideMenu = document.getElementById('slide-menu');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuClose = document.getElementById('menu-close');

        // Open menu
        menuBtn.addEventListener('click', () => {
            slideMenu.classList.add('open');
            menuOverlay.classList.add('active');
        });

        // Close menu via close button
        menuClose.addEventListener('click', () => {
            slideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
        });

        // Close menu via overlay click
        menuOverlay.addEventListener('click', () => {
            slideMenu.classList.remove('open');
            menuOverlay.classList.remove('active');
        });

        // Close menu with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && slideMenu.classList.contains('open')) {
                slideMenu.classList.remove('open');
                menuOverlay.classList.remove('active');
            }
        });

        // Handle menu item clicks
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const text = link.querySelector('span').textContent.toLowerCase();
                this.navigateToPage(text);
                
                // Close menu after selection
                slideMenu.classList.remove('open');
                menuOverlay.classList.remove('active');
            });
        });
    }

    navigateToPage(pageName) {
        // Update current page tracking
        this.currentPage = pageName;
        
        // Hide all pages including home page container
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.add('hidden');
        });
        
        // Also hide home page container
        const homeContainer = document.getElementById('home-page-container');
        if (homeContainer) {
            homeContainer.classList.add('hidden');
        }

        // Show selected page (handle configs -> config and details mappings)
        const pageId = pageName === 'configs' ? 'config' : 
                      pageName === 'details' ? 'details' : pageName;
        
        // Special handling for home page
        if (pageId === 'home') {
            if (homeContainer) {
                homeContainer.classList.remove('hidden');
                
                // Refresh home page if it exists
                if (this.homePage && this.homePage.refresh) {
                    this.homePage.refresh();
                }
            }
        } else {
            // Show other pages
            const targetPage = document.getElementById(`${pageId}-page`);
            if (targetPage) {
                targetPage.classList.remove('hidden');
                
                // Update OS info when navigating to Details page
                if (pageId === 'details') {
                    setTimeout(() => this.updateOSInfo(), 100);
                }
            }
        }

        // Update active menu item
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Find and activate the correct menu item
        menuLinks.forEach(link => {
            const span = link.querySelector('span');
            if (span) {
                const linkText = span.textContent.toLowerCase();
                const targetName = pageName.toLowerCase();
                
                if ((linkText === 'home' && targetName === 'home') ||
                    (linkText === 'configs' && targetName === 'configs') ||
                    (linkText === 'details' && targetName === 'details')) {
                    link.classList.add('active');
                }
            }
        });
    }

    setupTrayNavigation() {
        // Listen for tray navigation messages from main process
        window.electronAPI.onNavigateToPage((pageName) => {
            this.navigateToPage(pageName);
        });
    }

    setupThemeSelector() {
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            // Load saved theme preference from settings
            const savedTheme = this.settings.appearance?.theme || 'dark';
            themeSelect.value = savedTheme;
            this.applyTheme(savedTheme);

            // Handle theme changes
            themeSelect.addEventListener('change', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedTheme = event.target.value;
                this.applyTheme(selectedTheme);
                this.updatePendingSetting('appearance.theme', selectedTheme);
            });
        }

        // Listen for system theme changes when in auto mode
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                const currentTheme = this.settings.appearance?.theme || 'dark';
                if (currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    setupFontSelector() {
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            // Load saved font preference from settings
            const savedFont = this.settings.appearance?.fontFamily || 'smooch-sans';
            fontSelect.value = savedFont;
            this.applyFont(savedFont);

            // Handle font changes
            fontSelect.addEventListener('change', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedFont = event.target.value;
                this.applyFont(selectedFont);
                this.updatePendingSetting('appearance.fontFamily', selectedFont);
            });
        }
    }

    setupFontSizeSelector() {
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) {
            // Load saved font size preference from settings
            const savedFontSize = this.settings.appearance?.fontSize || 'small';
            fontSizeSelect.value = savedFontSize;
            this.applyFontSize(savedFontSize);

            // Handle font size changes
            fontSizeSelect.addEventListener('change', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedFontSize = event.target.value;
                this.applyFontSize(selectedFontSize);
                this.updatePendingSetting('appearance.fontSize', selectedFontSize);
            });
        }
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        // Determine the actual theme to apply
        let actualTheme = theme;
        if (theme === 'auto') {
            // Use system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                actualTheme = 'dark';
            } else {
                actualTheme = 'light';
            }
        }
        
        // Apply theme by setting data attribute on document element
        document.documentElement.setAttribute('data-theme', actualTheme);
        
        // Update CSS custom properties for theme
        if (actualTheme === 'light') {
            // Light theme colors
            root.style.setProperty('--primary-bg', '#ffffff');
            root.style.setProperty('--secondary-bg', '#f8f9fa');
            root.style.setProperty('--titlebar-bg', '#f8f9fa');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--text-primary', '#212529');
            root.style.setProperty('--text-secondary', '#6c757d');
            root.style.setProperty('--text-muted', '#adb5bd');
            root.style.setProperty('--border-color', '#dee2e6');
            root.style.setProperty('--hover-bg', '#e9ecef');
        } else {
            // Dark theme (default)
            root.style.setProperty('--primary-bg', '#1a1a1a');
            root.style.setProperty('--secondary-bg', '#2d2d30');
            root.style.setProperty('--titlebar-bg', '#2d2d30');
            root.style.setProperty('--card-bg', '#2d2d30');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#cccccc');
            root.style.setProperty('--text-muted', '#888888');
            root.style.setProperty('--border-color', '#3e3e42');
            root.style.setProperty('--hover-bg', '#404040');
        }
    }

    applyFont(fontFamily) {
        const root = document.documentElement;
        switch (fontFamily) {
            case 'smooch-sans':
                root.style.setProperty('--font-family', '"Smooch Sans", sans-serif');
                break;
            case 'inconsolata':
                root.style.setProperty('--font-family', '"Inconsolata", monospace');
                break;
            default:
                root.style.setProperty('--font-family', '"Smooch Sans", sans-serif');
        }
    }

    applyFontSize(fontSize) {
        const root = document.documentElement;
        
        switch (fontSize) {
            case 'small':
                root.style.setProperty('--font-scale', '0.875');
                break;
            case 'medium':
                root.style.setProperty('--font-scale', '1');
                break;
            case 'large':
                root.style.setProperty('--font-scale', '1.125');
                break;
            default:
                root.style.setProperty('--font-scale', '1');
        }
    }

    setupButtonStyleSelector() {
        const buttonStyleSelect = document.getElementById('button-style-select');
        if (buttonStyleSelect) {
            // Load saved button style preference from settings
            const savedStyle = this.settings.appearance?.titlebarButtonStyle || 'round';
            buttonStyleSelect.value = savedStyle;
            this.applyButtonStyle(savedStyle);

            // Handle button style changes
            buttonStyleSelect.addEventListener('change', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedStyle = event.target.value;
                this.applyButtonStyle(selectedStyle);
                this.updatePendingSetting('appearance.titlebarButtonStyle', selectedStyle);
            });
        }
    }

    applyButtonStyle(style) {
        const titlebarButtons = document.querySelectorAll('.mac-button');
        
        titlebarButtons.forEach(button => {
            if (style === 'square') {
                button.classList.add('square-style');
            } else {
                button.classList.remove('square-style');
            }
        });
    }

    setupAccentColorSelector() {
        const accentColorSelect = document.getElementById('accent-color-select');
        if (accentColorSelect) {
            // Load saved accent color preference from settings
            const savedColor = this.settings.appearance?.accentColor || '#00a2ff';
            accentColorSelect.value = savedColor;
            this.applyAccentColor(savedColor);

            // Handle accent color changes
            accentColorSelect.addEventListener('change', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedColor = event.target.value;
                this.applyAccentColor(selectedColor);
                this.updatePendingSetting('appearance.accentColor', selectedColor);
            });
        }
    }

    applyAccentColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--accent-color', color);
        
        // Update accent-light (lighter version for hover states)
        const lightColor = this.lightenColor(color, 20);
        root.style.setProperty('--accent-light', lightColor);
        
        // Update color preview square
        const colorPreview = document.getElementById('color-preview');
        if (colorPreview) {
            colorPreview.style.backgroundColor = color;
        }
    }

    lightenColor(color, percent) {
        // Convert hex to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Lighten each component
        const newR = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
        const newG = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
        const newB = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    setupBehaviorSettings() {
        // Default window state dropdown
        const windowStateSelect = document.getElementById('window-state-select');
        if (windowStateSelect) {
            const savedState = this.settings.behavior?.defaultWindowState || 'normal';
            windowStateSelect.value = savedState;
            
            windowStateSelect.addEventListener('change', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedState = event.target.value;
                this.updatePendingSetting('behavior.defaultWindowState', selectedState);
            });
        }

        // Behavior checkboxes
        const behaviorSettings = [
            { id: 'remember-window-size', key: 'behavior.rememberWindowSize' },
            { id: 'launch-on-startup', key: 'behavior.launchOnStartup' },
            { id: 'start-minimized-to-tray', key: 'behavior.startMinimizedToTray' },
            { id: 'minimize-to-tray', key: 'behavior.minimizeToTray' },
            { id: 'close-to-tray', key: 'behavior.closeToTray' },
            { id: 'always-on-top', key: 'behavior.alwaysOnTop' }
        ];

        behaviorSettings.forEach(setting => {
            const checkbox = document.getElementById(setting.id);
            if (checkbox) {
                // Load saved value
                const keyParts = setting.key.split('.');
                const savedValue = this.settings[keyParts[0]]?.[keyParts[1]] || false;
                checkbox.checked = savedValue;

                // Add event listener with proper event handling
                checkbox.addEventListener('change', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const isChecked = event.target.checked;
                    this.updatePendingSetting(setting.key, isChecked);
                });
            }
        });
    }

    setupAdvancedSettings() {
        const shortcuts = [
            { id: 'shortcut-close', key: 'advanced.keyboardShortcuts.close' },
            { id: 'shortcut-minimize', key: 'advanced.keyboardShortcuts.minimize' },
            { id: 'shortcut-maximize', key: 'advanced.keyboardShortcuts.maximize' },
            { id: 'shortcut-show', key: 'advanced.keyboardShortcuts.show' },
            { id: 'shortcut-hide', key: 'advanced.keyboardShortcuts.hide' }
        ];

        shortcuts.forEach(shortcut => {
            const input = document.getElementById(shortcut.id);
            if (input) {
                // Load saved shortcut
                const keys = shortcut.key.split('.');
                let value = this.settings;
                for (const k of keys) {
                    value = value?.[k];
                }
                input.value = value || '';

                // Add click handler to record new shortcut
                input.addEventListener('click', () => {
                    this.recordShortcut(input, shortcut.key);
                });

                // Prevent typing in the input
                input.addEventListener('keydown', (e) => {
                    e.preventDefault();
                });
            }
        });
    }

    recordShortcut(input, settingKey) {
        input.classList.add('recording');
        input.value = 'Press keys...';
        input.focus();

        const recordedKeys = [];
        
        const keydownHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const key = e.key;
            const modifiers = [];
            
            if (e.ctrlKey) modifiers.push('Ctrl');
            if (e.altKey) modifiers.push('Alt');
            if (e.shiftKey) modifiers.push('Shift');
            if (e.metaKey) modifiers.push('Meta');

            // Don't record modifier keys by themselves
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
                return;
            }

            // Build shortcut string
            const shortcutParts = [...modifiers];
            
            // Format special keys
            let keyName = key;
            if (key === ' ') keyName = 'Space';
            else if (key === 'Escape') keyName = 'Esc';
            else if (key.length === 1) keyName = key.toUpperCase();
            
            shortcutParts.push(keyName);
            const shortcutString = shortcutParts.join('+');

            // Update input and save
            input.value = shortcutString;
            input.classList.remove('recording');
            
            // Update pending settings
            this.updatePendingSetting(settingKey, shortcutString);

            // Remove event listeners
            document.removeEventListener('keydown', keydownHandler, true);
            document.removeEventListener('blur', blurHandler, true);
        };

        const blurHandler = () => {
            input.classList.remove('recording');
            // Restore original value if cancelled
            const keys = settingKey.split('.');
            let value = this.settings;
            for (const k of keys) {
                value = value?.[k];
            }
            input.value = value || '';
            
            document.removeEventListener('keydown', keydownHandler, true);
            document.removeEventListener('blur', blurHandler, true);
        };

        // Use capture phase to catch all keydown events
        document.addEventListener('keydown', keydownHandler, true);
        input.addEventListener('blur', blurHandler, true);
    }

    setupConfigActions() {
        // Save settings button
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', async () => {
                try {
                    saveSettingsBtn.disabled = true;
                    saveSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    
                    // Save all pending settings
                    await this.saveAllPendingSettings();
                    
                    // Update global shortcuts if they were changed
                    if (Object.keys(this.pendingSettings).some(key => key.startsWith('advanced.keyboardShortcuts'))) {
                        await window.electronAPI.updateGlobalShortcuts();
                    }
                    
                    
                    this.showNotification('Settings saved successfully', 'primary');
                } catch (error) {
                    console.error('Error saving settings:', error);
                    this.showNotification('Failed to save settings', 'error');
                } finally {
                    saveSettingsBtn.disabled = false;
                    saveSettingsBtn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
                }
            });
        }

        // Restore defaults button
        const restoreDefaultsBtn = document.getElementById('restore-defaults-btn');
        if (restoreDefaultsBtn) {
            restoreDefaultsBtn.addEventListener('click', async () => {
                try {
                    restoreDefaultsBtn.disabled = true;
                    restoreDefaultsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
                    
                    // Restore default settings
                    this.settings = await window.electronAPI.restoreDefaultSettings();
                    
                    // Clear pending changes
                    this.pendingSettings = {};
                    this.hasUnsavedChanges = false;
                    this.updateSaveButtonState();
                    
                    // Update all UI elements with new settings
                    this.updateAllSettingsUI();
                    this.setupAdvancedSettings();
                    
                    
                    this.showNotification('Settings restored to default', 'primary');
                } catch (error) {
                    console.error('Error restoring defaults:', error);
                    this.showNotification('Failed to restore defaults', 'error');
                } finally {
                    restoreDefaultsBtn.disabled = false;
                    restoreDefaultsBtn.innerHTML = '<i class="fas fa-undo"></i> Restore to Default';
                }
            });
        }

        // Export settings button
        const exportSettingsBtn = document.getElementById('export-settings-btn');
        if (exportSettingsBtn) {
            exportSettingsBtn.addEventListener('click', async () => {
                try {
                    exportSettingsBtn.disabled = true;
                    exportSettingsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
                    
                    const result = await window.electronAPI.exportSettings();
                    
                    if (result.success) {
                        this.showNotification(`Settings exported to ${result.path}`, 'primary');
                    } else if (result.canceled) {
                        this.showNotification('Export canceled', 'info');
                    } else {
                        this.showNotification(`Export failed: ${result.error}`, 'error');
                    }
                } catch (error) {
                    console.error('Error exporting settings:', error);
                    this.showNotification('Failed to export settings', 'error');
                } finally {
                    exportSettingsBtn.disabled = false;
                    exportSettingsBtn.innerHTML = '<i class="fas fa-download"></i> Export Settings';
                }
            });
        }
    }

    updateAllSettingsUI() {
        // Update theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            const theme = this.settings.appearance?.theme || 'dark';
            themeSelect.value = theme;
            this.applyTheme(theme);
        }

        // Update font selector
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            const fontFamily = this.settings.appearance?.fontFamily || 'smooch-sans';
            fontSelect.value = fontFamily;
            this.applyFont(fontFamily);
        }

        // Update font size selector
        const fontSizeSelect = document.getElementById('font-size-select');
        if (fontSizeSelect) {
            const fontSize = this.settings.appearance?.fontSize || 'small';
            fontSizeSelect.value = fontSize;
            this.applyFontSize(fontSize);
        }

        // Update button style selector
        const buttonStyleSelect = document.getElementById('button-style-select');
        if (buttonStyleSelect) {
            const buttonStyle = this.settings.appearance?.titlebarButtonStyle || 'round';
            buttonStyleSelect.value = buttonStyle;
            this.applyButtonStyle(buttonStyle);
        }

        // Update accent color selector
        const accentColorSelect = document.getElementById('accent-color-select');
        if (accentColorSelect) {
            const accentColor = this.settings.appearance?.accentColor || '#00a2ff';
            accentColorSelect.value = accentColor;
            this.applyAccentColor(accentColor);
        }

        // Update behavior settings
        const behaviorSettings = [
            { id: 'remember-window-size', key: 'rememberWindowSize' },
            { id: 'launch-on-startup', key: 'launchOnStartup' },
            { id: 'start-minimized-to-tray', key: 'startMinimizedToTray' },
            { id: 'minimize-to-tray', key: 'minimizeToTray' },
            { id: 'close-to-tray', key: 'closeToTray' },
            { id: 'always-on-top', key: 'alwaysOnTop' }
        ];

        behaviorSettings.forEach(setting => {
            const checkbox = document.getElementById(setting.id);
            if (checkbox) {
                checkbox.checked = this.settings.behavior?.[setting.key] || false;
            }
        });
    }

    updatePendingSetting(key, value) {
        this.pendingSettings[key] = value;
        this.hasUnsavedChanges = true;
        this.updateSaveButtonState();
    }

    updateSaveButtonState() {
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            if (this.hasUnsavedChanges) {
                saveBtn.classList.add('has-changes');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Settings *';
            } else {
                saveBtn.classList.remove('has-changes');
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
            }
        }
    }

    async saveAllPendingSettings() {
        for (const [key, value] of Object.entries(this.pendingSettings)) {
            await window.electronAPI.saveSetting(key, value);
        }
        
        // Update local settings object
        for (const [key, value] of Object.entries(this.pendingSettings)) {
            const keys = key.split('.');
            let current = this.settings;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }
        
        // Clear pending changes
        this.pendingSettings = {};
        this.hasUnsavedChanges = false;
        this.updateSaveButtonState();
    }

    updateOSInfo() {
        const osInfoElement = document.getElementById('current-os-info');
        
        if (osInfoElement) {
            // Get OS information from navigator
            const platform = navigator.platform;
            const userAgent = navigator.userAgent;
            
            let osName = 'Unknown';
            let osVersion = '';
            
            if (platform.includes('Win')) {
                osName = 'Windows';
                if (userAgent.includes('Windows NT 10.0')) {
                    osVersion = '10/11';
                } else if (userAgent.includes('Windows NT 6.3')) {
                    osVersion = '8.1';
                } else if (userAgent.includes('Windows NT 6.2')) {
                    osVersion = '8';
                } else if (userAgent.includes('Windows NT 6.1')) {
                    osVersion = '7';
                }
            } else if (platform.includes('Mac')) {
                osName = 'macOS';
                const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
                if (macMatch) {
                    osVersion = macMatch[1].replace(/_/g, '.');
                }
            } else if (platform.includes('Linux')) {
                osName = 'Linux';
                osVersion = platform;
            }
            
            const architecture = navigator.userAgent.includes('x64') || navigator.userAgent.includes('WOW64') ? 'x64' : 
                                navigator.userAgent.includes('ARM64') ? 'ARM64' : 'x86';
            
            const osInfo = `Current: ${osName}${osVersion ? ' ' + osVersion : ''} (${architecture})`;
            osInfoElement.textContent = osInfo;
        } else {
            // Retry if element not found
            setTimeout(() => this.updateOSInfo(), 100);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.appRenderer = new AppRenderer();
});

// Handle any uncaught errors gracefully
window.addEventListener('error', (event) => {
    console.error('Renderer error:', event.error);
});

// Prevent context menu in production
document.addEventListener('contextmenu', (event) => {
    if (!process.argv || !process.argv.includes('--dev')) {
        event.preventDefault();
    }
});
