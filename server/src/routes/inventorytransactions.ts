import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

const mapTransaction = (tx: any) => ({
  id: tx.id,
  reagent_id: tx.reagentId,
  batch_id: tx.batchId || null,
  batch_number: tx.batch?.batchNumber || null,
  transaction_type: tx.transactionType ? String(tx.transactionType).toLowerCase() : null,
  quantity: Number(tx.quantityDelta) || 0,
  source_type: tx.sourceType || null,
  source_id: tx.sourceId || null,
  performed_by_user_id: tx.performedById || null,
  notes: tx.notes || null,
  created_date: tx.createdAt?.toISOString() || null,
});

const resolveBatchId = async (reagentId?: string, batchId?: string, batchNumber?: string) => {
  if (batchId) return batchId;
  if (!batchNumber) return null;

  if (reagentId) {
    const match = await prisma.reagentBatch.findFirst({
      where: { reagentId, batchNumber },
    });
    return match?.id || null;
  }

  const fallback = await prisma.reagentBatch.findFirst({
    where: { batchNumber },
  });
  return fallback?.id || null;
};

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { reagent_id, batch_id, transaction_type } = req.query;

    const items = await prisma.inventoryTransaction.findMany({
      where: {
        ...(reagent_id ? { reagentId: reagent_id as string } : {}),
        ...(batch_id ? { batchId: batch_id as string } : {}),
        ...(transaction_type ? { transactionType: transaction_type as string } : {}),
      },
      include: { batch: true },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: items.map(mapTransaction),
      meta: { total: items.length },
    };
    res.json(response);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tx = await prisma.inventoryTransaction.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!tx) {
      throw new AppError('Inventory transaction not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: mapTransaction(tx),
    };
    res.json(response);
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};
    const reagentId = body.reagent_id || body.reagentId;

    if (!reagentId) {
      throw new AppError('reagent_id is required', 400);
    }

    const batchNumber = body.batch_number || body.batchNumber;
    const batchId = await resolveBatchId(reagentId, body.batch_id || body.batchId, batchNumber);

    const quantityDelta = Number(body.quantity ?? body.quantity_delta ?? body.quantityDelta ?? 0);
    const transactionType = body.transaction_type || body.transactionType || 'adjustment';

    const created = await prisma.inventoryTransaction.create({
      data: {
        reagentId,
        batchId: batchId || undefined,
        transactionType,
        quantityDelta,
        sourceType: body.source_type || body.sourceType || null,
        sourceId: body.source_id || body.sourceId || body.document_number || null,
        performedById: body.performed_by_user_id || body.performedById || null,
        notes: body.notes || null,
      },
      include: { batch: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapTransaction(created),
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

    const data = [] as any[];
    for (const item of items) {
      const reagentId = item.reagent_id || item.reagentId;
      if (!reagentId) continue;
      const batchNumber = item.batch_number || item.batchNumber;
      const batchId = await resolveBatchId(reagentId, item.batch_id || item.batchId, batchNumber);
      const quantityDelta = Number(item.quantity ?? item.quantity_delta ?? item.quantityDelta ?? 0);
      const transactionType = item.transaction_type || item.transactionType || 'adjustment';

      data.push({
        reagentId,
        batchId: batchId || undefined,
        transactionType,
        quantityDelta,
        sourceType: item.source_type || item.sourceType || null,
        sourceId: item.source_id || item.sourceId || item.document_number || null,
        performedById: item.performed_by_user_id || item.performedById || null,
        notes: item.notes || null,
      });
    }

    if (data.length === 0) {
      throw new AppError('No valid items to create', 400);
    }

    const result = await prisma.inventoryTransaction.createMany({ data });

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

    const updated = await prisma.inventoryTransaction.update({
      where: { id },
      data: {
        transactionType: body.transaction_type || body.transactionType || undefined,
        quantityDelta: body.quantity ?? body.quantity_delta ?? body.quantityDelta,
        sourceType: body.source_type || body.sourceType || undefined,
        sourceId: body.source_id || body.sourceId || body.document_number || undefined,
        performedById: body.performed_by_user_id || body.performedById || undefined,
        notes: body.notes || undefined,
      },
      include: { batch: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapTransaction(updated),
    };
    res.json(response);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.inventoryTransaction.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Inventory transaction deleted',
    };
    res.json(response);
  })
);

export default router;
