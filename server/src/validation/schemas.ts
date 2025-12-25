import { z } from 'zod';

// ==================== Common Schemas ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const dateRangeSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
});

// ==================== Auth Schemas ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

// ==================== User Schemas ====================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'READONLY']).optional().default('USER')
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'READONLY']).optional(),
  isActive: z.boolean().optional()
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// ==================== Supplier Schemas ====================

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  shortCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  defaultCurrency: z.string().default('ILS'),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.coerce.number().int().positive().optional(),
  isPreferred: z.boolean().optional().default(false)
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createSupplierContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  isPrimary: z.boolean().optional().default(false)
});

export const updateSupplierContactSchema = createSupplierContactSchema.partial();

// ==================== Reagent Schemas ====================

export const createReagentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  catalogNumber: z.string().optional(),
  category: z.enum(['REAGENT', 'CELLS', 'CONSUMABLE']).optional().default('REAGENT'),
  supplierId: z.string().cuid('Invalid supplier ID'),
  isConsumable: z.boolean().optional().default(false),
  requiresBatches: z.boolean().optional().default(true),
  notes: z.string().optional()
});

export const updateReagentSchema = createReagentSchema.partial().omit({ supplierId: true });

// ==================== Batch Schemas ====================

export const createBatchSchema = z.object({
  reagentId: z.string().cuid('Invalid reagent ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.coerce.date(),
  manufactureDate: z.coerce.date().optional(),
  initialQuantity: z.coerce.number().positive('Quantity must be positive'),
  receivedDate: z.coerce.date().optional(),
  storageLocation: z.string().optional(),
  storageConditions: z.string().optional(),
  qcNotes: z.string().optional(),
  generalNotes: z.string().optional()
});

export const withdrawFromBatchSchema = z.object({
  quantity: z.coerce.number().positive('Quantity must be positive'),
  notes: z.string().optional()
});

// ==================== Order Schemas ====================

const orderItemSchema = z.object({
  reagentId: z.string().cuid('Invalid reagent ID'),
  requestedQuantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional()
});

export const addOrderItemSchema = orderItemSchema;

export const createOrderSchema = z.object({
  supplierId: z.string().cuid('Invalid supplier ID'),
  orderType: z.enum(['IMMEDIATE', 'FRAMEWORK']).optional().default('IMMEDIATE'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  internalNotes: z.string().optional(),
  supplierNotes: z.string().optional(),
  expectedDeliveryStart: z.coerce.date().optional(),
  expectedDeliveryEnd: z.coerce.date().optional()
});

export const updateOrderItemSchema = z.object({
  requestedQuantity: z.coerce.number().positive('Quantity must be positive'),
  notes: z.string().optional()
});

const receiveItemSchema = z.object({
  orderItemId: z.string().cuid('Invalid order item ID'),
  receivedQuantity: z.coerce.number().positive('Quantity must be positive'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.coerce.date(),
  storageLocation: z.string().optional()
});

export const receiveOrderSchema = z.object({
  items: z.array(receiveItemSchema).min(1, 'At least one item is required'),
  receivedBy: z.string().optional()
});

// ==================== Delivery Schemas ====================

const deliveryItemSchema = z.object({
  reagentId: z.string().cuid('Invalid reagent ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  expiryDate: z.coerce.date()
});

export const addDeliveryItemSchema = deliveryItemSchema;

export const createDeliverySchema = z.object({
  supplierId: z.string().cuid('Invalid supplier ID'),
  orderId: z.string().cuid().optional(),
  withdrawalRequestId: z.string().cuid().optional(),
  deliveryDate: z.coerce.date(),
  items: z.array(deliveryItemSchema).optional(),
  notes: z.string().optional(),
  isRecurringSupply: z.boolean().optional().default(false)
});

export const updateDeliverySchema = z.object({
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  documentUrl: z.string().url().optional(),
  isRecurringSupply: z.boolean().optional()
});

const receiveDeliveryItemSchema = z.object({
  deliveryItemId: z.string().cuid('Invalid delivery item ID'),
  acceptedQuantity: z.coerce.number().nonnegative(),
  rejectedQuantity: z.coerce.number().nonnegative().optional(),
  rejectionReason: z.string().optional(),
  storageLocation: z.string().optional()
});

export const receiveDeliverySchema = z.object({
  items: z.array(receiveDeliveryItemSchema).min(1, 'At least one item is required'),
  receivedBy: z.string().optional()
});

// ==================== Withdrawal Schemas ====================

const withdrawalItemSchema = z.object({
  reagentId: z.string().cuid('Invalid reagent ID'),
  requestedQuantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().nonnegative().optional()
});

export const addWithdrawalItemSchema = withdrawalItemSchema;

export const createWithdrawalSchema = z.object({
  supplierId: z.string().cuid('Invalid supplier ID'),
  frameworkOrderId: z.string().cuid().optional(),
  items: z.array(withdrawalItemSchema).min(1, 'At least one item is required'),
  requesterNotes: z.string().optional()
});

export const updateWithdrawalSchema = z.object({
  requesterNotes: z.string().optional()
});

const approvedItemSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
  approvedQuantity: z.coerce.number().nonnegative()
});

export const approveWithdrawalSchema = z.object({
  approverNotes: z.string().optional(),
  approvedItems: z.array(approvedItemSchema).optional()
});

// ==================== Shipment Schemas ====================

const shipmentItemSchema = z.object({
  reagentId: z.string().cuid('Invalid reagent ID'),
  batchId: z.string().cuid().optional(),
  quantity: z.coerce.number().positive('Quantity must be positive')
});

export const addShipmentItemSchema = shipmentItemSchema;

export const createShipmentSchema = z.object({
  destinationHospital: z.string().min(2, 'Destination hospital is required'),
  destinationDepartment: z.string().optional(),
  shipmentDate: z.coerce.date(),
  items: z.array(shipmentItemSchema).optional(),
  notes: z.string().optional()
});

export const updateShipmentSchema = z.object({
  destinationHospital: z.string().min(2).optional(),
  destinationDepartment: z.string().optional(),
  shipmentDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  documentUrl: z.string().url().optional()
});

// ==================== Alert Rule Schemas ====================

export const createAlertRuleSchema = z.object({
  ruleType: z.enum(['EXPIRY_WARNING', 'LOW_STOCK', 'PENDING_SUPPLY', 'COUNT_REQUIRED', 'COA_MISSING', 'CUSTOM']),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  thresholdDays: z.coerce.number().int().positive().optional(),
  thresholdQuantity: z.coerce.number().positive().optional(),
  thresholdMonths: z.coerce.number().positive().optional(),
  appliesToCategories: z.array(z.string()).optional().default([])
});

export const updateAlertRuleSchema = createAlertRuleSchema.partial().extend({
  isActive: z.boolean().optional()
});

// ==================== Inventory Schemas ====================

const countEntrySchema = z.object({
  reagentId: z.string().cuid('Invalid reagent ID'),
  batchNumber: z.string().optional(),
  countedQuantity: z.coerce.number().nonnegative(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().optional()
});

export const createInventoryCountSchema = z.object({
  entries: z.array(countEntrySchema).min(1, 'At least one entry is required')
});

// ==================== Type exports ====================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateReagentInput = z.infer<typeof createReagentSchema>;
export type UpdateReagentInput = z.infer<typeof updateReagentSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ReceiveOrderInput = z.infer<typeof receiveOrderSchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type ReceiveDeliveryInput = z.infer<typeof receiveDeliverySchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ApproveWithdrawalInput = z.infer<typeof approveWithdrawalSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;
