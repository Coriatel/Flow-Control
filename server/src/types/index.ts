import { Request, Response, NextFunction } from 'express';

// Re-export Prisma types (when generated)
// export * from '../../generated/prisma';

// Manual type definitions for when Prisma client is not generated
// These match the enums in prisma/schema.prisma

export type Category = 'REAGENT' | 'CELLS' | 'CONSUMABLE';
export type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
export type BatchStatus = 'INCOMING' | 'ACTIVE' | 'EXPIRED' | 'CONSUMED' | 'ON_HOLD' | 'DESTROYED';
export type QCStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW';
export type OrderType = 'IMMEDIATE' | 'FRAMEWORK';
export type OrderStatus = 'DRAFT' | 'PENDING_SAP' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CLOSED' | 'CANCELLED';
export type DeliveryStatus = 'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
export type WithdrawalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIAL' | 'SHIPPING' | 'CLOSED' | 'CANCELLED';
export type ShipmentStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'READONLY';
export type TransactionType = 'RECEIPT' | 'CONSUMPTION' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'RETURN' | 'DESTRUCTION';
export type AlertRuleType = 'EXPIRY_WARNING' | 'LOW_STOCK' | 'PENDING_SUPPLY' | 'COUNT_REQUIRED' | 'COA_MISSING' | 'CUSTOM';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
export type NoteType = 'GENERAL' | 'URGENT' | 'REMINDER' | 'SYSTEM';

// Placeholder interfaces for Prisma models (for type checking when Prisma is not generated)
export interface Reagent {
  id: string;
  name: string;
  catalogNumber?: string | null;
  category: Category;
  supplierId: string;
  supplier?: Supplier;
  totalQuantity?: number | null;
  monthsOfStock?: number | null;
  [key: string]: unknown;
}

export interface ReagentBatch {
  id: string;
  reagentId: string;
  batchNumber: string;
  expiryDate: Date;
  currentQuantity: number;
  [key: string]: unknown;
}

export interface Supplier {
  id: string;
  name: string;
  shortCode?: string | null;
  [key: string]: unknown;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Request with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Controller type
export type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter params for reagents
export interface ReagentFilters {
  category?: string;
  supplierId?: string;
  stockStatus?: string;
  search?: string;
}

// Dashboard data
export interface DashboardData {
  expiringReagents: ExpiringReagent[];
  lowStockReagents: LowStockReagent[];
  pendingOrders: PendingOrder[];
  pendingSupplies: PendingSupply[];
  dashboardNotes: DashboardNoteData[];
  lastInventoryCount: InventoryCountSummary | null;
  recentActivity: ActivityItem[];
  criticalActions: CriticalAction[];
  statistics: DashboardStatistics;
}

export interface ExpiringReagent {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  currentQuantity: number;
  supplier: string;
}

export interface LowStockReagent {
  id: string;
  name: string;
  currentQuantity: number;
  monthsOfStock: number;
  averageUsage: number;
  supplier: string;
}

export interface PendingOrder {
  id: string;
  tempNumber: string;
  supplier: string;
  status: string;
  orderDate: Date;
}

export interface PendingSupply {
  id: string;
  type: 'withdrawal' | 'order';
  number: string;
  supplier: string;
  requestDate: Date;
}

export interface DashboardNoteData {
  id: string;
  title: string | null;
  content: string;
  noteType: string;
  createdAt: Date;
}

export interface InventoryCountSummary {
  id: string;
  countDate: Date;
  totalReagentsCounted: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  description: string;
  timestamp: Date;
}

export interface CriticalAction {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  route: string;
}

export interface DashboardStatistics {
  totalReagents: number;
  totalBatches: number;
  expiringCount: number;
  lowStockCount: number;
}
