import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  // Validation
  if (!email || !password || !name) {
    throw new AppError('Email, password and name are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'USER'
    }
  });

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('JWT_SECRET not configured', 500);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  // Return user (without password) and token
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('User account is deactivated', 403);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('JWT_SECRET not configured', 500);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  // Return user (without password) and token
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      },
      token
    }
  });
}));

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // If using refresh tokens or session storage, handle here
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  // Get fresh user data
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Return user (without password)
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;
