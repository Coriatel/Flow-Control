-- Flow Control Database Schema
-- Generated from Prisma schema

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE "Category" AS ENUM ('REAGENT', 'CELLS', 'CONSUMABLE');
CREATE TYPE "StockStatus" AS ENUM ('NORMAL', 'LOW', 'CRITICAL', 'OUT_OF_STOCK');
CREATE TYPE "BatchStatus" AS ENUM ('INCOMING', 'ACTIVE', 'EXPIRED', 'CONSUMED', 'ON_HOLD', 'DESTROYED');
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRES_REVIEW');
CREATE TYPE "OrderType" AS ENUM ('IMMEDIATE', 'FRAMEWORK');
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_SAP', 'APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED');
CREATE TYPE "WithdrawalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SHIPPING', 'CLOSED', 'CANCELLED');
CREATE TYPE "DeliveryStatus" AS ENUM ('NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'SENT', 'RECEIVED', 'CANCELLED');
CREATE TYPE "CountDraftStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TransactionType" AS ENUM ('RECEIPT', 'CONSUMPTION', 'WITHDRAWAL', 'ADJUSTMENT', 'DESTRUCTION', 'TRANSFER_IN', 'TRANSFER_OUT');
CREATE TYPE "ExpiredAction" AS ENUM ('DESTROYED', 'CONSUMED', 'NOT_IN_STOCK', 'OTHER');
CREATE TYPE "AlertRuleType" AS ENUM ('EXPIRY_WARNING', 'LOW_STOCK', 'PENDING_SUPPLY', 'COUNT_REQUIRED', 'COA_MISSING', 'CUSTOM');
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AlertStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'TASK', 'REMINDER', 'ALERT', 'INFO');
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'USER', 'READONLY');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Supplier
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'ILS',
    "paymentTerms" TEXT,
    "leadTimeDays" INTEGER,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- SupplierContact
CREATE TABLE "SupplierContact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);

-- Reagent
CREATE TABLE "Reagent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "catalogNumber" TEXT,
    "category" "Category" NOT NULL DEFAULT 'REAGENT',
    "supplierId" TEXT NOT NULL,
    "totalQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activeBatchesCount" INTEGER NOT NULL DEFAULT 0,
    "nearestExpiryDate" TIMESTAMP(3),
    "currentStockStatus" "StockStatus" NOT NULL DEFAULT 'NORMAL',
    "monthsOfStock" DECIMAL(5,2),
    "averageMonthlyUsage" DECIMAL(10,2),
    "manualMonthlyUsage" DECIMAL(10,2),
    "useManualUsage" BOOLEAN NOT NULL DEFAULT false,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "requiresBatches" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reagent_pkey" PRIMARY KEY ("id")
);

-- ReagentBatch
CREATE TABLE "ReagentBatch" (
    "id" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "manufactureDate" TIMESTAMP(3),
    "initialQuantity" DECIMAL(10,2) NOT NULL,
    "currentQuantity" DECIMAL(10,2) NOT NULL,
    "reservedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "deliveryId" TEXT,
    "firstOpenedDate" TIMESTAMP(3),
    "storageLocation" TEXT,
    "storageConditions" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "qcStatus" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "coaDocumentUrl" TEXT,
    "qcNotes" TEXT,
    "generalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReagentBatch_pkey" PRIMARY KEY ("id")
);

-- Order
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tempNumber" TEXT NOT NULL,
    "permanentNumber" TEXT,
    "sapPurchaseOrder" TEXT,
    "supplierId" TEXT NOT NULL,
    "supplierSnapshot" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL DEFAULT 'IMMEDIATE',
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryStart" TIMESTAMP(3),
    "expectedDeliveryEnd" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "totalValue" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "internalNotes" TEXT,
    "supplierNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- OrderItem
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "requestedQuantity" DECIMAL(10,2) NOT NULL,
    "approvedQuantity" DECIMAL(10,2),
    "receivedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remainingQuantity" DECIMAL(10,2),
    "unitPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- FrameworkOrder
CREATE TABLE "FrameworkOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "maxTotalQuantity" DECIMAL(12,2),
    "availableQuantity" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameworkOrder_pkey" PRIMARY KEY ("id")
);

