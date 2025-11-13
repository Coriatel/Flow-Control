// Smart caching for dashboard data
export class DashboardCache {
  static CACHE_KEY = 'dashboard_cache';
  static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static set(data) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };
    
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Could not save dashboard cache:', error);
    }
  }

  static get() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      
      if (Date.now() - timestamp > ttl) {
        this.clear();
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Could not load dashboard cache:', error);
      return null;
    }
  }

  static clear() {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Could not clear dashboard cache:', error);
    }
  }

  static isValid() {
    const cached = this.get();
    return cached !== null;
  }
}

export default DashboardCache;