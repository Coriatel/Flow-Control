import { Request, Response, NextFunction } from 'express';

// Re-export Prisma types
export * from '../../generated/prisma';

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
