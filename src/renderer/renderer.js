// Renderer process script for handling UI interactions and window controls

class AppRenderer {
    constructor() {
        this.isMaximized = false;
        this.init();
    }

    async init() {
        this.settings = await window.electronAPI.getSettings();
        this.setupWindowControls();
        this.setupWindowStateListeners();
        this.setupAppInteractions();
        this.setupMenuControls();
        this.setupTrayNavigation();
        this.setupFontSelector();
        this.setupButtonStyleSelector();
        this.setupAccentColorSelector();
        this.setupBehaviorSettings();
        await this.updateMaximizeButton();
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
            primary: 'linear-gradient(135deg, #9d4edd, #c77dff)',
            secondary: '#3e3e42',
            info: '#0ea5e9'
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
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.add('hidden');
        });

        // Show selected page (handle settings -> config mapping)
        const pageId = pageName === 'settings' ? 'config' : pageName;
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        // Update active menu item
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`.menu-link span:contains('${pageName.charAt(0).toUpperCase() + pageName.slice(1)}')`);
        if (activeLink) {
            activeLink.closest('.menu-link').classList.add('active');
        }
    }

    setupTrayNavigation() {
        // Listen for tray navigation messages from main process
        window.electronAPI.onNavigateToPage((pageName) => {
            this.navigateToPage(pageName);
        });
    }

    setupFontSelector() {
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            // Load saved font preference from settings
            const savedFont = this.settings.appearance?.fontFamily || 'smooch-sans';
            fontSelect.value = savedFont;
            this.applyFont(savedFont);

            // Handle font changes
            fontSelect.addEventListener('change', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedFont = event.target.value;
                this.applyFont(selectedFont);
                await window.electronAPI.saveSetting('appearance.fontFamily', selectedFont);
            });
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

    setupButtonStyleSelector() {
        const buttonStyleSelect = document.getElementById('button-style-select');
        if (buttonStyleSelect) {
            // Load saved button style preference from settings
            const savedStyle = this.settings.appearance?.titlebarButtonStyle || 'round';
            buttonStyleSelect.value = savedStyle;
            this.applyButtonStyle(savedStyle);

            // Handle button style changes
            buttonStyleSelect.addEventListener('change', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedStyle = event.target.value;
                this.applyButtonStyle(selectedStyle);
                await window.electronAPI.saveSetting('appearance.titlebarButtonStyle', selectedStyle);
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
            accentColorSelect.addEventListener('change', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedColor = event.target.value;
                this.applyAccentColor(selectedColor);
                await window.electronAPI.saveSetting('appearance.accentColor', selectedColor);
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
            
            windowStateSelect.addEventListener('change', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const selectedState = event.target.value;
                await window.electronAPI.saveSetting('behavior.defaultWindowState', selectedState);
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
                checkbox.addEventListener('change', async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const isChecked = event.target.checked;
                    await window.electronAPI.saveSetting(setting.key, isChecked);
                });
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppRenderer();
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
