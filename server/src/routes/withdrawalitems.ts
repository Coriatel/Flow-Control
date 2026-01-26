import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

const mapWithdrawalItem = (item: any) => ({
  id: item.id,
  withdrawal_item_id: item.id,
  withdrawal_request_id: item.withdrawalRequestId,
  reagent_id: item.reagentId,
  reagent_name_snapshot: item.reagent?.name || null,
  reagent_catalog_number_snapshot: item.reagent?.catalogNumber || null,
  quantity_requested: Number(item.requestedQuantity) || 0,
  quantity_approved: item.approvedQuantity ?? null,
  quantity_received: Number(item.fulfilledQuantity) || 0,
  unit_price: item.unitPrice ?? null,
  created_date: item.createdAt?.toISOString() || null,
});

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { withdrawal_request_id, reagent_id } = req.query;

    const items = await prisma.withdrawalItem.findMany({
      where: {
        ...(withdrawal_request_id ? { withdrawalRequestId: withdrawal_request_id as string } : {}),
        ...(reagent_id ? { reagentId: reagent_id as string } : {}),
      },
      include: { reagent: true },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: items.map(mapWithdrawalItem),
      meta: { total: items.length },
    };
    res.json(response);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await prisma.withdrawalItem.findUnique({
      where: { id },
      include: { reagent: true },
    });

    if (!item) {
      throw new AppError('Withdrawal item not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: mapWithdrawalItem(item),
    };
    res.json(response);
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};
    const withdrawalRequestId = body.withdrawal_request_id || body.withdrawalRequestId;
    const reagentId = body.reagent_id || body.reagentId;

    if (!withdrawalRequestId || !reagentId) {
      throw new AppError('withdrawal_request_id and reagent_id are required', 400);
    }

    const created = await prisma.withdrawalItem.create({
      data: {
        withdrawalRequestId,
        reagentId,
        requestedQuantity: Number(body.quantity_requested ?? body.requestedQuantity ?? 0),
        approvedQuantity: body.quantity_approved ?? body.approvedQuantity ?? null,
        fulfilledQuantity: Number(body.quantity_received ?? body.fulfilledQuantity ?? 0),
        unitPrice: body.unit_price ?? body.unitPrice ?? null,
      },
      include: { reagent: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapWithdrawalItem(created),
    };
    res.status(201).json(response);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};

    const updated = await prisma.withdrawalItem.update({
      where: { id },
      data: {
        requestedQuantity: body.quantity_requested ?? body.requestedQuantity ?? undefined,
        approvedQuantity: body.quantity_approved ?? body.approvedQuantity ?? undefined,
        fulfilledQuantity: body.quantity_received ?? body.fulfilledQuantity ?? undefined,
        unitPrice: body.unit_price ?? body.unitPrice ?? undefined,
      },
      include: { reagent: true },
    });

    const response: ApiResponse = {
      success: true,
      data: mapWithdrawalItem(updated),
    };
    res.json(response);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.withdrawalItem.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Withdrawal item deleted',
    };
    res.json(response);
  })
);

export default router;
