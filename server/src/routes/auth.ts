import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/security';
import { loginSchema, registerSchema, changePasswordSchema } from '../validation/schemas';
import { ApiResponse } from '../types';
import {
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../utils/authCookies';
import {
  createRefreshTokenForUser,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../utils/refreshTokens';

const router = Router();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const signAccessToken = (user: { id: string; email: string; role: string }): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError('JWT_SECRET not configured', 500);
  }

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    // Short-lived access token; refresh token handles long sessions.
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );
};

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, getRefreshTokenCookieOptions());
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshTokenCookieOptions());
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const normalizedEmail = normalizeEmail(email);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role: 'USER',
    }
  });

  // Issue tokens
  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

  const refreshToken = await createRefreshTokenForUser(user.id, {
    ip: req.ip,
    userAgent: req.get('user-agent') || null,
  });
  setRefreshCookie(res, refreshToken);

  const response: ApiResponse = {
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
      token: accessToken,
    }
  };
  res.status(201).json(response);
}));

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('User account is deactivated', 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

  const refreshToken = await createRefreshTokenForUser(user.id, {
    ip: req.ip,
    userAgent: req.get('user-agent') || null,
  });
  setRefreshCookie(res, refreshToken);

  const response: ApiResponse = {
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
      token: accessToken,
    }
  };

  res.json(response);
}));

/**
 * POST /api/auth/refresh
 * Rotate refresh token cookie and return a new access token.
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new AppError('No refresh token', 401);
  }

  const rotated = await rotateRefreshToken(refreshToken, {
    ip: req.ip,
    userAgent: req.get('user-agent') || null,
  });

  if (!rotated) {
    clearRefreshCookie(res);
    throw new AppError('Invalid refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
  if (!user || !user.isActive) {
    // Revoke the newly-issued token and clear cookie.
    await revokeRefreshToken(rotated.newToken);
    clearRefreshCookie(res);
    throw new AppError('User account is deactivated', 403);
  }

  setRefreshCookie(res, rotated.newToken);

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

  const response: ApiResponse = {
    success: true,
    data: {
      token: accessToken,
    }
  };

  res.json(response);
}));

/**
 * POST /api/auth/logout
 * Revoke refresh token cookie (best-effort) and clear it.
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
  if (refreshToken && typeof refreshToken === 'string') {
    await revokeRefreshToken(refreshToken);
  }

  clearRefreshCookie(res);

  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };
  res.json(response);
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      device_fingerprint: (user as any).deviceFingerprint
    }
  };
  res.json(response);
}));

/**
 * PUT /api/auth/me
 * Update current user data (device fingerprint, etc.)
 */
router.put('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { device_fingerprint, name } = req.body;

  const updateData: any = {};
  if (device_fingerprint !== undefined) {
    updateData.deviceFingerprint = device_fingerprint;
  }
  if (name !== undefined) {
    updateData.name = name;
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData
  });

  const response: ApiResponse = {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      device_fingerprint: (user as any).deviceFingerprint
    }
  };
  res.json(response);
}));

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticate, validateBody(changePasswordSchema), asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Password changed successfully'
  };
  res.json(response);
}));

export default router;
