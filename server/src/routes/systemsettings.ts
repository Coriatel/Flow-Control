import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// Default settings for when database is empty or unavailable
const DEFAULT_SETTINGS = {
    id: 'default',
    key: 'display',
    value: {
        mainHeaderName: 'מערכת ניהול ריאגנטים',
        sidebarHeaderName: 'ניהול מלאי ריאגנטים',
        logoUrl: '/favicon.svg',
    },
    // Flatten for frontend compatibility
    mainHeaderName: 'מערכת ניהול ריאגנטים',
    sidebarHeaderName: 'ניהול מלאי ריאגנטים',
    logoUrl: '/favicon.svg',
    description: 'Default system settings',
};

// Helper to flatten settings for frontend
function flattenSettings(settings: any) {
    const value = typeof settings.value === 'string'
        ? JSON.parse(settings.value)
        : settings.value || {};

    return {
        ...settings,
        mainHeaderName: value.mainHeaderName || 'מערכת ניהול ריאגנטים',
        sidebarHeaderName: value.sidebarHeaderName || 'ניהול מלאי ריאגנטים',
        logoUrl: value.logoUrl || '/favicon.svg',
    };
}

/**
 * GET /api/systemsettings
 * List all system settings
 */
router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
        try {
            const settings = await prisma.systemSettings.findMany();

            if (settings.length === 0) {
                // Return default settings if none exist in database
                return res.json([DEFAULT_SETTINGS]);
            }

            // Flatten settings for frontend compatibility
            const flattenedSettings = settings.map(flattenSettings);
            res.json(flattenedSettings);
        } catch (error) {
            // Fallback to default if database error
            console.error('Error fetching system settings:', error);
            res.json([DEFAULT_SETTINGS]);
        }
    })
);

/**
 * GET /api/systemsettings/:id
 * Get single system setting
 */
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const setting = await prisma.systemSettings.findUnique({
                where: { id },
            });

            if (!setting) {
                return res.status(404).json({
                    success: false,
                    error: 'Setting not found',
                });
            }

            res.json(flattenSettings(setting));
        } catch (error) {
            console.error('Error fetching system setting:', error);
            res.json(DEFAULT_SETTINGS);
        }
    })
);

/**
 * POST /api/systemsettings
 * Create system settings
 */
router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const data = req.body;

        try {
            // If key+value provided (simple key-value pair), use upsert
            if (data.key && data.value !== undefined && typeof data.value === 'string') {
                const result = await prisma.systemSettings.upsert({
                    where: { key: data.key },
                    update: { value: data.value },
                    create: {
                        key: data.key,
                        value: data.value,
                        description: data.description,
                    },
                });
                return res.status(201).json({ success: true, data: result });
            }

            // Build the value JSON from individual fields (legacy display settings)
            const valueJson = {
                mainHeaderName: data.mainHeaderName || 'מערכת ניהול ריאגנטים',
                sidebarHeaderName: data.sidebarHeaderName || 'ניהול מלאי ריאגנטים',
                logoUrl: data.logoUrl || '/favicon.svg',
                ...data.value,
            };

            const created = await prisma.systemSettings.create({
                data: {
                    key: data.key || 'display',
                    value: valueJson,
                    description: data.description,
                },
            });

            const response: ApiResponse = {
                success: true,
                data: flattenSettings(created),
            };
            res.status(201).json(response);
        } catch (error) {
            console.error('Error creating system setting:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create system setting',
            });
        }
    })
);

/**
 * PUT /api/systemsettings/:id
 * Update system settings
 */
router.put(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const data = req.body;

        try {
            // Get existing settings to merge
            const existing = await prisma.systemSettings.findUnique({
                where: { id },
            });

            const existingValue = existing?.value as any || {};

            // Build the value JSON from individual fields
            const valueJson = {
                ...existingValue,
                mainHeaderName: data.mainHeaderName ?? existingValue.mainHeaderName,
                sidebarHeaderName: data.sidebarHeaderName ?? existingValue.sidebarHeaderName,
                logoUrl: data.logoUrl ?? existingValue.logoUrl,
                ...data.value,
            };

            const updated = await prisma.systemSettings.update({
                where: { id },
                data: {
                    value: valueJson,
                    description: data.description ?? existing?.description,
                },
            });

            const response: ApiResponse = {
                success: true,
                data: flattenSettings(updated),
            };
            res.json(response);
        } catch (error) {
            console.error('Error updating system setting:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update system setting',
            });
        }
    })
);

/**
 * DELETE /api/systemsettings/:id
 * Delete system setting
 */
router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            await prisma.systemSettings.delete({
                where: { id },
            });

            res.json({
                success: true,
                message: 'Setting deleted',
            });
        } catch (error) {
            console.error('Error deleting system setting:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete system setting',
            });
        }
    })
);

export default router;
