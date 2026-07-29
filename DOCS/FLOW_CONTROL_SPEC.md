# Flow Control — System Specification (Business Logic & Technical Reference)

> **Audience:** engineers and AI agents working on the codebase.
> **Status:** reverse-engineered from the live code at `/opt/flow-control/app` (frontend `src/`, backend `server/`) and reconciled against the existing `DOCS/` and `docs/` corpus. Where the legacy docs and the live code disagree, **the live code wins** and the discrepancy is flagged.
> **Companion document:** `FLOW_CONTROL_SCREENS_AND_FEATURES.md` (screen-by-screen + feature catalog).
> **Last reconciled:** 2026-06-16.

---

## 1. Overview & purpose

**Flow Control** is a web application for managing the inventory of consumable, expiry-dated, lot/batch-tracked, quality-controlled products. It was built first for a **blood-bank reagent laboratory**, and manages the full lifecycle: **procurement → goods receipt → storage → dispensing/in-use → expiry & disposal → quality assurance → reporting & audit.**

The core problem it solves: a blood bank (or any medical lab) must **never use an expired or unqualified reagent**, must **never run out of a critical reagent**, must keep **every procurement traceable order-to-receipt**, must hold a **Certificate of Analysis (COA) for every batch**, and must maintain a **complete, user-attributed audit trail** for regulatory inspection. Flow Control centralizes all of this into one tool with a live operational dashboard.

### 1.1 Domain generalization

The product is ~70% generic "expiry + batch/lot + COA inventory" and ~30% blood-bank-specific. The generic core applies to **any medical laboratory** and, more broadly, to **any inventory of items that carry an expiry date, a lot/batch number, and a certificate of analysis** (pharmacy, IVD/diagnostics, cell & tissue, vaccines, etc.).

Blood-bank-specific differentiators (the 30%):
1. **Dispense → In-Use → Partial-Disposal** lifecycle (a reagent is opened and consumed over days/weeks; expiry must still be tracked *while in use*).
2. **Per-supplier barcode decode rules** (GS1 / regex) for lot + expiry extraction at receipt/dispense.
3. **Smart replenishment** that subtracts near-expiry stock so the system does not under-order.
4. **Framework-order → withdrawal-request** procurement workflow with an approval chain.
5. A real-time **dashboard with clickable "critical actions"**.
6. A distinct **Cells (כדוריות)** category with a tighter expiry-warning window than ordinary reagents.

---

## 2. Architecture & tech stack (current)

| Layer | Technology |
|---|---|
| Frontend | React (Vite), JavaScript/JSX, Tailwind, Hebrew **RTL**, `date-fns` (he locale), `framer-motion`, `html5-qrcode` (camera barcode) |
| Backend | Node + **TypeScript**, **Express 4**, entry `server/src/server.ts` (default port 4000), app wiring `server/src/app.ts` |
| ORM / DB | **Prisma** over **PostgreSQL** (schema `inventory`); a SQLite variant exists for local dev |
| Auth | JWT access tokens (HS256, short-lived) + rotating **refresh tokens** (SHA-256-hashed, httpOnly cookie `flow_rt`, 30-day TTL) + **Google OAuth** (`/auth/google`) |
| Security | Helmet (CSP/HSTS/frameguard), CORS allow-list, rate limiting (100/15min general, 5/15min on auth), bcrypt (cost 10) |
| Files | local disk via `multer` (10 MB cap, type allow-list); COA stored as a URL string on the batch |
| Deploy | PM2 (`flow-api`), Caddy reverse proxy; API mounted under `/api`, OAuth under `/auth` |
| Response contract | `{ success, data?, error?, message?, meta? }`; `AppError` + `asyncHandler` + central `errorHandler` |

**API has two parallel surfaces:**
1. Conventional **REST routers** under `server/src/routes/*` (e.g. `/api/reagents`, `/api/orders`).
2. A large **function-RPC dispatcher** `POST /api/functions/:functionName` (`functions.ts`) that the SPA calls for page-shaped aggregates. This exists because the app was migrated from the **Base44** BaaS platform to a self-hosted Express/Prisma stack; the RPC surface preserved the old `base44.functions.invoke(...)` call sites.

