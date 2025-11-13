import React from 'react';

// Performance optimization utilities
export class PerformanceOptimizer {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  static memoize(fn) {
    const cache = {};
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache[key]) {
        return cache[key];
      }
      const result = fn(...args);
      cache[key] = result;
      return result;
    };
  }

  static lazy(importFunc) {
    return React.lazy(importFunc);
  }

  // ⭐ Optimized preload - only essential data
  static preloadCriticalData() {
    const criticalEntities = ['Reagent']; // Only most critical
    
    criticalEntities.forEach(async (entityName) => {
      try {
        const module = await import(`@/api/entities/${entityName}`);
        // Cache only first 20 records for speed
        const data = await module[entityName].list('-created_date', 20);
        sessionStorage.setItem(`cache_${entityName}`, JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl: 3 * 60 * 1000 // Reduced to 3 minutes
        }));
        console.log(`✅ Preloaded ${entityName}: ${data.length} records`);
      } catch (error) {
        console.warn(`Failed to preload ${entityName}:`, error);
      }
    });
  }

  // Get cached data if available and fresh
  static getCachedData(entityName) {
    try {
      const cached = sessionStorage.getItem(`cache_${entityName}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) {
        sessionStorage.removeItem(`cache_${entityName}`);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  // ⭐ Check if app needs optimization
  static needsOptimization() {
    const checks = {
      slowConnection: navigator.connection?.effectiveType === '2g',
      lowMemory: navigator.deviceMemory && navigator.deviceMemory < 4,
      oldDevice: /Mobi|Android/i.test(navigator.userAgent) && window.screen.width < 768
    };
    
    return Object.values(checks).some(Boolean);
  }

  // ⭐ Apply optimizations for slow devices
  static applyOptimizations() {
    if (this.needsOptimization()) {
      console.log('🐌 Applying optimizations for slow device...');
      
      // Disable heavy animations
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      
      // Reduce cache TTL
      this.CACHE_TTL = 1 * 60 * 1000; // 1 minute only
      
      // Lazy load more aggressively
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
      });
    }
  }
}

export default PerformanceOptimizer;