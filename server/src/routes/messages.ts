import { Router, Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createMessageSchema } from '../validation/schemas';
import { ApiResponse } from '../types';

const router = Router();

// All message routes require authentication
router.use(authenticate);

/**
 * GET /api/messages
 * Get messages for current user
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const data = await messageService.getMessagesForUser(req.user!.id, {
      page,
      limit,
      unreadOnly,
    });

    const response: ApiResponse = {
      success: true,
      data: data.messages,
      meta: { total: data.total, page: data.page, limit: data.limit },
    };
    res.json(response);
  })
);

/**
 * GET /api/messages/unread-count
 * Get unread message count for current user
 */
router.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const count = await messageService.getUnreadCount(req.user!.id);
    const response: ApiResponse = {
      success: true,
      data: { count },
    };
    res.json(response);
  })
);

/**
 * POST /api/messages
 * Send a new message (ADMIN, MANAGER only)
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validateBody(createMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { recipientType, recipientIds, title, content, messageType, priority } =
      req.body;

    const message = await messageService.sendMessage({
      senderId: req.user!.id,
      senderName: (req.user as any).name || (req.user as any).email || 'מערכת',
      recipientType,
      recipientIds: recipientIds || [],
      title,
      content,
      messageType,
      priority,
    });

    const response: ApiResponse = {
      success: true,
      data: message,
      message: 'ההודעה נשלחה בהצלחה',
    };
    res.status(201).json(response);
  })
);

/**
 * POST /api/messages/:id/read
 * Mark message as read
 */
router.post(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    await messageService.markAsRead(req.params.id, req.user!.id);
    const response: ApiResponse = {
      success: true,
      message: 'ההודעה סומנה כנקראה',
    };
    res.json(response);
  })
);

/**
 * POST /api/messages/:id/dismiss
 * Dismiss a message
 */
router.post(
  '/:id/dismiss',
  asyncHandler(async (req: Request, res: Response) => {
    await messageService.dismiss(req.params.id, req.user!.id);
    const response: ApiResponse = {
      success: true,
      message: 'ההודעה הוסתרה',
    };
    res.json(response);
  })
);

export default router;
