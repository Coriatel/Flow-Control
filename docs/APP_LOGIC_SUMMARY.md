# Application Logic & Requirements Summary
Based on chat log: "התכתבות Flow Control 10.11.25"

## Core Features & Logic

### Catalog Management
*   **uploadCatalogFile**: Supports bulk import of `ReagentCatalog` from Excel (Name, Cat#, Supplier, Category, Unit, Price). Handles duplicates and reports results.
*   **manageCatalog**: Full CRUD for `ReagentCatalog` with uniqueness validation on `catalog_number`. Supports deactivation (soft delete).
*   **migrateToHybridCatalog**: Establishes a 2-tier catalog system: `GlobalCatalog` (shared) -> `ReagentCatalog` (per lab/hospital) -> `Reagent` (inventory instances).
*   **importGlobalCatalogToLocal**: Allows labs to selectively import items from `GlobalCatalog` to their local `ReagentCatalog`.
*   **Global Catalog Restoration**: Tools to restore `GlobalCatalog` from backups (`restoreGlobalCatalog`) or reconstruct it from distributed local catalogs (`restoreGlobalCatalogFromLocal`).

### Inventory & Multi-Tenancy
*   **Multi-Tenancy**: Strict data isolation per hospital/lab.
    *   `getOrdersForHospital`: Users see only their hospital's orders (Admin sees all).
    *   `getReagentsForHospital`: Inventory and batches are filtered by `hospital_id`.
*   **Suppliers**: Replaced legacy enum with dedicated `Supplier` entities (`migrateLegacySuppliers`).

### Reporting & Alerts
*   **generateReports**: Generates Excel/PDF/CSV reports. Types: Inventory Movement, Orders Summary, Deliveries, Expiry, Usage, Cost Analysis, Supplier Performance.
*   **alertsManager**: Lifecycle management for alerts: Acknowledge, Resolve (with action log), Snooze (temporary dismissal), Escalate, and Bulk Actions.
*   **checkPendingWithdrawals**: Scheduled daily job (08:00) to detect delays:
    *   Approval Delay (>3 days submitted).
    *   Delivery Delay (>7 days approved but not delivered).
    *   Fulfillment Delay (>14 days in delivery).
*   **createAnnualReminders**: Auto-runs on Dec 31 to schedule annual tasks (Audit, Archiving, Cleanup) as `DashboardNotes`.

### Quality Assurance
*   **testCOAAccess**: Verifies accessibility of COA (Certificate of Analysis) files via HEAD requests before display or in batch QA checks.

## Key Entities
*   **Core**: `Reagent`, `ReagentBatch`, `ReagentCatalog`, `GlobalCatalog`.
*   **Procurement**: `Order`, `OrderItem`, `Delivery`, `DeliveryItem`, `Supplier`, `SupplierContact`.
*   **Operations**: `WithdrawalRequest`, `WithdrawalItem`, `Shipment`.
*   **Inventory Control**: `InventoryCountDraft`, `CompletedInventoryCount`, `InventoryTransaction`.
*   **System**: `ActiveAlert`, `AlertRule`, `ExpiredProductLog`, `SystemSettings`, `ArchivedData`.

## Key UI Components
*   **Cards**: `ReagentItem`, `SummaryCard`, `BatchEntry`.
*   **Lists/Tables**: `ResizableTable`, `RecentActivity`.
*   **Navigation/Notifications**: `CriticalActions`, `DashboardPopover`, `SidebarNotifications`, `BackButton`.