> **Staleness flag:** the large `DOCS/Flow_Control_Documentation_2025-10-30 (2).md` describes a **Base44 + Deno** architecture. That is **historical** — the system was migrated to self-hosted Express/Prisma/PostgreSQL (see `README.md` "API Migration Complete"). The business logic in that doc is still useful; its platform/infra details are obsolete.

---

## 3. Data model

PKs are `cuid()` strings; most entities carry `createdAt`/`updatedAt`. **Status/enum fields are stored as plain strings**; canonical values live in `server/src/types/index.ts` and inline schema comments. Source: `server/prisma/schema.prisma`.

### 3.1 Master data
- **Supplier** — vendor. `name` (unique), `shortCode`, `defaultCurrency` (ILS), `paymentTerms`, `leadTimeDays`, `isPreferred`, `isActive` (soft-deactivate). → reagents, contacts, orders, deliveries, withdrawalRequests, barcodeFormats.
- **SupplierContact** — `name`, `role`, `phone`, `mobile`, `email`, `isPrimary`, `isActive`. FK→Supplier (cascade).
- **Reagent** — catalog item **with denormalized aggregate stock fields**. Identity: `name`, `catalogNumber`, `category` (`REAGENT`/`CELLS`/`CONSUMABLE`), `supplierId`. Aggregates (recomputed by `updateReagentAggregates`): `totalQuantity`, `activeBatchesCount`, `nearestExpiryDate`, `currentStockStatus` (`NORMAL`/`LOW`/`CRITICAL`/`OUT_OF_STOCK`), `monthsOfStock`. Usage: `averageMonthlyUsage` (computed) + `manualMonthlyUsage`/`useManualUsage` (override). **Stock policy: `minStockLevel` (reorder point), `maxStockLevel` (fill target).** Meta: `isConsumable`, `requiresBatches`, `isDeleted` (soft delete), `notes`. Unique `(name, supplierId)`.
- **BarcodeFormat** — per-supplier decode config: `barcodeType` (`CODE128`/`QR`/`DATAMATRIX`/`EAN13`/`GS1_128`), `parsePattern` (regex), `fieldMapping` (JSON: lot/expiry/catalog/qty → capture groups), `dateFormat` (`YYMMDD`/`DDMMYY`/`YYYYMMDD`).

### 3.2 Inventory units
- **ReagentBatch** — a lot/batch (the traceability + expiry unit). `batchNumber`, `expiryDate`, `manufactureDate`, `firstOpenedDate`; quantities `initialQuantity`/`currentQuantity`/`reservedQuantity`; `receivedDate` + FK→Delivery; `storageLocation`/`storageConditions`; `status` (`INCOMING`/`ACTIVE`/`IN_USE`/`EXPIRED`/`CONSUMED`/`ON_HOLD`/`DESTROYED`); `qcStatus` (`PENDING`/`APPROVED`/`REJECTED`/`REQUIRES_REVIEW`); `coaDocumentUrl`; `qcNotes`/`generalNotes`. Unique `(reagentId, batchNumber)`.
- **InventoryTransaction** — the **immutable stock-movement ledger** (every change in stock is one row). `transactionType` (`RECEIPT`/`CONSUMPTION`/`WITHDRAWAL`/`ADJUSTMENT`/`DESTRUCTION`/`TRANSFER_IN`/`TRANSFER_OUT`), `quantityDelta` (signed), `sourceType` (`delivery`/`withdrawal`/`count`/`destruction`/`dispense`/`shipment`), `sourceId`, `performedById`, `notes`. Drives usage averaging.
- **DispenseEvent** — taking a batch into use: `quantity`, `dispensedById`, `scanMethod` (`BARCODE`/`QR`/`MANUAL`/`SEARCH`), `rawScanData`, `purpose`, `notes`.
- **PartialDisposal** — quarter-granular waste of an in-use item: `portionDisposed` (0.25/0.5/0.75/1.0), `originalQuantity`, `reason` (`EXPIRED_IN_USE`/`CONTAMINATED`/`DAMAGED`/`OTHER`).
- **ExpiredProductLog** — expiry/disposal handling record: `quantity`, `actionTaken` (`DESTROYED`/`CONSUMED`/`NOT_IN_STOCK`/`OTHER`), `handledById`, `reason`, `notes`.

### 3.3 Procurement
> **Terminology:** the live UI renamed this entity **order → requisition (Hebrew: הזמנה → דרישת רכש)** (git `e62fd8c`). The backend entity is still named **`Order`**. In agent-facing code, `Order` == requisition.

