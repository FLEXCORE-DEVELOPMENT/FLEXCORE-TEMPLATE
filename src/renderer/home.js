// Home page specific functionality
class HomePage {
    constructor() {
        this.isInitialized = false;
        this.animationDelay = 100;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.setupAnimations();
        this.setupStats();
        this.isInitialized = true;
        
        console.log('Home page initialized');
    }

    setupEventListeners() {
        // Get Started button
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                this.handleGetStarted();
            });
        }

        // Learn More button
        const learnMoreBtn = document.getElementById('learn-more-btn');
        if (learnMoreBtn) {
            learnMoreBtn.addEventListener('click', () => {
                this.handleLearnMore();
            });
        }

        // Feature card interactions
        this.setupFeatureCardInteractions();
    }

    setupFeatureCardInteractions() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            // Add click handler for feature cards
            card.addEventListener('click', () => {
                this.handleFeatureCardClick(index);
            });

            // Add keyboard navigation
            card.setAttribute('tabindex', '0');
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.handleFeatureCardClick(index);
                }
            });
        });
    }

    setupAnimations() {
        // Animate feature cards on page load
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.classList.add('animate-in');
            }, this.animationDelay * (index + 1));
        });

        // Set up intersection observer for scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            // Observe stats and actions sections
            const statsSection = document.querySelector('.home-stats');
            const actionsSection = document.querySelector('.home-actions');
            
            if (statsSection) observer.observe(statsSection);
            if (actionsSection) observer.observe(actionsSection);
        }
    }

    setupStats() {
        // Animate stats counters when they come into view
        const statNumbers = document.querySelectorAll('.stat-number');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.5
            });

            statNumbers.forEach(stat => observer.observe(stat));
        } else {
            // Fallback for browsers without IntersectionObserver
            setTimeout(() => {
                statNumbers.forEach(stat => this.animateCounter(stat));
            }, 1000);
        }
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.count) || 0;
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60 FPS
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            element.textContent = Math.floor(current);
            element.classList.add('counting');
            
            if (current >= target) {
                element.textContent = target;
                element.classList.remove('counting');
                clearInterval(timer);
            }
        }, 16);
    }

    handleGetStarted() {
        // Navigate to configs page or show getting started modal
        if (window.appRenderer && window.appRenderer.navigateToPage) {
            window.appRenderer.navigateToPage('configs');
            this.showNotification('Welcome to FlexCore! Configure your settings to get started.', 'info');
        } else {
            this.showNotification('Getting started functionality coming soon!', 'info');
        }
    }

    handleLearnMore() {
        // Navigate to details page
        if (window.appRenderer && window.appRenderer.navigateToPage) {
            window.appRenderer.navigateToPage('details');
            this.showNotification('Learn more about FlexCore Template', 'info');
        } else {
            this.showNotification('Learn more functionality coming soon!', 'info');
        }
    }

    handleFeatureCardClick(index) {
        const features = [
            {
                title: 'Modern UI',
                description: 'Explore our modern interface with custom titlebar and beautiful components.',
                action: () => this.showFeatureDemo('ui')
            },
            {
                title: 'Secure',
                description: 'Learn about our security implementation with context isolation and CSP.',
                action: () => this.showFeatureDemo('security')
            },
            {
                title: 'Cross-Platform',
                description: 'Discover how FlexCore works seamlessly across different operating systems.',
                action: () => this.showFeatureDemo('platform')
            }
        ];

        const feature = features[index];
        if (feature) {
            this.showNotification(feature.description, 'info');
            feature.action();
        }
    }

    showFeatureDemo(featureType) {
        // This could show detailed information about each feature
        const demos = {
            ui: () => {
                // Could highlight UI elements or show a tour
                console.log('UI feature demo');
            },
            security: () => {
                // Could show security information
                console.log('Security feature demo');
            },
            platform: () => {
                // Could show platform compatibility info
                console.log('Platform feature demo');
            }
        };

        if (demos[featureType]) {
            demos[featureType]();
        }
    }

    showNotification(message, type = 'info') {
        // Use the main app's notification system if available
        if (window.appRenderer && window.appRenderer.showNotification) {
            window.appRenderer.showNotification(message, type);
        } else {
            // Fallback notification system
            console.log(`Notification (${type}): ${message}`);
        }
    }

    // Method to refresh/reload home page content
    refresh() {
        if (!this.isInitialized) {
            this.init();
            return;
        }

        // Reset animations
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.classList.remove('animate-in');
        });

        // Restart animations
        setTimeout(() => {
            this.setupAnimations();
        }, 100);
    }

    // Method to update stats dynamically
    updateStats(newStats) {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach((stat, index) => {
            if (newStats[index] !== undefined) {
                stat.dataset.count = newStats[index];
                this.animateCounter(stat);
            }
        });
    }

    // Method to add welcome message
    showWelcomeMessage(title = 'Welcome to FlexCore!', message = 'Your modern Electron application is ready to use.') {
        const existingWelcome = document.querySelector('.welcome-message');
        if (existingWelcome) {
            existingWelcome.remove();
        }

        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="welcome-title">${title}</div>
            <div class="welcome-text">${message}</div>
        `;

        const contentArea = document.querySelector('#home-page .content-area');
        if (contentArea) {
            contentArea.insertBefore(welcomeDiv, contentArea.firstChild);
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            welcomeDiv.style.transition = 'opacity 0.5s ease';
            welcomeDiv.style.opacity = '0';
            setTimeout(() => {
                if (welcomeDiv.parentNode) {
                    welcomeDiv.parentNode.removeChild(welcomeDiv);
                }
            }, 500);
        }, 5000);
    }

    // Cleanup method
    destroy() {
        this.isInitialized = false;
        
        // Remove event listeners
        const getStartedBtn = document.getElementById('get-started-btn');
        const learnMoreBtn = document.getElementById('learn-more-btn');
        
        if (getStartedBtn) {
            getStartedBtn.removeEventListener('click', this.handleGetStarted);
        }
        
        if (learnMoreBtn) {
            learnMoreBtn.removeEventListener('click', this.handleLearnMore);
        }

        console.log('Home page destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HomePage;
}

// Global instance for direct access
window.HomePage = HomePage;
