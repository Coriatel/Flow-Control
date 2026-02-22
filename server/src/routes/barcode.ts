import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { barcodeService } from '../services/barcodeService';
import prisma from '../utils/prisma';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/barcode/parse - Parse raw barcode data
 */
router.post('/parse', asyncHandler(async (req, res) => {
  const { rawData, formatId } = req.body;
  if (!rawData) {
    return res.status(400).json({ success: false, error: 'rawData is required' });
  }

  const result = await barcodeService.parseBarcodeData(rawData, formatId);
  res.json({ success: true, data: result });
}));

/**
 * GET /api/barcode/formats - List all barcode format configurations
 */
router.get('/formats', asyncHandler(async (_req, res) => {
  const formats = await prisma.barcodeFormat.findMany({
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: formats });
}));

/**
 * POST /api/barcode/formats - Create new barcode format (ADMIN only)
 */
router.post('/formats', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { name, supplierId, barcodeType, parsePattern, fieldMapping, dateFormat, sampleData, notes } = req.body;

  if (!name || !parsePattern || !fieldMapping) {
    return res.status(400).json({ success: false, error: 'name, parsePattern, and fieldMapping are required' });
  }

  const format = await prisma.barcodeFormat.create({
    data: {
      name,
      supplierId: supplierId || null,
      barcodeType: barcodeType || 'CODE128',
      parsePattern,
      fieldMapping,
      dateFormat: dateFormat || 'YYMMDD',
      sampleData: sampleData || null,
      notes: notes || null,
    },
    include: { supplier: { select: { id: true, name: true } } },
  });

  res.status(201).json({ success: true, data: format });
}));

/**
 * PUT /api/barcode/formats/:id - Update barcode format (ADMIN only)
 */
router.put('/formats/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, supplierId, barcodeType, parsePattern, fieldMapping, dateFormat, sampleData, notes, isActive } = req.body;

  const format = await prisma.barcodeFormat.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(supplierId !== undefined && { supplierId }),
      ...(barcodeType !== undefined && { barcodeType }),
      ...(parsePattern !== undefined && { parsePattern }),
      ...(fieldMapping !== undefined && { fieldMapping }),
      ...(dateFormat !== undefined && { dateFormat }),
      ...(sampleData !== undefined && { sampleData }),
      ...(notes !== undefined && { notes }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { supplier: { select: { id: true, name: true } } },
  });

  res.json({ success: true, data: format });
}));

/**
 * DELETE /api/barcode/formats/:id - Delete barcode format (ADMIN only)
 */
router.delete('/formats/:id', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.barcodeFormat.update({
    where: { id },
    data: { isActive: false },
  });
  res.json({ success: true, message: 'פורמט ברקוד הושבת' });
}));

/**
 * POST /api/barcode/test - Test a format pattern against sample data (ADMIN only)
 */
router.post('/test', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { pattern, fieldMapping, dateFormat, sampleData } = req.body;

  if (!pattern || !fieldMapping || !sampleData) {
    return res.status(400).json({ success: false, error: 'pattern, fieldMapping, and sampleData are required' });
  }

  const result = barcodeService.testPattern(pattern, fieldMapping, dateFormat || 'YYMMDD', sampleData);
  res.json({ success: true, data: result });
}));

export default router;
