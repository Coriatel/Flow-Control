import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

const mapShipmentItem = (item: any) => ({
  id: item.id,
  shipment_item_id: item.id,
  shipment_id: item.shipmentId,
  reagent_id: item.reagentId,
  reagent_name_snapshot: item.reagent?.name || null,
  reagent_catalog_number_snapshot: item.reagent?.catalogNumber || null,
  batch_id: item.batchId || null,
  quantity: Number(item.quantity) || 0,
  created_date: item.createdAt?.toISOString() || null,
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { shipment_id, reagent_id } = req.query;

    const items = await prisma.shipmentItem.findMany({
      where: {
        ...(shipment_id ? { shipmentId: shipment_id as string } : {}),
        ...(reagent_id ? { reagentId: reagent_id as string } : {}),
      },
      include: { reagent: true },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: items.map(mapShipmentItem),
      meta: { total: items.length },
    };
    res.json(response);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await prisma.shipmentItem.findUnique({
      where: { id },
      include: { reagent: true },
    });

    if (!item) {
      throw new AppError('Shipment item not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: mapShipmentItem(item),
    };
    res.json(response);
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};
    const shipmentId = body.shipment_id || body.shipmentId;
    const reagentId = body.reagent_id || body.reagentId;

    if (!shipmentId || !reagentId) {
      throw new AppError('shipment_id and reagent_id are required', 400);
    }

    const created = await prisma.shipmentItem.create({
      data: {
        shipmentId,
        reagentId,
        batchId: body.batch_id || body.batchId || null,
        quantity: Number(body.quantity ?? 0),
      },
      include: { reagent: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapShipmentItem(created),
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
        const shipmentId = item.shipment_id || item.shipmentId;
        const reagentId = item.reagent_id || item.reagentId;
        if (!shipmentId || !reagentId) return null;
        return {
          shipmentId,
          reagentId,
          batchId: item.batch_id || item.batchId || null,
          quantity: Number(item.quantity ?? 0),
        };
      })
      .filter(Boolean);

    if (data.length === 0) {
      throw new AppError('No valid items to create', 400);
    }

    const result = await prisma.shipmentItem.createMany({ data });

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

    const updated = await prisma.shipmentItem.update({
      where: { id },
      data: {
        batchId: body.batch_id || body.batchId || undefined,
        quantity: body.quantity ?? undefined,
      },
      include: { reagent: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapShipmentItem(updated),
    };
    res.json(response);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.shipmentItem.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Shipment item deleted',
    };
    res.json(response);
  })
);

export default router;
