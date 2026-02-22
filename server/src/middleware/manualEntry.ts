import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import prisma from '../utils/prisma';

/**
 * Manual Entry Permission Middleware
 *
 * Controls who can perform manual quantity entry (without barcode scan).
 * Checks system setting 'manual_entry_policy':
 *   - 'admin_only' (default): Only ADMIN role can enter manually
 *   - 'all_users': Any authenticated user can enter manually
 */
export const requireManualEntryPermission = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // ADMINs always have permission
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check system setting
    const setting = await prisma.systemSettings.findFirst({
      where: { key: 'manual_entry_policy' },
    });

    const policy = setting?.value || 'admin_only';

    if (policy === 'all_users') {
      return next();
    }

    throw new AppError('הזנה ידנית דורשת הרשאות מנהל', 403);
  } catch (error) {
    next(error);
  }
};
