import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import apiRoutes from './routes';
import webAuthRoutes from './routes/webAuth';
import { errorHandler } from './middleware/errorHandler';
import { simpleRequestLogger, errorLogger } from './middleware/requestLogger';
import { helmetConfig, generalLimiter, corsOptions, devCorsOptions } from './middleware/security';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Security Middleware - Helmet for HTTP headers
app.use(helmetConfig);

// Rate limiting for all API routes
app.use('/api/', generalLimiter);

// CORS Configuration
app.use(cors(isProduction ? corsOptions : devCorsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookies (refresh tokens, OAuth state)
app.use(cookieParser());

// Request logging
app.use(simpleRequestLogger());

// Trust proxy for rate limiting behind reverse proxy (Caddy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Root health check (no rate limiting)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'flow-control-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// OAuth entrypoints (Google) live outside /api
app.use('/auth', webAuthRoutes);

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error logging
app.use(errorLogger());

// Error handler
app.use(errorHandler);

// Log application startup info
logger.info({
  environment: process.env.NODE_ENV || 'development',
  securityEnabled: true,
  rateLimitingEnabled: true
}, 'Application configured with security middleware');

export default app;