- **Order** *(UI: requisition / דרישת רכש)* — `tempNumber` (unique, `ORD-YYYY-NNNN`), `permanentNumber`, `sapPurchaseOrder`; `supplierId` + `supplierSnapshot`; `orderType` (`IMMEDIATE`/`FRAMEWORK`); `status` (`DRAFT`/`PENDING_SAP`/`APPROVED`/`PARTIALLY_RECEIVED`/`FULLY_RECEIVED`/`CLOSED`/`CANCELLED`); dates; `totalValue`/`currency`; notes. → items, deliveries, optional 1:1 frameworkOrder.
- **OrderItem** — `requestedQuantity`, `approvedQuantity`, `receivedQuantity`, `remainingQuantity`, `unitPrice`. FK→Order (cascade), FK→Reagent.
- **FrameworkOrder** — blanket agreement on a FRAMEWORK order (1:1 `orderId`). `validFrom`/`validTo`, `maxTotalQuantity`, `availableQuantity`. → frameworkOrderItems, withdrawalRequests.
- **FrameworkOrderItem** — per-reagent allocation: `allocatedQuantity`, `consumedQuantity`, `availableQuantity`.
- **WithdrawalRequest** — a draw against a framework. `withdrawalNumber` (unique, `WD-NNNNNN`), `supplierId` + snapshot, optional `frameworkOrderId`; `status` (`DRAFT`/`SUBMITTED`/`APPROVED`/`SHIPPING`/`CLOSED`/`CANCELLED`); `urgencyLevel` (`routine`/`urgent`/`emergency`); requested/approved values; requester/approver ids + notes. → items, deliveries.
- **WithdrawalItem** — `requestedQuantity`, `approvedQuantity`, `fulfilledQuantity`, `unitPrice`.

### 3.4 Logistics
- **Delivery** — inbound goods receipt. `deliveryNumber` (unique, `DEL-NNNNNN`), `supplierId` + snapshot, optional `orderId` and/or `withdrawalRequestId`; `status` (`NEW`/`PROCESSING`/`COMPLETED`/`CANCELLED`); `documentUrl`; `isRecurringSupply`. → items, batches.
- **DeliveryItem** — `batchNumber`, `quantity`, `expiryDate`, `acceptedQuantity`, `rejectedQuantity`, `rejectionReason`.
- **Shipment** — outbound. `shipmentNumber` (unique, `SHP-NNNNNN`), `destinationHospital`, `destinationDepartment`, `status` (`DRAFT`/`SENT`/`RECEIVED`/`CANCELLED`). → items.
- **ShipmentItem** — `reagentId`, optional `batchId`, `quantity`.

### 3.5 Counting, quality, alerts, admin
- **InventoryCountDraft** + **InventoryCountEntry** — in-progress physical count (persists across sessions). Draft `status` `DRAFT`/`IN_PROGRESS`/`COMPLETED`.
- **CompletedInventoryCount** — finalized snapshot: `countDate`, `totalReagentsCounted`, `totalBatchesCounted`, `varianceSummary` (JSON), report URLs.
- **AlertRule** — `ruleType` (`EXPIRY_WARNING`/`LOW_STOCK`/`PENDING_SUPPLY`/`COUNT_REQUIRED`/`COA_MISSING`/`CUSTOM`/`EXPIRED_IN_USE`), thresholds (`thresholdDays`/`thresholdQuantity`/`thresholdMonths`), `appliesToCategories`, `isActive`.
- **ActiveAlert** — `entityType`/`entityId`, `severity` (`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`), `status` (`NEW`/`IN_PROGRESS`/`RESOLVED`/`DISMISSED`), `message`, `details`.
- **DashboardNote** — note/task: `noteType`, `priority`, `isPinned`, `ctaRoute`, `dismissedAt`.
- **ScheduledReminder** — `reminderType`, `targetDate`, `assignedTo` (latent — no live route).
- **Message** / **MessageRecipient** — internal messaging: `recipientType` (`ALL`/`SELECTED`/`SINGLE`), `messageType`, `priority`; per-recipient `isRead`/`isDismissed`.
- **User** (`app_users`) — `email` (unique), `name`, `password` (bcrypt), `role` (`ADMIN`/`MANAGER`/`USER`/`READONLY`), `deviceFingerprint`, `isActive` (registration is approval-gated), `lastLoginAt`.
- **ActivityLog** — audit: `userId`, `action`, `entityType`, `entityId`, `details` (JSON), `ipAddress`, `userAgent`.
- **SystemSettings** — `key`/`value` (JSON) + flattened display fields (`mainHeaderName`, `sidebarHeaderName`, `logoUrl`) + the `manual_entry_policy` key.
- **ArchivedData** / **ArchivedReport** / **DocumentationNote** — archival + in-app feature documentation.

