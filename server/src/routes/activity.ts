import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

/**
 * GET /api/activity
 * Get activity log with filters and pagination
 */
router.get('/', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { userId, action, entityType, entityId, fromDate, toDate, page = '1', limit = '50' } = req.query;

  const where: any = {};

  if (userId) {
    where.userId = userId as string;
  }

  if (action) {
    where.action = { contains: action as string, mode: 'insensitive' };
  }

  if (entityType) {
    where.entityType = entityType as string;
  }

  if (entityId) {
    where.entityId = entityId as string;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = new Date(fromDate as string);
    }
    if (toDate) {
      where.createdAt.lte = new Date(toDate as string);
    }
  }

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.activityLog.count({ where })
  ]);

  // Enrich with user info
  const userIds = [...new Set(activities.map(a => a.userId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  const enrichedActivities = activities.map(activity => ({
    ...activity,
    user: activity.userId ? userMap.get(activity.userId) : null
  }));

  const response: ApiResponse = {
    success: true,
    data: enrichedActivities,
    meta: {
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    }
  };
  res.json(response);
}));

/**
 * GET /api/activity/recent
 * Get recent activity (last 24 hours)
 */
router.get('/recent', asyncHandler(async (req: Request, res: Response) => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const activities = await prisma.activityLog.findMany({
    where: {
      createdAt: { gte: oneDayAgo }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // Enrich with user info
  const userIds = [...new Set(activities.map(a => a.userId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  const enrichedActivities = activities.map(activity => ({
    ...activity,
    user: activity.userId ? userMap.get(activity.userId) : null
  }));

  const response: ApiResponse = {
    success: true,
    data: enrichedActivities
  };
  res.json(response);
}));

/**
 * GET /api/activity/by-entity/:entityType/:entityId
 * Get activity for a specific entity
 */
router.get('/by-entity/:entityType/:entityId', asyncHandler(async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { limit = '20' } = req.query;

  const activities = await prisma.activityLog.findMany({
    where: {
      entityType,
      entityId
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string)
  });

  // Enrich with user info
  const userIds = [...new Set(activities.map(a => a.userId).filter(Boolean))] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  const enrichedActivities = activities.map(activity => ({
    ...activity,
    user: activity.userId ? userMap.get(activity.userId) : null
  }));

  const response: ApiResponse = {
    success: true,
    data: enrichedActivities
  };
  res.json(response);
}));

/**
 * GET /api/activity/by-user/:userId
 * Get activity for a specific user
 */
router.get('/by-user/:userId', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = '50' } = req.query;

  const activities = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string)
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  });

  const response: ApiResponse = {
    success: true,
    data: {
      user,
      activities
    }
  };
  res.json(response);
}));

/**
 * GET /api/activity/my
 * Get current user's activity
 */
router.get('/my', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '50' } = req.query;

  const activities = await prisma.activityLog.findMany({
    where: { userId: req.user?.id },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit as string)
  });

  const response: ApiResponse = {
    success: true,
    data: activities
  };
  res.json(response);
}));

/**
 * GET /api/activity/summary
 * Get activity summary/statistics
 */
router.get('/summary', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;

  const where: any = {};

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = new Date(fromDate as string);
    }
    if (toDate) {
      where.createdAt.lte = new Date(toDate as string);
    }
  }

  // Get action counts
  const actionGroups = await prisma.activityLog.groupBy({
    by: ['action'],
    where,
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
    take: 20
  });

  // Get entity type counts
  const entityGroups = await prisma.activityLog.groupBy({
    by: ['entityType'],
    where: {
      ...where,
      entityType: { not: null }
    },
    _count: { entityType: true },
    orderBy: { _count: { entityType: 'desc' } }
  });

  // Get user activity counts
  const userGroups = await prisma.activityLog.groupBy({
    by: ['userId'],
    where: {
      ...where,
      userId: { not: null }
    },
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 10
  });

  // Enrich user data
  const userIds = userGroups.map(g => g.userId).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const response: ApiResponse = {
    success: true,
    data: {
      byAction: actionGroups.map(g => ({
        action: g.action,
        count: g._count.action
      })),
      byEntityType: entityGroups.map(g => ({
        entityType: g.entityType,
        count: g._count.entityType
      })),
      byUser: userGroups.map(g => ({
        userId: g.userId,
        user: g.userId ? userMap.get(g.userId) : null,
        count: g._count.userId
      })),
      total: await prisma.activityLog.count({ where })
    }
  };
  res.json(response);
}));

/**
 * POST /api/activity
 * Create activity log entry (for manual logging)
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { action, entityType, entityId, details, notes } = req.body;

  if (!action) {
    throw new Error('action is required');
  }

  const activity = await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action,
      entityType,
      entityId,
      details: details ? { ...details, notes } : notes ? { notes } : undefined,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  const response: ApiResponse = {
    success: true,
    data: activity,
    message: 'Activity logged'
  };
  res.status(201).json(response);
}));

export default router;
