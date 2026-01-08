import { Request, Response, NextFunction } from 'express';

// Re-export Prisma types (when generated)
// export * from '../../generated/prisma';

// Manual type definitions for when Prisma client is not generated
// These match the enums in prisma/schema.prisma

export enum Category {
  REAGENT = 'REAGENT',
  CELLS = 'CELLS',
  CONSUMABLE = 'CONSUMABLE'
}

export enum StockStatus {
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  CRITICAL = 'CRITICAL',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum BatchStatus {
  INCOMING = 'INCOMING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CONSUMED = 'CONSUMED',
  ON_HOLD = 'ON_HOLD',
  DESTROYED = 'DESTROYED'
}

export enum QCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REQUIRES_REVIEW = 'REQUIRES_REVIEW'
}

export enum OrderType {
  IMMEDIATE = 'IMMEDIATE',
  FRAMEWORK = 'FRAMEWORK'
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_SAP = 'PENDING_SAP',
  APPROVED = 'APPROVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED = 'FULLY_RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum DeliveryStatus {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum WithdrawalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PARTIAL = 'PARTIAL',
  SHIPPING = 'SHIPPING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export enum ShipmentStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  READONLY = 'READONLY'
}

export enum TransactionType {
  RECEIPT = 'RECEIPT',
  CONSUMPTION = 'CONSUMPTION',
  WITHDRAWAL = 'WITHDRAWAL',
  ADJUSTMENT = 'ADJUSTMENT',
  DESTRUCTION = 'DESTRUCTION',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT'
}

export enum AlertRuleType {
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  LOW_STOCK = 'LOW_STOCK',
  PENDING_SUPPLY = 'PENDING_SUPPLY',
  COUNT_REQUIRED = 'COUNT_REQUIRED',
  COA_MISSING = 'COA_MISSING',
  CUSTOM = 'CUSTOM'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AlertStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum NoteType {
  GENERAL = 'GENERAL',
  URGENT = 'URGENT',
  REMINDER = 'REMINDER',
  SYSTEM = 'SYSTEM'
}

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
