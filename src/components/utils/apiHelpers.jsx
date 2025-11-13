
// 🔧 Shared API utilities for rate limiting and error handling
// This replaces duplicated safeFetch logic across components

import logger from './logger';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Safe API fetch with automatic rate limiting and retry logic
 * @param {Function} apiCall - The API function to call (e.g., () => Entity.list())
 * @param {Object} options - Configuration options
 * @param {number} options.retries - Number of retry attempts (default: 2)
 * @param {number} options.baseDelay - Base delay between retries in ms (default: 200)
 * @param {boolean} options.progressiveDelay - Whether to increase delay with each retry (default: true)
 * @returns {Promise} - API response or empty array on failure
 */
export const safeFetch = async (apiCall, options = {}) => {
  const {
    retries = 2,
    baseDelay = 200,
    progressiveDelay = true,
    fallbackValue = []
  } = options;

  const startTime = Date.now();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Progressive delay to avoid overwhelming the server
      const delay = progressiveDelay ? baseDelay * attempt : baseDelay;
      await sleep(delay);
      
      logger.api(`Attempting API call (attempt ${attempt}/${retries})`);
      const result = await apiCall();
      
      logger.timeApiCall('safeFetch', startTime);
      logger.api(`Success on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      logger.warn(`API attempt ${attempt} failed: ${error.message}`);
      
      // Handle rate limiting specifically
      if (error.message?.includes('Rate limit') && attempt < retries) {
        logger.warn(`Rate limit detected, waiting longer...`);
        await sleep(2000 * attempt); // Longer wait for rate limits
        continue;
      }
      
      // If this is the last attempt, return fallback instead of throwing
      if (attempt === retries) {
        logger.error(`All ${retries} API attempts failed. Returning fallback value.`);
        return fallbackValue;
      }
    }
  }
  
  return fallbackValue;
};

/**
 * Execute multiple API calls with staggered timing to prevent rate limiting
 * @param {Array} apiCalls - Array of API call functions
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} - Array of results using Promise.allSettled
 */
export const safeFetchMultiple = async (apiCalls, options = {}) => {
  const { staggerDelay = 100 } = options;
  
  logger.api(`Executing ${apiCalls.length} API calls with staggered timing`);
  
  // Add small delays between calls to prevent overwhelming
  const staggeredCalls = apiCalls.map((call, index) => 
    new Promise(resolve => 
      setTimeout(() => resolve(safeFetch(call, options)), index * staggerDelay)
    )
  );
  
  const results = await Promise.allSettled(staggeredCalls);
  
  // Extract successful results and log any failures
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      logger.warn(`API call ${index} failed:`, result.reason);
      return options.fallbackValue || [];
    }
  });
};

/**
 * Cache wrapper for API calls to reduce redundant requests
 * Simple in-memory cache with TTL
 */
class ApiCache {
  constructor(ttlMs = 30000) { // 30 seconds default TTL
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    logger.debug(`Cache hit for key: ${key}`);
    return item.data;
  }
  
  set(key, data) {
    logger.debug(`Storing in cache: ${key}`);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    logger.info(`Clearing all cached data`);
    this.cache.clear();
  }
}

// Global cache instance
export const apiCache = new ApiCache();

/**
 * Cached API fetch - checks cache first, then fetches if needed
 * @param {string} cacheKey - Unique key for caching this request
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - safeFetch options plus cache options
 */
export const cachedFetch = async (cacheKey, apiCall, options = {}) => {
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch and cache
  const result = await safeFetch(apiCall, options);
  apiCache.set(cacheKey, result);
  
  return result;
};

export default {
  safeFetch,
  safeFetchMultiple,
  cachedFetch,
  apiCache
};
