import { Request, Response, NextFunction } from 'express';
import { logger, createChildLogger } from '../utils/logger';

// Extend Express Request to include requestId and logger
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: typeof logger;
    }
  }
}

/**
 * Generate a unique request ID
 */
const generateRequestId = (): string => {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Request logging middleware
 * Adds request ID and logger to request, logs request/response
 */
export const requestLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate request ID
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    req.requestId = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    // Create child logger with request context
    req.log = createChildLogger({
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip || req.socket.remoteAddress
    });

    // Record start time
    const startTime = Date.now();

    // Log incoming request
    req.log.info({
      type: 'http',
      direction: 'incoming',
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      userAgent: req.get('user-agent'),
      contentLength: req.get('content-length')
    }, `-> ${req.method} ${req.path}`);

    // Capture response
    const originalSend = res.send;
    res.send = function(body): Response {
      const duration = Date.now() - startTime;

      // Log response
      req.log?.info({
        type: 'http',
        direction: 'outgoing',
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length')
      }, `<- ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);

      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Simple request logger for development
 * Less verbose than full requestLogger
 */
export const simpleRequestLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const level = res.statusCode >= 400 ? 'warn' : 'info';

      logger[level]({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration
      }, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });

    next();
  };
};

/**
 * Error logging middleware
 * Should be placed after routes but before error handler
 */
export const errorLogger = () => {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    const log = req.log || logger;

    log.error({
      type: 'error',
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      requestId: req.requestId,
      userId: req.user?.id
    }, `Error: ${err.message}`);

    next(err);
  };
};

export default requestLogger;