---

## 4. State machines

**Order / requisition** (`orderService`, `orders.ts`):
`DRAFT` —approve (ADMIN/MANAGER)→ `APPROVED`; `DRAFT` —markOrdered→ `PENDING_SAP`. On `/receive`, status recomputed from line receipts → `PARTIALLY_RECEIVED` or `FULLY_RECEIVED` (sets `closedDate`). `/cancel` → `CANCELLED` from any state.

**WithdrawalRequest** (`withdrawals.ts`):
`DRAFT` —submit→ `SUBMITTED` —approve (ADMIN/MANAGER)→ `APPROVED` —ship→ `SHIPPING` —complete→ `CLOSED`. `/reject` (from SUBMITTED) → `CANCELLED`. Item edits allowed only in `DRAFT`. **`/complete` is transactional:** sets `fulfilledQuantity`, decrements the linked `FrameworkOrderItem.availableQuantity` (+`consumedQuantity`), and **auto-creates a `Delivery` (status NEW)** to be received.

**Delivery** (`deliveries.ts`):
`NEW` —process→ `PROCESSING`; `/receive` (ADMIN/MANAGER) → `COMPLETED` — creates one `ReagentBatch` (ACTIVE, qcStatus PENDING) per accepted line, writes a `RECEIPT` transaction, recomputes aggregates. `/cancel` → `CANCELLED`. COMPLETED is terminal.

**Shipment** (`shipments.ts`):
`DRAFT` —send (ADMIN/MANAGER)→ `SENT` — deducts stock (specific batch, else **FEFO/earliest-expiry across active batches**), writes `TRANSFER_OUT`. `/confirm-received` → `RECEIVED`. `/cancel` (from DRAFT only) → `CANCELLED`.

**ReagentBatch** (multiple services):
`ACTIVE` (received, usable) → `IN_USE` (dispensed to qty 0, still expiry-tracked) / `CONSUMED` (fully withdrawn) / `EXPIRED` (past expiry, flipped by `processExpiredBatches`) / `DESTROYED` (full disposal). `IN_USE` → back to `ACTIVE` by ADMIN. `ON_HOLD`/`INCOMING` exist but have no live transition wired in. `qcStatus` transitions (`PENDING`→`APPROVED`/`REJECTED`/`REQUIRES_REVIEW`) are **manual** and do **not** block dispensing.

**InventoryCountDraft:** `DRAFT` → `IN_PROGRESS` → `COMPLETED` (spawns `CompletedInventoryCount`).

**ActiveAlert:** `NEW` —acknowledge→ `IN_PROGRESS` —resolve→ `RESOLVED`; or —dismiss→ `DISMISSED`.

---

## 5. Core business logic & algorithms

### 5.1 Reagent stock aggregation — the central recompute (`reagentAggregates.ts`)
Called after **every** stock-changing operation (optionally inside the same DB transaction):
1. Load all `ACTIVE` batches (expiry asc). `totalQuantity` = Σ `currentQuantity`; `activeBatchesCount` = count; `nearestExpiryDate` = earliest active expiry.
2. `effectiveUsage` = `manualMonthlyUsage` (if `useManualUsage` and >0) else `averageMonthlyUsage`.
3. `monthsOfStock` = `totalQuantity / effectiveUsage` (when usage > 0).
4. **Hybrid stock status:**
   - `totalQuantity == 0` → `OUT_OF_STOCK`.
   - else if `minStockLevel > 0` (min/max policy set): `total < min` → `CRITICAL`; `total < min × 1.25` → `LOW`; else `NORMAL`.
   - else (fall back to months-of-stock): `< 1 month` → `CRITICAL`; `< 2 months` → `LOW`; else `NORMAL`.

> The **per-reagent min/max policy is the current primary model when configured**; months-of-stock is the fallback. The legacy docs lead with months-of-stock only — that is the older model.

