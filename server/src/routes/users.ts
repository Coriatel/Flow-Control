import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse, UserRole } from '../types';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { role, isActive, search } = req.query;

  const where: any = {};

  if (role) {
    where.role = role as UserRole;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { name: 'asc' }
  });

  const response: ApiResponse = {
    success: true,
    data: users,
    meta: { total: users.length }
  };
  res.json(response);
}));

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: user
  };
  res.json(response);
}));

/**
 * POST /api/users
 * Create new user (Admin only)
 */
router.post('/', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body;

  if (!email || !name || !password) {
    throw new AppError('email, name, and password are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    throw new AppError('Email already in use', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: role || 'USER'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: user,
    message: 'User created successfully'
  };
  res.status(201).json(response);
}));

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put('/:id', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name, role, isActive } = req.body;

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  // Check if new email is already in use by another user
  if (email && email !== existing.email) {
    const emailInUse = await prisma.user.findUnique({
      where: { email }
    });

    if (emailInUse) {
      throw new AppError('Email already in use', 400);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      email,
      name,
      role,
      isActive
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user.id,
      details: { changes: { email, name, role, isActive } }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: user,
    message: 'User updated successfully'
  };
  res.json(response);
}));

/**
 * DELETE /api/users/:id
 * Deactivate user (Admin only)
 */
router.delete('/:id', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent deleting self
  if (id === req.user?.id) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action: 'DEACTIVATE_USER',
      entityType: 'User',
      entityId: id,
      details: { email: existing.email }
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'User deactivated successfully'
  };
  res.json(response);
}));

/**
 * POST /api/users/:id/activate
 * Reactivate user (Admin only)
 */
router.post('/:id/activate', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action: 'ACTIVATE_USER',
      entityType: 'User',
      entityId: id,
      details: { email: user.email }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: user,
    message: 'User activated successfully'
  };
  res.json(response);
}));

/**
 * POST /api/users/:id/reset-password
 * Reset user password (Admin only)
 */
router.post('/:id/reset-password', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new AppError('newPassword is required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action: 'RESET_USER_PASSWORD',
      entityType: 'User',
      entityId: id,
      details: { email: existing.email }
    }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Password reset successfully'
  };
  res.json(response);
}));

/**
 * PUT /api/users/:id/role
 * Change user role (Admin only)
 */
router.put('/:id/role', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    throw new AppError('role is required', 400);
  }

  const validRoles = ['ADMIN', 'MANAGER', 'USER', 'READONLY'];
  if (!validRoles.includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  // Prevent demoting self from admin
  if (id === req.user?.id && role !== 'ADMIN') {
    throw new AppError('Cannot change your own role', 400);
  }

  const existing = await prisma.user.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true
    }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user?.id,
      action: 'CHANGE_USER_ROLE',
      entityType: 'User',
      entityId: id,
      details: { email: user.email, oldRole: existing.role, newRole: role }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: user,
    message: 'User role updated successfully'
  };
  res.json(response);
}));

export default router;
