# Flow Control — Full-Stack Audit Report (PDR)
**Date:** 2026-02-03
**Scope:** API, Database/Models, UI, Calculations & Rules
**Auditor:** AI-assisted code review (static analysis, no runtime)

---

## 1. Repo Overview

### Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Build | Vite | 6.1.0 |
| Styling | TailwindCSS + Radix UI | 3.4.17 |
| Routing | React Router | 7.2.0 |
| Backend | Express | 5.1.0 |
| Language | TypeScript | 5.9.3 |
| ORM | Prisma | 6.19.0 |
| Database | PostgreSQL | 15+ |
| Validation | Zod | 4.1.12 |
| Auth | JWT (custom middleware) | — |

### Project Layout
```
/opt/flow-control/app/
├── src/                     # Frontend (React + Vite)
│   ├── pages/               # 52 screens, ~35k LOC
│   ├── components/          # shadcn/ui + custom
│   ├── api/                 # fetch wrappers
│   └── hooks/               # custom React hooks
├── server/                  # Backend (Express + TS)
│   ├── prisma/schema.prisma # 27 models, 16 enums
│   ├── src/
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # auth, validation, errors
│   │   ├── validation/      # Zod schemas
│   │   └── types/           # Enums + interfaces
│   └── package.json
├── docs/                    # This file lives here
└── docker-compose.yml       # PostgreSQL container
```

### How to Run (Dev)
```bash
cd /opt/flow-control/app
npm install && cd server && npm install
docker compose up -d          # PostgreSQL
npx prisma generate && npx prisma migrate dev
npm run dev                   # Backend on :4000
cd .. && npm run dev          # Frontend on :5173
```

### Key Env Vars
`DATABASE_URL`, `JWT_SECRET`, `PORT` (default 4000)

---

## 2. Spec → Implementation Mapping Table

