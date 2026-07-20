import { AppError } from "../middleware/errorHandler";

export type AvailabilityState =
  | "pending_qa"
  | "released"
  | "held"
  | "rejected"
  | "expired"
  | "consumed";

export type InventoryQualityErrorCode =
  | "BATCH_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "IDEMPOTENCY_CONFLICT"
  | "RETRYABLE_CONFLICT"
  | "COA_REQUIRED"
  | "INVALID_QUALITY_TRANSITION";

export class InventoryQualityError extends AppError {
  readonly code: InventoryQualityErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    message: string,
    code: InventoryQualityErrorCode,
    statusCode = 409,
    details: Record<string, unknown> = {},
  ) {
    super(message, statusCode);
    this.code = code;
    this.details = details;
  }
}

export const isInventoryQualityError = (
  error: unknown,
): error is InventoryQualityError => error instanceof InventoryQualityError;

export interface DispenseResult {
  idempotentReplay: boolean;
  dispenseEventId: string;
  movementId: string;
  batch: {
    id: string;
    beforeQuantity: number;
    currentQuantity: number;
    status: string;
    qcStatus: string;
  };
  inventory: {
    reagentId: string;
    physicalQuantity: number;
    availableQuantity: number;
    stockStatus: string;
  };
  replenishment: {
    suggestedQuantity: number;
    onOrderQuantity: number;
  };
  auditActivityId: string;
  createdAt: Date;
}
