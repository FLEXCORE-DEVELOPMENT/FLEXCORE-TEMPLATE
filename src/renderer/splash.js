// Splash Screen JavaScript
class SplashScreen {
  constructor() {
    this.loadingProgress = document.querySelector('.loading-progress');
    this.loadingText = document.querySelector('.loading-text');
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.loadingSteps = [
      { progress: 20, text: 'Initializing...' },
      { progress: 40, text: 'Loading modules...' },
      { progress: 60, text: 'Setting up interface...' },
      { progress: 80, text: 'Applying theme...' },
      { progress: 100, text: 'Ready!' }
    ];
    this.currentStep = 0;
    
    this.init();
  }

  init() {
    // Apply theme from settings
    this.applyTheme();
    
    // Start loading sequence
    this.startLoadingSequence();
    
    // Listen for theme updates
    window.electronAPI?.onThemeChanged?.(this.applyTheme.bind(this));
  }

  applyTheme() {
    // Get theme from settings or default to dark
    const theme = window.electronAPI?.getSettings?.()?.appearance?.theme || 'dark';
    const accentColor = window.electronAPI?.getSettings?.()?.appearance?.accentColor || '#9d4edd';
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS custom properties for accent color
    document.documentElement.style.setProperty('--accent-color', accentColor);
    
    // Calculate lighter variant for gradients
    const lighterAccent = this.lightenColor(accentColor, 20);
    document.documentElement.style.setProperty('--accent-light', lighterAccent);
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