| Spec ID | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| 1.1 | Supplier CRUD | ✅ Done | `routes/suppliers.ts` |
| 1.1 | Reagent CRUD (incl. soft-delete) | ✅ Done | `routes/reagents.ts` |
| 1.1 | ReagentBatch CRUD | ✅ Done | `routes/batches.ts` — see Bug #3 (expiry fallback) |
| 1.1 | Manufacturer entity | ❌ Missing | No `Manufacturer` model in schema; supplier contacts only |
| 1.2 | Order lifecycle (DRAFT→PENDING_SAP→APPROVED→…) | ⚠️ Partial | `markOrdered` sets APPROVED instead of PENDING_SAP (Bug #5) |
| 1.2 | PR number generation (temp → permanent → SAP PO) | ✅ Done | `Order.tempNumber`, `permanentNumber`, `sapPurchaseOrder` fields exist |
| 1.2 | OrderItem tracks requested / received / remaining | ✅ Done | Computed in `index.ts:154-175` mapping; `receivedQuantity` field not always updated |
| 1.3 | FrameworkOrder with validity window | ✅ Done | Validated at withdrawal creation (`withdrawals.ts:254`) |
| 1.3 | FrameworkOrderItem balance (allocated / consumed / available) | ❌ Never updated | Fields exist in schema but no code path writes `consumedQuantity` or `availableQuantity` after creation (Bug #1) |
| 1.3 | Withdrawal → auto-creates incoming Delivery | ❌ Missing | Withdrawal completion does not spawn a Delivery record (Bug #2) |
| 1.4 | Recurring / automatic supply suggestions | ⚠️ Partial | `orderService.createAutomatic` exists but relies on stale `monthsOfStock` (Bug #4) |
| 1.5 | Dashboard cards: expiring, low-stock, in-transit, pending orders | ✅ Done | `dashboardService.ts` + `Dashboard.jsx`. Low-stock card unreliable — see Bug #4 |
| 1.5 | Incoming quantity indicator per reagent | ❌ Missing | Dashboard shows no "on order" or "in transit" quantity |
| 1.6 | PR → SAP PO mapping visible in UI | ✅ Done | Exposed via `getDeliveriesData` in `functions.ts:174` |

---

## 3. Workflow Validation

### 3.1 Order Flow
`DRAFT → markOrdered → APPROVED → receive → PARTIALLY_RECEIVED / FULLY_RECEIVED → CLOSED`

- **Issue:** `markOrdered` (`orderService.ts:232-241`) sets status to `APPROVED` directly. The expected transition is `DRAFT → PENDING_SAP` (waiting for SAP confirmation), then a separate approval step sets `APPROVED`. The `PENDING_SAP` state is never reached via API.
- **Receive handler** (`deliveries.ts:261-368`) creates batches, logs inventory transactions, and increments `Reagent.totalQuantity`. This path is correct.

### 3.2 Withdrawal Flow
`DRAFT → SUBMITTED → APPROVED → SHIPPING → CLOSED`

- Withdrawal creation (`withdrawals.ts:159-307`) validates the linked FrameworkOrder's validity window.
- **Issue:** Number generation at `withdrawals.ts:262-263` uses `count() + 1`. Under concurrent requests this produces duplicate `WD-NNNNNN` numbers.
- **Issue:** The `/complete` handler (`withdrawals.ts:563-620`) marks items as fulfilled and sets status to `CLOSED`, but never decrements `FrameworkOrderItem.availableQuantity` or increments `consumedQuantity`.
- **Issue:** No Delivery record is auto-created when a withdrawal is completed. The spec implies that completing a withdrawal should produce an incoming-supply (Delivery) record to close the procurement loop.

### 3.3 Delivery / Receive Flow
`NEW → PROCESSING → COMPLETED`

- The `/receive` endpoint (`deliveries.ts:261-368`) creates `ReagentBatch` records, writes `InventoryTransaction`, and updates `Reagent.totalQuantity`.
- **Issue:** Batch operations are fired with `Promise.all` at line 345 but there is no wrapping `prisma.$transaction()`. A partial failure leaves the DB in an inconsistent state (some batches created, reagent totals incremented, delivery not marked complete).
- **Issue:** The receive handler never touches `FrameworkOrderItem` balances, even when the delivery is linked to a framework order.

### 3.4 Dashboard Data Flow
`getDashboardData` → aggregates from DB → single JSON response → React renders 4 cards.

- Expiring-reagent card: queries `ReagentBatch` directly, calculates days-to-expiry in real time. **Correct.**
- Low-stock card: reads pre-computed `currentStockStatus` and `monthsOfStock` from the `Reagent` row (`dashboardService.ts:136-162`). **Unreliable** — these fields are never recomputed after seed (Bug #4).
- Pending-orders card and in-transit card: sourced from `Order` / `Shipment` tables. Functional but do not include "on-order quantity" per reagent.

---

## 4. Bugs, Gaps & Risks

### Critical (must fix before production)

| # | Title | File:Line | Detail |
|---|-------|-----------|--------|
| C1 | `/api/functions/:name` has no authentication | `routes/functions.ts:34-36` | The entire legacy dispatch endpoint — used by the frontend for most reads AND some writes (`createAutomaticOrder`, `createAutomaticWithdrawal`, alert management) — has zero `authenticate` middleware. Any unauthenticated HTTP client can call it. |
| C2 | Legacy compatibility routes have no authentication | `routes/index.ts:80-192` | `dashboardnotes` (GET/POST/PUT/DELETE), `featuredocumentations` (GET/POST/PUT/DELETE), `orderitems` (GET), `withdrawalitems` routes all lack `authenticate`. Write operations are fully exposed. |
| C3 | FrameworkOrderItem balances never update | schema + `withdrawals.ts:563-620`, `deliveries.ts:260-368` | `consumedQuantity` and `availableQuantity` are never written after initial creation. The entire framework-order balance system is inert. |
| C4 | Low-stock / months-of-stock are stale forever | `orderService.ts:504-526`, `dashboardService.ts:136-162` | `updateReagentAggregates` only writes `totalQuantity`, `activeBatchesCount`, `nearestExpiryDate`. It never recalculates `currentStockStatus` or `monthsOfStock`. Dashboard low-stock card shows seed data. |

### High

| # | Title | File:Line | Detail |
|---|-------|-----------|--------|
| H1 | `markOrdered` sets wrong status | `orderService.ts:236` | Sets `APPROVED` instead of `PENDING_SAP`. The order skips the entire SAP-confirmation stage. |
| H2 | Withdrawal number race condition | `withdrawals.ts:262-263` | `count() + 1` is not atomic. Concurrent POST requests will produce duplicate `WD-NNNNNN`. Use a DB sequence or `MAX(number) + 1` in a transaction. |
| H3 | Delivery receive not transactional | `deliveries.ts:345` | `Promise.all(batchOperations)` runs N independent writes. No `$transaction` wrapper. Partial failure corrupts state. |
| H4 | Withdrawal completion does not create Delivery | `withdrawals.ts:563-620` | Spec requires an incoming-supply record when a withdrawal is fulfilled. Currently missing. |

### Medium

| # | Title | File:Line | Detail |
|---|-------|-----------|--------|
| M1 | Invalid expiry date silently becomes +100 years | `routes/batches.ts:105-109` | If `expiryDate` is missing or unparseable, the batch is created with expiry = now + 100 years instead of rejecting the request. |
| M2 | `deliveryType` ternary is dead code | `routes/functions.ts:163` | `d.withdrawalRequestId ? 'with_order' : 'with_order'` — both branches return the same value. The distinction between `with_order` and `standalone` is lost. |
| M3 | Invalid status filter for withdrawals | `routes/functions.ts:1498` | Queries `status: { in: ['PENDING', 'APPROVED'] }`. `PENDING` is not a valid `WithdrawalStatus` enum value (valid: `DRAFT`, `SUBMITTED`, `APPROVED`, …). The filter silently drops the intent. |
| M4 | N+1 query explosion in order listing | `services/orderService.ts:53-86` | `getAll` fetches orders, then loops to fetch supplier + items + reagent for each order individually. Replace with Prisma `include`. |
| M5 | N+1 in `getById` | `services/orderService.ts:92-129` | Same pattern: order → supplier → contacts → items → reagent per item. |
| M6 | N+1 in `getLowStockReagents` | `services/dashboardService.ts:148-159` | Loops over reagents and fetches supplier one-by-one. |
| M7 | `batches.ts` POST bypasses Zod validation | `routes/batches.ts:84-147` | No `validateBody()` call. Field names are manually parsed with aliasing. |
| M8 | Delivery receive handler increments `activeBatchesCount` blindly | `deliveries.ts:337` | Uses `{ increment: 1 }` without checking whether the batch was actually created (the `if (acceptedQuantity > 0)` branch). If `acceptedQuantity` is 0 or undefined the increment still runs in the same scope. |

### Low

| # | Title | File:Line | Detail |
|---|-------|-----------|--------|
| L1 | No Manufacturer model | `schema.prisma` | Spec 1.1 implies a Manufacturer entity. Only Supplier + SupplierContact exist. |
| L2 | Missing "on-order" quantity on Dashboard | `pages/Dashboard.jsx` | No indicator of how much of a reagent is currently ordered but not yet received. |
| L3 | `orderService.getById` returns `delivery: null` hardcoded | `orderService.ts:121` | Comment says "delivery table may not exist yet". The table does exist; the join is simply missing. |
| L4 | Activity logging incomplete | various | Several mutation endpoints do not write to `ActivityLog`. |
| L5 | No rate limiting on any endpoint | `server/src/app.ts` | All API routes are unthrottled. |
| L6 | Error messages may leak internal stack traces | `middleware/errorHandler.ts` | In non-production mode, full `err.stack` is returned to the client. |
| L7 | Outgoing shipment number generation likely has same race as withdrawals | `routes/shipments.ts` | Pattern `count() + 1` repeated. |

---

## 5. Improvement Suggestions

### Performance
1. **Replace all N+1 loops with Prisma `include`** — `orderService.getAll`, `getById`, `dashboardService.getLowStockReagents`. Single queries instead of O(n) round-trips.
2. **Add indexes** on frequently filtered columns: `ReagentBatch.expiryDate`, `Order.status`, `WithdrawalRequest.frameworkOrderId`, `Reagent.currentStockStatus`.
3. **Wrap multi-write operations in `prisma.$transaction()`** — delivery receive, withdrawal completion, order creation with items.

### Data Integrity
4. **Use DB sequences for document numbers** (Order, Withdrawal, Delivery, Shipment) instead of `count() + 1`.
5. **Implement `updateReagentAggregates` to recompute `currentStockStatus` and `monthsOfStock`** from `averageMonthlyUsage` / `manualMonthlyUsage` and actual `totalQuantity`.
6. **Wire FrameworkOrderItem balance updates** into withdrawal-complete and delivery-receive flows.

### Security
7. **Add `authenticate` middleware to `functions` router and all legacy routes in `index.ts`.**
8. **Add `validateBody` to `batches.ts` POST** and reject missing/invalid `expiryDate` instead of silencing it.
9. **Add rate limiting** (e.g., `express-rate-limit`) to all POST/PUT/DELETE routes.

### UX / UI
10. **Dashboard "on-order" column** — aggregate `OrderItem.requestedQuantity - receivedQuantity` for reagents with orders in `APPROVED` or `PARTIALLY_RECEIVED` status.
11. **Framework-order balance card** — show allocated / consumed / available per FrameworkOrder on the dashboard or a dedicated view.

---

## 6. n8n Automation Opportunities

n8n is already running on this VPS at `127.0.0.1:5678`. The following workflows can offload scheduled or event-driven logic out of the Express server.

| # | Workflow | Trigger | What it does |
|---|----------|---------|--------------|
| N1 | Expiry alert sweep | Daily cron | Query batches where `expiryDate` is within 7 / 30 / 60 days. Create / update `ActiveAlert` records. Push notification to admins. |
| N2 | Low-stock replenishment suggestion | Daily cron | For each reagent where `monthsOfStock < 2`, create a draft auto-order suggestion (write to a `ReplenishmentSuggestion` table or directly create a DRAFT Order). |
| N3 | Framework-order validity reminder | 14 days before `validTo` | Alert procurement that a framework order is about to expire. |
| N4 | Withdrawal → Delivery auto-link | On WithdrawalRequest status → CLOSED | Create the incoming Delivery record and link it to the withdrawal. This is the missing step identified in Bug H4. |
| N5 | SAP PO sync stub | On Order status → PENDING_SAP | Placeholder webhook: POST to an external SAP endpoint (or email) with the order details. Update `sapPurchaseOrder` on response. |
| N6 | Daily inventory snapshot | Daily cron | Snapshot `Reagent.totalQuantity` for all reagents into a time-series table for trend reports. |
| N7 | Batch QC reminder | On ReagentBatch created with `qcStatus = PENDING` | After 24 h if still PENDING, notify the QC team. |
| N8 | Monthly usage report | 1st of every month | Aggregate `InventoryTransaction` by reagent for the previous month. Store as report or send as email/PDF. |

---

## 7. Action Plan

### Phase 1 — Correctness & Security (address all Critical + High bugs)

| # | Task | Acceptance Criteria | Complexity |
|---|------|---------------------|------------|
| P1-1 | Add `authenticate` to `/api/functions` router | Any unauthenticated POST to `/api/functions/*` returns 401 | Low |
| P1-2 | Add `authenticate` to all legacy routes in `index.ts` (dashboardnotes, featuredocumentations, orderitems, withdrawalitems) | Same — 401 without valid JWT | Low |
| P1-3 | Fix `markOrdered` to set `PENDING_SAP` | `order.status` after calling markOrdered is `PENDING_SAP` | Low |
| P1-4 | Replace `count()+1` with DB sequence for Withdrawal numbers | No duplicate WD numbers under concurrent load (verify with parallel insert test) | Medium |
| P1-5 | Replace `count()+1` for Order and Shipment numbers | Same pattern, same fix | Medium |
| P1-6 | Wrap delivery `/receive` in `$transaction` | Partial failure rolls back entirely; no orphan batches | Medium |
| P1-7 | Implement FrameworkOrderItem balance updates in withdrawal-complete and delivery-receive | After completing a withdrawal, `consumedQuantity` increases and `availableQuantity` decreases by fulfilled qty | High |
| P1-8 | Implement `currentStockStatus` and `monthsOfStock` recomputation in `updateReagentAggregates` | Dashboard low-stock card reflects real stock levels after any batch change | Medium |
| P1-9 | Auto-create Delivery on withdrawal completion | A `Delivery` record with status `NEW` and linked `DeliveryItem`s is created when a WithdrawalRequest moves to `CLOSED` | High |
| P1-10 | Reject invalid/missing `expiryDate` in batch creation | POST `/api/batches` with missing `expiryDate` returns 400 | Low |

### Phase 2 — Performance, UX & Automation

| # | Task | Acceptance Criteria | Complexity |
|---|------|---------------------|------------|
| P2-1 | Refactor `orderService.getAll` and `getById` to use Prisma `include` | Query count drops from O(n) to 1; response time < 100 ms for 100 orders | Medium |
| P2-2 | Refactor `dashboardService.getLowStockReagents` — use `include` | Same pattern | Low |
| P2-3 | Add `validateBody` to `batches.ts` POST | Zod schema enforces required fields; aliases handled at schema level | Low |
| P2-4 | Fix dead ternary in `functions.ts:163` | `deliveryType` correctly distinguishes `with_order` vs `standalone` | Low |
| P2-5 | Fix invalid `PENDING` status in withdrawal query (`functions.ts:1498`) | Change to `SUBMITTED` or remove; query returns correct set | Low |
| P2-6 | Add DB indexes for hot-path columns | Explain-analyse shows index scan on `expiryDate`, `status`, `frameworkOrderId` | Low |
| P2-7 | Dashboard "on-order" quantity indicator | Card or column shows sum of `requestedQuantity - receivedQuantity` for active orders per reagent | Medium |
| P2-8 | Add rate limiting to POST/PUT/DELETE | 100 req/min per IP; returns 429 on breach | Low |
| P2-9 | Add Manufacturer model (if required by domain) | Schema has `Manufacturer` with name, country; `Reagent` references it | Medium |
| P2-10 | Set up n8n workflows N1 (expiry sweep) and N2 (replenishment suggestion) | Alerts fire correctly; draft orders appear for low-stock reagents | High |

---

*File: `/opt/flow-control/app/docs/PDR-AUDIT-2026.md`*
*Referenced by: `/opt/flow-control/AI_JOBS.md`*
