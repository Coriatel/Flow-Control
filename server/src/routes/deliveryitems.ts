import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

const mapDeliveryItem = (item: any) => ({
  id: item.id,
  delivery_id: item.deliveryId,
  reagent_id: item.reagentId,
  reagent_name_snapshot: item.reagent?.name || null,
  reagent_catalog_number_snapshot: item.reagent?.catalogNumber || null,
  batch_number: item.batchNumber || null,
  expiry_date: item.expiryDate?.toISOString() || null,
  quantity_received: Number(item.acceptedQuantity ?? item.quantity) || 0,
  quantity: Number(item.quantity) || 0,
  accepted_quantity: item.acceptedQuantity ?? null,
  rejected_quantity: item.rejectedQuantity ?? null,
  rejection_reason: item.rejectionReason ?? null,
  created_date: item.createdAt?.toISOString() || null,
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { delivery_id, reagent_id } = req.query;
    const items = await prisma.deliveryItem.findMany({
      where: {
        ...(delivery_id ? { deliveryId: delivery_id as string } : {}),
        ...(reagent_id ? { reagentId: reagent_id as string } : {}),
      },
      include: { reagent: true },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: items.map(mapDeliveryItem),
      meta: { total: items.length },
    };
    res.json(response);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await prisma.deliveryItem.findUnique({
      where: { id },
      include: { reagent: true },
    });

    if (!item) {
      throw new AppError('Delivery item not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: mapDeliveryItem(item),
    };
    res.json(response);
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};
    const deliveryId = body.delivery_id || body.deliveryId;
    const reagentId = body.reagent_id || body.reagentId;
    const batchNumber = body.batch_number || body.batchNumber || '';
    const expiryDate = body.expiry_date || body.expiryDate;

    if (!deliveryId || !reagentId) {
      throw new AppError('delivery_id and reagent_id are required', 400);
    }

    const quantity = Number(body.quantity_received ?? body.quantity ?? 0);

    const fallbackExpiry = new Date();
    fallbackExpiry.setFullYear(fallbackExpiry.getFullYear() + 100);

    const created = await prisma.deliveryItem.create({
      data: {
        deliveryId,
        reagentId,
        batchNumber,
        quantity,
        expiryDate: expiryDate ? new Date(expiryDate) : fallbackExpiry,
        acceptedQuantity: body.accepted_quantity ?? body.acceptedQuantity ?? null,
        rejectedQuantity: body.rejected_quantity ?? body.rejectedQuantity ?? null,
        rejectionReason: body.rejection_reason ?? body.rejectionReason ?? null,
      },
      include: { reagent: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapDeliveryItem(created),
    };
    res.status(201).json(response);
  })
);

router.post(
  '/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('items array is required', 400);
    }

    const data = items
      .map((item: any) => {
        const deliveryId = item.delivery_id || item.deliveryId;
        const reagentId = item.reagent_id || item.reagentId;
        if (!deliveryId || !reagentId) return null;

        const quantity = Number(item.quantity_received ?? item.quantity ?? 0);
        const expiryDate = item.expiry_date || item.expiryDate;
        const fallbackExpiry = new Date();
        fallbackExpiry.setFullYear(fallbackExpiry.getFullYear() + 100);

        return {
          deliveryId,
          reagentId,
          batchNumber: item.batch_number || item.batchNumber || '',
          quantity,
          expiryDate: expiryDate ? new Date(expiryDate) : fallbackExpiry,
          acceptedQuantity: item.accepted_quantity ?? item.acceptedQuantity ?? null,
          rejectedQuantity: item.rejected_quantity ?? item.rejectedQuantity ?? null,
          rejectionReason: item.rejection_reason ?? item.rejectionReason ?? null,
        };
      })
      .filter(Boolean);

    if (data.length === 0) {
      throw new AppError('No valid items to create', 400);
    }

    const result = await prisma.deliveryItem.createMany({ data });

    const response: ApiResponse = {
      success: true,
      data: { count: result.count },
    };
    res.status(201).json(response);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};

    const updated = await prisma.deliveryItem.update({
      where: { id },
      data: {
        batchNumber: body.batch_number || body.batchNumber || undefined,
        quantity: body.quantity_received ?? body.quantity,
        expiryDate: body.expiry_date ? new Date(body.expiry_date) : undefined,
        acceptedQuantity: body.accepted_quantity ?? body.acceptedQuantity ?? undefined,
        rejectedQuantity: body.rejected_quantity ?? body.rejectedQuantity ?? undefined,
        rejectionReason: body.rejection_reason ?? body.rejectionReason ?? undefined,
      },
      include: { reagent: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapDeliveryItem(updated),
    };
    res.json(response);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.deliveryItem.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Delivery item deleted',
    };
    res.json(response);
  })
);

export default router;
