import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure logging based on environment
const getLogConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' }
    ] as const;
  }
  return [{ emit: 'event', level: 'error' }] as const;
};

// Create Prisma client with configuration
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: getLogConfig(),
    // Connection pool settings are configured via DATABASE_URL
    // Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30
  });

  // Event listeners for logging
  if (process.env.NODE_ENV === 'development') {
    (client.$on as any)('query', (e: any) => {
      logger.debug({
        type: 'database',
        query: e.query,
        params: e.params,
        duration: e.duration
      }, `Query executed in ${e.duration}ms`);
    });
  }

  (client.$on as any)('error', (e: any) => {
    logger.error({
      type: 'database',
      message: e.message,
      target: e.target
    }, `Database error: ${e.message}`);
  });

  (client.$on as any)('warn', (e: any) => {
    logger.warn({
      type: 'database',
      message: e.message
    }, `Database warning: ${e.message}`);
  });

  return client;
};

// Export singleton instance
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Health check function
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection check failed');
    return false;
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

// Connection with retry
export const connectWithRetry = async (maxRetries = 5, delay = 5000): Promise<void> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
      return;
    } catch (error) {
      logger.warn({ attempt, maxRetries }, `Database connection attempt ${attempt} failed`);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export default prisma;