### 5.2 Average monthly usage forecasting (`calculateAverageUsage`)
Sum absolute `quantityDelta` of **outflow** transactions (`CONSUMPTION`, `WITHDRAWAL`, `DESTRUCTION`, `TRANSFER_OUT`, negative `ADJUSTMENT`) over the last 6 months ÷ elapsed-window-in-months (window = min(elapsed, 6), floor 1 month, 30.44 days/month). 0 if no outflows.

### 5.3 Smart replenishment / reorder suggestion (`inventoryService.calculateReplenishment`)
For each reagent with usage or a min level:
- `onOrder` = Σ remaining quantity of open orders (DRAFT/PENDING_SAP/APPROVED/PARTIALLY_RECEIVED) — so in-transit stock is never double-ordered.
- `projected` = `currentQty + onOrder`.
- **Two policies:** (a) min/max — if `projected < min`, suggest `(max>min ? max : min) − projected`; (b) usage — `suggested = max(0, usage × targetMonths − projected)`, capped by `max` if set.
- Filter to suggestions > 0, sorted by ascending months-of-stock (most urgent first).
- One click on the screen turns a suggestion into a DRAFT **order** or a `SUBMITTED` framework **withdrawal** (`createAutomaticOrder` / `createAutomaticWithdrawal`).

### 5.4 Dispensing & FEFO
- `dispenseItem` deducts a **specific batch** (must be ACTIVE, sufficient qty), flips it to `IN_USE` at 0, writes `DispenseEvent` + `CONSUMPTION`.
- `dispenseByScan` parses the barcode, finds an ACTIVE batch by lot (narrowing by catalog number), then dispenses by **matched lot** (not FEFO).
- **FEFO (first-expiry-first-out) is applied automatically only in `Shipment /send`** when no batch is specified. Manual dispense/withdrawal target an explicit batch — FEFO discipline there is the operator's responsibility.

### 5.5 Expiry tracking & disposal
- `processExpiredBatches` flips past-expiry ACTIVE batches → `EXPIRED` (invoked on demand when loading batch/expiry data — **no timer**).
- `disposal`: `destruction-candidates` = EXPIRED or ≤30-day-to-expiry with qty>0; `bulk-destroy` → `DESTROYED` (qty 0) + `DESTRUCTION` transaction (each its own tx, partial-failure tolerant); `partial` records quarter-based `PartialDisposal` (waste = `original × portion`; full portion → `DESTROYED`).

### 5.6 Inventory count reconciliation (`inventoryService.completeCount`)
Transactional. Per counted line with a batch number: if the batch exists, set `currentQuantity` to the counted value and write an `ADJUSTMENT` transaction with `delta = counted − previous` (this **is** the variance); if missing and an expiry is given, create a new ACTIVE batch + positive `ADJUSTMENT`. Recompute aggregates, create `CompletedInventoryCount`, mark draft COMPLETED, log `inventory_count`.

### 5.7 Alerts generation (`alerts.ts POST /generate`)
Iterates active rules; **idempotent** (skips if an open NEW/IN_PROGRESS alert already exists for the same rule+entity). `EXPIRY_WARNING`: ACTIVE batches expiring ≤ `thresholdDays` (CRITICAL ≤7d / HIGH ≤30d / MEDIUM else). `LOW_STOCK`: `monthsOfStock < thresholdMonths` (CRITICAL ≤1). `COA_MISSING`: ACTIVE qty>0 batches with no COA URL. `EXPIRED_IN_USE`: IN_USE at/near expiry. **On-demand only** (no scheduler). The dashboard separately computes "critical actions" live without persisting alerts.

### 5.8 Numbering
Sequential, transaction-generated (`Serializable`): `ORD-YYYY-NNNN`, `WD-NNNNNN`, `DEL-NNNNNN`, `SHP-NNNNNN`.

---

## 6. End-to-end workflows (business view)

