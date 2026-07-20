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
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Inventory movements are immutable and created by workflow services only',
    });
  })
);

router.post(
  '/bulk',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Inventory movements are immutable and created by workflow services only',
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Inventory movements are immutable',
    });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Inventory movements are immutable',
    });
  })
);

export default router;
