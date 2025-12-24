import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT_SECRET not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is provided, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET;

      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on invalid token for optional auth
    next();
  }
};