1. **Plan** → smart replenishment recommends what to order (deducting in-transit + near-expiry).
2. **Procure** → create a **requisition** (immediate order) *or* draw a **withdrawal request** against a **framework agreement**; approve (ADMIN/MANAGER); optionally record the SAP PO number.
3. **Receive (goods receipt)** → create a Delivery (auto-linked to the originating requisition/withdrawal), enter line items (lot/qty/expiry, barcode-assisted), then **receive** → batches are created (ACTIVE), `RECEIPT` transactions written, aggregates recomputed, requisition moved to PARTIALLY/FULLY_RECEIVED, COA uploaded.
4. **Store** → batches tracked by lot + expiry + storage location; expiry auto-flagged; physical counts reconcile system vs shelf.
5. **Use** → scan/search → **dispense** a batch → batch goes **IN_USE** (still expiry-tracked) → record **partial disposal** as waste accrues; ADMIN can return an in-use batch to stock.
6. **Ship out** → outgoing shipment to a hospital/department; stock deducted FEFO.
7. **Quality** → per-batch QC status + COA per batch/delivery; COA-missing alerts.
8. **Monitor** → dashboard critical actions + configurable alert engine (expiry / low-stock / COA-missing / pending-supply / count-overdue).
9. **Report & audit** → analytics, reports, and a full user-attributed activity log (movement ledger + activity log).

---

## 7. API surface (grouped)

`/api/auth` (public: register/login/refresh/logout/me/change-password; OAuth `/auth/google`) ·
`/api/dashboard` (aggregate, expiring, low-stock, statistics, expiry-calendar) ·
`/api/reagents`, `/api/batches` (+withdraw/mark-expired/destroy), `/api/suppliers` (+contacts) ·
`/api/orders` (+approve/mark-ordered/receive/cancel/from-suggestions/items) ·
`/api/withdrawals` (+submit/approve/reject/ship/complete/cancel/items) ·
`/api/deliveries` (+process/receive/cancel/items), `/api/shipments` (+send/confirm-received/cancel/items) ·
`/api/inventory` (count draft/complete/history, replenishment, transactions) ·
`/api/dispense` (+by-scan/history/in-use/:id/return), `/api/disposal` (destruction-candidates/bulk-destroy/partial/history) ·
`/api/barcode` (parse/formats/test), `/api/alerts` (+acknowledge/resolve/dismiss/rules/generate) ·
`/api/messages`, `/api/users` (ADMIN), `/api/activity`, `/api/admin/sessions` (ADMIN), `/api/systemsettings`, `/api/files` ·
**RPC:** `POST /api/functions/:functionName` (page aggregates: `getDashboardData`, `getBatchAndExpiryData`, `getReplenishmentData`, `createAutomaticOrder`, … — note a block of names are placeholders returning empty data).

---

## 8. Roles & security

- **Roles:** `ADMIN`, `MANAGER`, `USER`, `READONLY`.
- **Auth:** `authenticate` requires a Bearer JWT; `authorize(...roles)` → 403 if role not allowed. Refresh tokens rotate on use; Google OAuth host-allow-listed with CSRF state cookie. Registration creates an **inactive** user requiring admin approval.
- **Role-gated operations (ADMIN or MANAGER):** order approve; withdrawal approve/reject; delivery receive/cancel; shipment send/cancel; alert generate; alert-rule list/get; message send. **ADMIN only:** alert-rule create/update/delete/toggle; barcode-format CRUD; dispense return-to-inventory; all user management; admin sessions.

> **Honest enforcement notes (for the team, not the pitch):**
> - **Route protection is binary at the router level** — `ProtectedRoute` only checks *authenticated*, not role; any logged-in user can reach any screen by URL. Role enforcement is real only on the *write/sensitive endpoints* via `authorize(...)`, plus a few in-page checks (`ArchivedDataViewer` hard-redirects non-admins; `ItemsInUse` admin action; `Messages` send gating).
> - **Role casing is inconsistent** (`"admin"` vs `"ADMIN"`, `"manager"` vs `"MANAGER"`) across frontend checks. Effective live model ≈ **two tiers (admin vs authenticated user)**; `MANAGER`/`READONLY` are only partially wired. Hardening this RBAC is a recommended near-term task.

---

## 9. Validation & data integrity