-- FrameworkOrderItem
CREATE TABLE "FrameworkOrderItem" (
    "id" TEXT NOT NULL,
    "frameworkOrderId" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "allocatedQuantity" DECIMAL(10,2) NOT NULL,
    "consumedQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "availableQuantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrameworkOrderItem_pkey" PRIMARY KEY ("id")
);

-- WithdrawalRequest
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "withdrawalNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSnapshot" TEXT NOT NULL,
    "frameworkOrderId" TEXT,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'DRAFT',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "totalValueRequested" DECIMAL(12,2),
    "totalValueApproved" DECIMAL(12,2),
    "requesterNotes" TEXT,
    "approverNotes" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- WithdrawalItem
CREATE TABLE "WithdrawalItem" (
    "id" TEXT NOT NULL,
    "withdrawalRequestId" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "requestedQuantity" DECIMAL(10,2) NOT NULL,
    "approvedQuantity" DECIMAL(10,2),
    "fulfilledQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalItem_pkey" PRIMARY KEY ("id")
);

-- Delivery
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSnapshot" TEXT NOT NULL,
    "orderId" TEXT,
    "withdrawalRequestId" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'NEW',
    "documentUrl" TEXT,
    "isRecurringSupply" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- DeliveryItem
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "acceptedQuantity" DECIMAL(10,2),
    "rejectedQuantity" DECIMAL(10,2),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- Shipment
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "destinationHospital" TEXT NOT NULL,
    "destinationDepartment" TEXT,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- ShipmentItem
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- InventoryCountDraft
CREATE TABLE "InventoryCountDraft" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSavedAt" TIMESTAMP(3) NOT NULL,
    "status" "CountDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "startedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCountDraft_pkey" PRIMARY KEY ("id")
);

-- InventoryCountEntry
CREATE TABLE "InventoryCountEntry" (
    "id" TEXT NOT NULL,
    "countDraftId" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "countedQuantity" DECIMAL(10,2) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCountEntry_pkey" PRIMARY KEY ("id")
);

-- CompletedInventoryCount
CREATE TABLE "CompletedInventoryCount" (
    "id" TEXT NOT NULL,
    "countDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalReagentsCounted" INTEGER NOT NULL,
    "totalBatchesCounted" INTEGER NOT NULL,
    "varianceSummary" JSONB,
    "csvExportUrl" TEXT,
    "pdfReportUrl" TEXT,
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedInventoryCount_pkey" PRIMARY KEY ("id")
);

-- InventoryTransaction
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "batchId" TEXT,
    "transactionType" "TransactionType" NOT NULL,
    "quantityDelta" DECIMAL(10,2) NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "performedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- ExpiredProductLog
CREATE TABLE "ExpiredProductLog" (
    "id" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "actionTaken" "ExpiredAction" NOT NULL,
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpiredProductLog_pkey" PRIMARY KEY ("id")
);

-- AlertRule
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "ruleType" "AlertRuleType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thresholdDays" INTEGER,
    "thresholdQuantity" DECIMAL(10,2),
    "thresholdMonths" DECIMAL(5,2),
    "appliesToCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- ActiveAlert
CREATE TABLE "ActiveAlert" (
    "id" TEXT NOT NULL,
    "alertRuleId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveAlert_pkey" PRIMARY KEY ("id")
);

-- DashboardNote
CREATE TABLE "DashboardNote" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "noteType" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "ctaRoute" TEXT,
    "createdById" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardNote_pkey" PRIMARY KEY ("id")
);

-- ScheduledReminder
CREATE TABLE "ScheduledReminder" (
    "id" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledReminder_pkey" PRIMARY KEY ("id")
);

-- SystemSettings
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- ArchivedData
CREATE TABLE "ArchivedData" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedById" TEXT,
    "restoredAt" TIMESTAMP(3),
    "restoredById" TEXT,

    CONSTRAINT "ArchivedData_pkey" PRIMARY KEY ("id")
);

-- ArchivedReport
CREATE TABLE "ArchivedReport" (
    "id" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedReport_pkey" PRIMARY KEY ("id")
);

