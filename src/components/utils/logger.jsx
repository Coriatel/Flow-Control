// 🧹 Smart logging system - only logs in development
// Replaces scattered console.log statements throughout the app

class Logger {
  constructor() {
    // Detect if we're in development mode
    this.isDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname.includes('base44.io') ||
      window.location.hostname.includes('dev');
    
    this.isDebugMode = localStorage.getItem('debug_mode') === 'true';
  }

  // Main logging method
  _log(level, message, ...args) {
    // Only log in development or if debug mode is explicitly enabled
    if (!this.isDevelopment && !this.isDebugMode) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString('he-IL');
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, ...args);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, ...args);
        break;
      case 'error':
        console.error(`${prefix} ${message}`, ...args);
        break;
      case 'debug':
        console.log(`${prefix} 🐛 ${message}`, ...args);
        break;
      case 'api':
        console.log(`${prefix} 🌐 ${message}`, ...args);
        break;
      case 'performance':
        console.log(`${prefix} ⚡ ${message}`, ...args);
        break;
      default:
        console.log(`${prefix} ${message}`, ...args);
    }
  }

  // Public methods
  info(message, ...args) {
    this._log('info', message, ...args);
  }

  warn(message, ...args) {
    this._log('warn', message, ...args);
  }

  error(message, ...args) {
    this._log('error', message, ...args);
  }

  debug(message, ...args) {
    this._log('debug', message, ...args);
  }

  api(message, ...args) {
    this._log('api', message, ...args);
  }

  performance(message, ...args) {
    this._log('performance', message, ...args);
  }

  // Special method for API timing
  timeApiCall(apiName, startTime) {
    const duration = Date.now() - startTime;
    this.performance(`API Call ${apiName} took ${duration}ms`);
  }

  // Method to enable debug mode temporarily
  enableDebugMode() {
    localStorage.setItem('debug_mode', 'true');
    this.isDebugMode = true;
    this.info('Debug mode enabled');
  }

  disableDebugMode() {
    localStorage.removeItem('debug_mode');
    this.isDebugMode = false;
    this.info('Debug mode disabled');
  }

  // Always log critical errors, even in production
  critical(message, ...args) {
    const timestamp = new Date().toLocaleTimeString('he-IL');
    const prefix = `[${timestamp}] [CRITICAL]`;
    console.error(`${prefix} 🚨 ${message}`, ...args);
    
    // In production, could also send to error tracking service
    if (!this.isDevelopment) {
      // TODO: Send to error tracking service like Sentry
    }
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;

// Export individual methods for convenience
export const { info, warn, error, debug, api, performance, critical } = logger;