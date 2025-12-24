import pino, { Logger, LoggerOptions } from 'pino';

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const customLevel = process.env.LOG_LEVEL;

  if (customLevel) {
    return customLevel;
  }

  switch (env) {
    case 'production':
      return 'info';
    case 'test':
      return 'silent';
    default:
      return 'debug';
  }
};

// Create base logger options
const baseOptions: LoggerOptions = {
  level: getLogLevel(),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      service: 'flow-control-api'
    })
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'secret'],
    censor: '[REDACTED]'
  }
};

// Development pretty printing
const developmentOptions: LoggerOptions = {
  ...baseOptions,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
};

// Production JSON logging
const productionOptions: LoggerOptions = {
  ...baseOptions,
  // No transport - outputs JSON to stdout
};

// Create the logger based on environment
const createLogger = (): Logger => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'development') {
    // Check if pino-pretty is available
    try {
      require.resolve('pino-pretty');
      return pino(developmentOptions);
    } catch {
      // pino-pretty not installed, use JSON
      return pino(baseOptions);
    }
  }

  return pino(productionOptions);
};

// Export the logger instance
export const logger = createLogger();

// Helper functions for structured logging
export const logRequest = (req: { method: string; url: string; ip?: string }, responseTime?: number) => {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    responseTime
  }, `${req.method} ${req.url}`);
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  }, error.message);
};

export const logDatabaseQuery = (query: string, duration: number, params?: unknown[]) => {
  logger.debug({
    type: 'database',
    query,
    duration,
    params
  }, `Database query executed in ${duration}ms`);
};

export const logAuth = (action: string, userId?: string, success: boolean = true, details?: Record<string, unknown>) => {
  const logLevel = success ? 'info' : 'warn';
  logger[logLevel]({
    type: 'auth',
    action,
    userId,
    success,
    ...details
  }, `Auth: ${action} - ${success ? 'success' : 'failed'}`);
};

export const logActivity = (
  action: string,
  entityType: string,
  entityId: string,
  userId?: string,
  details?: Record<string, unknown>
) => {
  logger.info({
    type: 'activity',
    action,
    entityType,
    entityId,
    userId,
    ...details
  }, `${action} on ${entityType}:${entityId}`);
};

export const logMetric = (name: string, value: number, tags?: Record<string, string>) => {
  logger.info({
    type: 'metric',
    metric: name,
    value,
    tags
  }, `Metric: ${name}=${value}`);
};

// Child logger factory for specific contexts
export const createChildLogger = (context: Record<string, unknown>): Logger => {
  return logger.child(context);
};

export default logger;
