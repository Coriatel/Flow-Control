import { Router, Request, Response } from 'express';
import { supplierService } from '../services';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/suppliers
 * Get all suppliers
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const data = await supplierService.getAll(includeInactive);

    const response: ApiResponse = {
      success: true,
      data,
      meta: { total: data.length },
    };
    res.json(response);
  })
);

/**
 * GET /api/suppliers/with-order-status
 * Get suppliers with pending order information
 */
router.get(
  '/with-order-status',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await supplierService.getSuppliersWithOrderStatus();

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/suppliers/:id
 * Get supplier by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await supplierService.getById(id);

    if (!data) {
      throw new AppError('Supplier not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/suppliers/:id/summary
 * Get supplier with reagents summary
 */
router.get(
  '/:id/summary',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await supplierService.getWithReagentsSummary(id);

    if (!data) {
      throw new AppError('Supplier not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/suppliers/:id/orders
 * Get supplier's order history
 */
router.get(
  '/:id/orders',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const data = await supplierService.getOrderHistory(id, limit);

    const response: ApiResponse = {
      success: true,
      data,
      meta: { total: data.length },
    };
    res.json(response);
  })
);

/**
 * POST /api/suppliers
 * Create new supplier
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, shortCode, isActive } = req.body;

    if (!name) {
      throw new AppError('Name is required', 400);
    }

    const data = await supplierService.create({
      name,
      shortCode,
      isActive,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Supplier created successfully',
    };
    res.status(201).json(response);
  })
);

/**
 * PUT /api/suppliers/:id
 * Update supplier
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, shortCode, isActive } = req.body;

    const data = await supplierService.update(id, {
      name,
      shortCode,
      isActive,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Supplier updated successfully',
    };
    res.json(response);
  })
);

/**
 * DELETE /api/suppliers/:id
 * Deactivate supplier (soft delete)
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await supplierService.deactivate(id);

    const response: ApiResponse = {
      success: true,
      message: 'Supplier deactivated successfully',
    };
    res.json(response);
  })
);

/**
 * POST /api/suppliers/:id/contacts
 * Add contact to supplier
 */
router.post(
  '/:id/contacts',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, email, role, isPrimary } = req.body;

    if (!name) {
      throw new AppError('Contact name is required', 400);
    }

    const data = await supplierService.addContact({
      supplierId: id,
      name,
      phone,
      email,
      role,
      isPrimary,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Contact added successfully',
    };
    res.status(201).json(response);
  })
);

/**
 * PUT /api/suppliers/:id/contacts/:contactId
 * Update contact
 */
router.put(
  '/:id/contacts/:contactId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contactId } = req.params;
    const { name, phone, email, role, isPrimary } = req.body;

    const data = await supplierService.updateContact(contactId, {
      name,
      phone,
      email,
      role,
      isPrimary,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Contact updated successfully',
    };
    res.json(response);
  })
);

/**
 * DELETE /api/suppliers/:id/contacts/:contactId
 * Delete contact
 */
router.delete(
  '/:id/contacts/:contactId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contactId } = req.params;
    await supplierService.deleteContact(contactId);

    const response: ApiResponse = {
      success: true,
      message: 'Contact deleted successfully',
    };
    res.json(response);
  })
);

export default router;
