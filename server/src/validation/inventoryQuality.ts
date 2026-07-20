import { z } from "zod";

const requestKey = z
  .string()
  .trim()
  .min(8, "clientRequestId must be at least 8 characters")
  .max(128, "clientRequestId is too long")
  .regex(
    /^[A-Za-z0-9._:-]+$/,
    "clientRequestId contains unsupported characters",
  );

const documentUrl = z
  .string()
  .trim()
  .min(1, "documentUrl is required")
  .max(2048, "documentUrl is too long")
  .refine(
    (value) =>
      /^\/api\/files\/download\/[A-Za-z0-9._-]+\.pdf(?:\?[A-Za-z0-9._~=&-]+)?$/i.test(
        value,
      ),
    "documentUrl must reference an authorized internal PDF",
  );

export const dispenseInventorySchema = z.object({
  clientRequestId: requestKey,
  reagentId: z.string().cuid("Invalid reagent ID"),
  batchId: z.string().cuid("Invalid batch ID"),
  quantity: z.coerce.number().finite().positive().max(1_000_000_000),
  scanMethod: z
    .enum(["BARCODE", "QR", "MANUAL", "SEARCH"])
    .optional()
    .default("MANUAL"),
  rawScanData: z.string().trim().max(4096).optional(),
  purpose: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).optional(),
});

export const linkBatchCoaSchema = z.object({
  clientRequestId: requestKey,
  documentUrl,
});

export const qualityDecisionSchema = z.object({
  clientRequestId: requestKey,
  decision: z.enum(["APPROVE", "HOLD", "REJECT"]),
  notes: z.string().trim().min(1).max(2000),
});

export const qualityListQuerySchema = z.object({
  reagentId: z.string().cuid().optional(),
  search: z.string().trim().max(200).optional(),
  status: z.string().trim().max(40).optional(),
  qcStatus: z.string().trim().max(40).optional(),
  expiryFrom: z.coerce.date().optional(),
  expiryTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().max(100_000).optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
});

export const dispenseHistoryQuerySchema = z.object({
  reagentId: z.string().cuid().optional(),
  batchId: z.string().cuid().optional(),
  dispensedById: z.string().cuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().max(100_000).optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const currentInventoryQuerySchema = z.object({
  reagentId: z.string().cuid().optional(),
});

export type DispenseInventoryInput = z.infer<typeof dispenseInventorySchema>;
export type LinkBatchCoaInput = z.infer<typeof linkBatchCoaSchema>;
export type QualityDecisionInput = z.infer<typeof qualityDecisionSchema>;
