// Renderer process script for handling UI interactions and window controls

class AppRenderer {
    constructor() {
        this.isMaximized = false;
        this.init();
    }

    async init() {
        this.setupWindowControls();
        this.setupWindowStateListeners();
        this.setupAppInteractions();
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
        // Get action buttons
        const primaryBtn = document.querySelector('.primary-button');
        const secondaryBtn = document.querySelector('.secondary-button');

        // Add click handlers for demo purposes
        primaryBtn.addEventListener('click', () => {
            this.showNotification('Get Started clicked!', 'primary');
        });

        secondaryBtn.addEventListener('click', () => {
            this.showNotification('Learn More clicked!', 'secondary');
        });

        // Add feature card interactions
        this.setupFeatureCards();
    }

    setupFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const title = card.querySelector('h3').textContent;
                this.showNotification(`${title} feature selected!`, 'info');
            });

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
