// App-level performance optimizations
export class AppOptimizer {

  static initializeApp() {
    console.log('🚀 Initializing app optimizations...');

    // Preconnect to external resources
    this.preconnectResources();

    // Optimize images loading
    this.optimizeImages();

    // Cleanup old cache
    this.cleanupOldCache();
  }

  static preconnectResources() {
    const resources = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://i.imgur.com'
    ];

    resources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  static optimizeImages() {
    // Add loading="lazy" to all images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  }

  static cleanupOldCache() {
    // Clean up old localStorage items
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('dashboard_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item.timestamp && now - item.timestamp > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Could not clean cache:', error);
    }
  }

  static measurePerformance() {
    if (window.performance && window.performance.navigation) {
      const perfData = window.performance.navigation;
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;

      console.log(`📊 App load time: ${loadTime}ms`);

      if (loadTime > 5000) {
        console.warn('⚠️ Slow app load detected');
      }
    }
  }
}

// Initialize when script loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    AppOptimizer.initializeApp();
    setTimeout(() => AppOptimizer.measurePerformance(), 1000);
  });
}

export default AppOptimizer;