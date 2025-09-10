// Splash Screen JavaScript
class SplashScreen {
  constructor() {
    this.loadingProgress = document.querySelector('.loading-progress');
    this.loadingText = document.querySelector('.loading-text');
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.loadingSteps = [
      { progress: 15, text: 'Initializing...' },
      { progress: 30, text: 'Loading settings...' },
      { progress: 50, text: 'Loading modules...' },
      { progress: 70, text: 'Setting up interface...' },
      { progress: 90, text: 'Applying theme...' },
      { progress: 100, text: 'Ready!' }
    ];
    this.currentStep = 0;
    this.settings = null;
    
    this.init();
  }

  async init() {
    // Load settings first
    await this.loadSettings();
    
    // Apply theme from loaded settings
    this.applyTheme();
    
    // Start loading sequence
    this.startLoadingSequence();
  }

  async loadSettings() {
    try {
      if (window.electronAPI && window.electronAPI.getSettings) {
        this.settings = await window.electronAPI.getSettings();
        console.log('Splash: Loaded settings:', this.settings);
      } else {
        console.warn('Splash: electronAPI.getSettings not available, using defaults');
        this.settings = null;
      }
    } catch (error) {
      console.error('Splash: Error loading settings:', error);
      this.settings = null;
    }
  }

  applyTheme() {
    // Get theme and accent color from loaded settings or use defaults
    const theme = this.settings?.appearance?.theme || 'dark';
    const accentColor = this.settings?.appearance?.accentColor || '#00a2ff';
    
    console.log('Splash: Applying theme:', theme, 'accent:', accentColor);
    
    // Apply theme attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS custom properties for accent color
    document.documentElement.style.setProperty('--accent-color', accentColor);
    
    // Calculate lighter variant for gradients
    const lighterAccent = this.lightenColor(accentColor, 20);
    document.documentElement.style.setProperty('--accent-light', lighterAccent);
    
    // Apply theme-specific background colors
    if (theme === 'light') {
      document.documentElement.style.setProperty('--primary-bg', '#ffffff');
      document.documentElement.style.setProperty('--secondary-bg', '#f8f9fa');
      document.documentElement.style.setProperty('--text-primary', '#212529');
      document.documentElement.style.setProperty('--text-secondary', '#6c757d');
      document.documentElement.style.setProperty('--border-color', '#dee2e6');
    } else {
      // Dark theme (default)
      document.documentElement.style.setProperty('--primary-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--secondary-bg', '#2d2d30');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#cccccc');
      document.documentElement.style.setProperty('--border-color', '#3e3e42');
    }
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  startLoadingSequence() {
    // Start the loading animation
    this.animateProgress();
    
    // Progress through loading steps
    this.loadingSteps.forEach((step, index) => {
      setTimeout(() => {
        this.updateLoadingStep(step);
      }, index * 600 + 500); // Stagger the steps
    });
  }

  updateLoadingStep(step) {
    this.targetProgress = step.progress;
    this.loadingText.textContent = step.text;
    
    // Add completion effect for final step
    if (step.progress === 100) {
      setTimeout(() => {
        this.completeLoading();
      }, 800);
    }
  }

  animateProgress() {
    const animate = () => {
      if (this.currentProgress < this.targetProgress) {
        this.currentProgress += Math.max(1, (this.targetProgress - this.currentProgress) * 0.1);
        this.loadingProgress.style.width = `${Math.min(this.currentProgress, 100)}%`;
      }
      
      if (this.currentProgress < 100) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  completeLoading() {
    // Add completion class for final animations
    document.body.classList.add('loading-complete');
    
    // Notify main process that loading is complete
    console.log('Splash loading complete, attempting to close...');
    if (window.electronAPI?.splashComplete) {
      console.log('electronAPI.splashComplete found, calling...');
      setTimeout(() => {
        window.electronAPI.splashComplete();
      }, 500);
    } else {
      console.error('electronAPI.splashComplete not available');
    }
  }
}

// Initialize splash screen when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SplashScreen();
});

// Fallback: Auto-complete after 5 seconds if no API available
setTimeout(() => {
  console.log('Fallback timeout triggered after 5 seconds');
  if (window.electronAPI?.splashComplete) {
    console.log('Fallback calling splashComplete...');
    window.electronAPI.splashComplete();
  } else {
    console.error('Fallback: electronAPI.splashComplete not available');
  }
}, 5000);