-- DocumentationNote
CREATE TABLE "DocumentationNote" (
    "id" TEXT NOT NULL,
    "pageId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "relatedEntities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastEditorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentationNote_pkey" PRIMARY KEY ("id")
);

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- ActivityLog
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");
CREATE UNIQUE INDEX "Reagent_name_supplierId_key" ON "Reagent"("name", "supplierId");
CREATE UNIQUE INDEX "ReagentBatch_reagentId_batchNumber_key" ON "ReagentBatch"("reagentId", "batchNumber");
CREATE UNIQUE INDEX "Order_tempNumber_key" ON "Order"("tempNumber");
CREATE UNIQUE INDEX "FrameworkOrder_orderId_key" ON "FrameworkOrder"("orderId");
CREATE UNIQUE INDEX "WithdrawalRequest_withdrawalNumber_key" ON "WithdrawalRequest"("withdrawalNumber");
CREATE UNIQUE INDEX "Delivery_deliveryNumber_key" ON "Delivery"("deliveryNumber");
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");
CREATE INDEX "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId");
CREATE INDEX "Reagent_supplierId_idx" ON "Reagent"("supplierId");
CREATE INDEX "Reagent_category_idx" ON "Reagent"("category");
CREATE INDEX "Reagent_currentStockStatus_idx" ON "Reagent"("currentStockStatus");
CREATE INDEX "Reagent_nearestExpiryDate_idx" ON "Reagent"("nearestExpiryDate");
CREATE INDEX "Reagent_isDeleted_idx" ON "Reagent"("isDeleted");
CREATE INDEX "ReagentBatch_reagentId_idx" ON "ReagentBatch"("reagentId");
CREATE INDEX "ReagentBatch_expiryDate_idx" ON "ReagentBatch"("expiryDate");
CREATE INDEX "ReagentBatch_status_idx" ON "ReagentBatch"("status");
CREATE INDEX "ReagentBatch_deliveryId_idx" ON "ReagentBatch"("deliveryId");
CREATE INDEX "Order_supplierId_idx" ON "Order"("supplierId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderType_idx" ON "Order"("orderType");
CREATE INDEX "Order_orderDate_idx" ON "Order"("orderDate");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_reagentId_idx" ON "OrderItem"("reagentId");
CREATE INDEX "FrameworkOrder_validFrom_validTo_idx" ON "FrameworkOrder"("validFrom", "validTo");
CREATE INDEX "FrameworkOrderItem_frameworkOrderId_idx" ON "FrameworkOrderItem"("frameworkOrderId");
CREATE INDEX "FrameworkOrderItem_reagentId_idx" ON "FrameworkOrderItem"("reagentId");
CREATE INDEX "WithdrawalRequest_supplierId_idx" ON "WithdrawalRequest"("supplierId");
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");
CREATE INDEX "WithdrawalRequest_frameworkOrderId_idx" ON "WithdrawalRequest"("frameworkOrderId");
CREATE INDEX "WithdrawalRequest_requestDate_idx" ON "WithdrawalRequest"("requestDate");
CREATE INDEX "WithdrawalItem_withdrawalRequestId_idx" ON "WithdrawalItem"("withdrawalRequestId");
CREATE INDEX "WithdrawalItem_reagentId_idx" ON "WithdrawalItem"("reagentId");
CREATE INDEX "Delivery_supplierId_idx" ON "Delivery"("supplierId");
CREATE INDEX "Delivery_status_idx" ON "Delivery"("status");
CREATE INDEX "Delivery_deliveryDate_idx" ON "Delivery"("deliveryDate");
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");
CREATE INDEX "DeliveryItem_deliveryId_idx" ON "DeliveryItem"("deliveryId");
CREATE INDEX "DeliveryItem_reagentId_idx" ON "DeliveryItem"("reagentId");
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");
CREATE INDEX "Shipment_shipmentDate_idx" ON "Shipment"("shipmentDate");
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");
CREATE INDEX "ShipmentItem_reagentId_idx" ON "ShipmentItem"("reagentId");
CREATE INDEX "InventoryCountDraft_status_idx" ON "InventoryCountDraft"("status");
CREATE INDEX "InventoryCountEntry_countDraftId_idx" ON "InventoryCountEntry"("countDraftId");
CREATE INDEX "InventoryCountEntry_reagentId_idx" ON "InventoryCountEntry"("reagentId");
CREATE INDEX "CompletedInventoryCount_countDate_idx" ON "CompletedInventoryCount"("countDate");
CREATE INDEX "InventoryTransaction_reagentId_idx" ON "InventoryTransaction"("reagentId");
CREATE INDEX "InventoryTransaction_batchId_idx" ON "InventoryTransaction"("batchId");
CREATE INDEX "InventoryTransaction_transactionType_idx" ON "InventoryTransaction"("transactionType");
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");
CREATE INDEX "ExpiredProductLog_batchId_idx" ON "ExpiredProductLog"("batchId");
CREATE INDEX "ExpiredProductLog_handledAt_idx" ON "ExpiredProductLog"("handledAt");
CREATE INDEX "AlertRule_ruleType_idx" ON "AlertRule"("ruleType");
CREATE INDEX "AlertRule_isActive_idx" ON "AlertRule"("isActive");
CREATE INDEX "ActiveAlert_alertRuleId_idx" ON "ActiveAlert"("alertRuleId");
CREATE INDEX "ActiveAlert_entityType_entityId_idx" ON "ActiveAlert"("entityType", "entityId");
CREATE INDEX "ActiveAlert_severity_idx" ON "ActiveAlert"("severity");
CREATE INDEX "ActiveAlert_status_idx" ON "ActiveAlert"("status");
CREATE INDEX "ActiveAlert_createdAt_idx" ON "ActiveAlert"("createdAt");
CREATE INDEX "DashboardNote_noteType_idx" ON "DashboardNote"("noteType");
CREATE INDEX "DashboardNote_isPinned_idx" ON "DashboardNote"("isPinned");
CREATE INDEX "DashboardNote_dismissedAt_idx" ON "DashboardNote"("dismissedAt");
CREATE INDEX "ScheduledReminder_targetDate_idx" ON "ScheduledReminder"("targetDate");
CREATE INDEX "ScheduledReminder_isCompleted_idx" ON "ScheduledReminder"("isCompleted");
CREATE INDEX "ArchivedData_entityType_idx" ON "ArchivedData"("entityType");
CREATE INDEX "ArchivedData_archivedAt_idx" ON "ArchivedData"("archivedAt");
CREATE INDEX "ArchivedReport_reportType_idx" ON "ArchivedReport"("reportType");
CREATE INDEX "ArchivedReport_reportDate_idx" ON "ArchivedReport"("reportDate");
CREATE INDEX "DocumentationNote_pageId_idx" ON "DocumentationNote"("pageId");
CREATE INDEX "DocumentationNote_category_idx" ON "DocumentationNote"("category");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reagent" ADD CONSTRAINT "Reagent_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReagentBatch" ADD CONSTRAINT "ReagentBatch_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReagentBatch" ADD CONSTRAINT "ReagentBatch_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FrameworkOrder" ADD CONSTRAINT "FrameworkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FrameworkOrderItem" ADD CONSTRAINT "FrameworkOrderItem_frameworkOrderId_fkey" FOREIGN KEY ("frameworkOrderId") REFERENCES "FrameworkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FrameworkOrderItem" ADD CONSTRAINT "FrameworkOrderItem_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_frameworkOrderId_fkey" FOREIGN KEY ("frameworkOrderId") REFERENCES "FrameworkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WithdrawalItem" ADD CONSTRAINT "WithdrawalItem_withdrawalRequestId_fkey" FOREIGN KEY ("withdrawalRequestId") REFERENCES "WithdrawalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WithdrawalItem" ADD CONSTRAINT "WithdrawalItem_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_withdrawalRequestId_fkey" FOREIGN KEY ("withdrawalRequestId") REFERENCES "WithdrawalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryCountEntry" ADD CONSTRAINT "InventoryCountEntry_countDraftId_fkey" FOREIGN KEY ("countDraftId") REFERENCES "InventoryCountDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ReagentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpiredProductLog" ADD CONSTRAINT "ExpiredProductLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ReagentBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActiveAlert" ADD CONSTRAINT "ActiveAlert_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