- **Zod** schemas (`validation/schemas.ts`): passwords ≥8; names ≥2; quantities positive/non-negative & coerced; cuid IDs; order/withdrawal/delivery/shipment require ≥1 item; partial-disposal portion ∈ {0.25,0.5,0.75,1.0}; message title ≤200/content ≤5000; pagination `limit` capped at 100.
- **Unique constraints:** `Supplier.name`, `Reagent(name,supplierId)`, `ReagentBatch(reagentId,batchNumber)`, `Order.tempNumber`, `WithdrawalRequest.withdrawalNumber`, `Delivery.deliveryNumber`, `Shipment.shipmentNumber`, `User.email`, `MessageRecipient(messageId,userId)`.
- **Soft-delete pattern:** Reagent (`isDeleted`), Supplier/Contact/User (`isActive`), DashboardNote (`dismissedAt`), AlertRule/BarcodeFormat (`isActive`). Almost nothing is hard-deleted.
- **Stock-mutating writes** generally use `Serializable` transactions. Exception: `shipments /send` mutates `reagent.totalQuantity` directly (divergence from the canonical `updateReagentAggregates` path) and is not wrapped in a transaction — a known robustness gap.

---

## 10. Known gaps / not-yet-implemented (be honest in any external claim)

- **No scheduler/cron.** Expiry flagging, alert generation, reorder suggestions, and "pending withdrawal" checks are all **on-demand** (triggered by a user action or page load). The legacy docs' "every 30 min" / "daily 08:00" / "Dec 31 annual reminders" are aspirational, not implemented.
- **RPC placeholders:** `generateReports`, `manageCOA`, `archiveOldData`, `getAdvancedAnalytics`, `fixDataIntegrity`, `migrateToHybridCatalog`, and others return empty data.
- **COA is a URL string only** — no managed COA file entity, no QC gate blocking dispense.
- **Latent entities:** `ScheduledReminder`, `ArchivedData/Report`, `reagentreceiptevents` (model absent) have no live workflow.
- **No multi-site / multi-tenant.** No branch/warehouse/facility concept; the product is single-facility. Backend function names like `getReagentsForHospital` imply a single tenant context, not user-facing multi-site.
- **Unpopulated:** `varianceSummary`, several PDF/CSV export URLs.

---

## 11. Roadmap / expansion (for budget-pitch framing)

1. **Production hardening** — schedule the alert/expiry/reorder engine (cron); unify the shipment stock path through `updateReagentAggregates` in a transaction; harden RBAC (fix casing, add per-route role guards, complete MANAGER/READONLY).
2. **SAP integration** — the `sapPurchaseOrder` field + `PENDING_SAP` status today mean orders are **re-keyed into SAP manually**; a real integration eliminates double entry. The `Flow-Control-Diagrams.md` + `SAP-Specialist-Brief.md` already map every entity/movement to SAP MM/QM/WM (MIGO, ME21N, batch master, movement types 101/261/551/701/702/311).
3. **Multi-site / multi-tenant** — add `hospital_id` scoping + a shared `GlobalCatalog → per-lab catalog` model to serve a network of blood banks / labs / hospitals (envisioned, not built).
4. **Mobile & barcode** — camera GS1 scanning already exists; package as a tablet/mobile-first flow.
5. **Consumption forecasting** — trend-based demand prediction beyond the 6-month average.
6. **Reports & analytics** — implement the placeholder analytics/report generators and exports.

---

## 12. Glossary (Hebrew ↔ English)

| Hebrew | English | Meaning |
|---|---|---|
| ריאגנט | Reagent | Catalog item / consumable |
| כדוריות | Cells | A reagent category with a tighter expiry window |
| אצווה | Batch / Lot | Traceability + expiry unit |
| תוקף / פג תוקף | Expiry / Expired | Shelf-life date |
| דרישת רכש | Requisition (entity `Order`) | Procurement order |
| הסכם מסגרת | Framework order | Blanket agreement |
| בקשת משיכה | Withdrawal request | Draw against a framework |
| קליטת משלוח | Delivery / goods receipt | Inbound receiving |
| משלוח יוצא | Shipment | Outbound to a hospital/department |
| הוצאה / משיכה | Dispense / withdrawal | Stock-out of a batch |
| פריט בשימוש | In-use item | Opened batch, expiry still tracked |
| השמדה / גריעה | Disposal / destruction | Removing expired/contaminated stock |
| ספירת מלאי | Inventory count | Physical count + reconciliation |
| בקרת איכות | Quality assurance (QC) | Batch QC + COA |
| תעודת אנליזה | COA (Certificate of Analysis) | Per-batch quality document |
| התראה | Alert | Expiry/low-stock/COA/etc. |
| תנועת מלאי | Inventory transaction | One row in the movement ledger |
| מרכז הבקרה | Dashboard | Operational command center |
