# Flow Control — AI Jobs & Mission Tracker
**Last updated:** 2026-02-03
**PDR (full audit report):** `docs/PDR-AUDIT-2026.md`

---

## Mission

Flow Control is a blood-bank reagent inventory management system. The application is functionally complete at the UI level (52 screens) but has critical gaps in its backend: unauthenticated write endpoints, an inert framework-order balance system, stale computed fields on the dashboard, and several data-integrity risks. The immediate mission is to close all Critical and High findings from the 2026-02-03 audit before any production traffic is allowed, then move to performance and UX polish in Phase 2.

---

## Phase Breakdown

- **Phase 0 — Audit (DONE):** Full-stack code review. Output: `docs/PDR-AUDIT-2026.md` with 23 findings (4 Critical, 4 High, 8 Medium, 7 Low), 8 n8n automation proposals, and a 20-task action plan.
- **Phase 1 — Correctness & Security:** Close all C and H bugs. 10 tasks. Gate: all Critical and High items resolved and manually verified.
- **Phase 2 — Performance, UX & Automation:** Refactor hot-path queries, add missing validation, wire up n8n workflows, add DB indexes. 10 tasks.

---

## Tasks Checklist

### Phase 1 — Correctness & Security

- [ ] **P1-1** Add `authenticate` middleware to `/api/functions` router (`server/src/routes/functions.ts:34`)
  - Any unauthenticated request to `/api/functions/*` → 401
- [ ] **P1-2** Add `authenticate` to legacy routes in `index.ts` (dashboardnotes, featuredocumentations, orderitems, withdrawalitems) (`server/src/routes/index.ts:80+`)
  - All write routes require valid JWT; reads also gated
- [ ] **P1-3** Fix `markOrdered` status transition (`server/src/services/orderService.ts:236`)
  - Change `OrderStatus.APPROVED` → `OrderStatus.PENDING_SAP`
- [ ] **P1-4** Replace `count()+1` withdrawal-number generation with a DB sequence (`server/src/routes/withdrawals.ts:262`)
  - No duplicate `WD-NNNNNN` under concurrent load
- [ ] **P1-5** Same fix for Order and Shipment number generation
  - Same atomicity guarantee for `OR-` and `SH-` prefixes
- [ ] **P1-6** Wrap delivery `/receive` handler in `prisma.$transaction()` (`server/src/routes/deliveries.ts:279-345`)
  - Partial failure rolls back; no orphan batches or mismatched totals
- [ ] **P1-7** Wire FrameworkOrderItem balance updates into withdrawal-complete and delivery-receive
  - On withdrawal completion: `consumedQuantity += fulfilledQty`, `availableQuantity -= fulfilledQty`
  - On delivery receive (when linked to framework order): same logic
- [ ] **P1-8** Recompute `currentStockStatus` and `monthsOfStock` inside `updateReagentAggregates` (`server/src/services/orderService.ts:504`)
  - Formula: `monthsOfStock = totalQuantity / (manualMonthlyUsage || averageMonthlyUsage || 1)`
  - `currentStockStatus` derived from thresholds (NORMAL / LOW / CRITICAL / OUT_OF_STOCK)
- [ ] **P1-9** Auto-create Delivery record on withdrawal completion (`server/src/routes/withdrawals.ts:598`)
  - New `Delivery` (status NEW) + `DeliveryItem`s linked to the withdrawal
- [ ] **P1-10** Reject missing/invalid `expiryDate` in batch POST (`server/src/routes/batches.ts:105`)
  - Return 400 instead of silently defaulting to +100 years

### Phase 2 — Performance, UX & Automation

- [ ] **P2-1** Refactor `orderService.getAll` / `getById` — replace N+1 loops with Prisma `include`
- [ ] **P2-2** Refactor `dashboardService.getLowStockReagents` — use `include` for supplier
- [ ] **P2-3** Add `validateBody(batchCreateSchema)` to `batches.ts` POST; handle field aliases in Zod
- [ ] **P2-4** Fix dead ternary at `functions.ts:163` — distinguish `with_order` vs `standalone` delivery type
- [ ] **P2-5** Fix invalid `PENDING` status in withdrawal query at `functions.ts:1498` → use `SUBMITTED`
- [ ] **P2-6** Add DB indexes: `ReagentBatch.expiryDate`, `Order.status`, `WithdrawalRequest.frameworkOrderId`, `Reagent.currentStockStatus`
- [ ] **P2-7** Add "on-order" quantity indicator to Dashboard (sum of open-order quantities per reagent)
- [ ] **P2-8** Add rate limiting (`express-rate-limit`) to all POST/PUT/DELETE routes
- [ ] **P2-9** Evaluate and optionally add `Manufacturer` model to schema
- [ ] **P2-10** Set up n8n workflows: expiry-alert sweep (daily) + replenishment suggestion (daily)

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Unauthenticated write endpoints exploited before fix | Data corruption, unauthorized orders/withdrawals | High (exposed now) | P1-1 and P1-2 are first tasks |
| Concurrent number generation produces duplicates | Duplicate WD/OR/SH numbers, reconciliation failures | Medium (race window) | Replace with DB sequences (P1-4, P1-5) |
| Framework-order overspend undetected | Budget overruns, audit failures | High (balance never checked) | P1-7 wires the balance; add UI validation in Phase 2 |
| Partial delivery receive leaves orphan batches | Stock count inaccurate | Medium (requires failure during multi-insert) | P1-6 wraps in transaction |
| Dashboard low-stock card shows stale data | Missed replenishment, stockouts | High (always stale today) | P1-8 recomputes on every aggregate update |
| n8n workflows fail silently | Missed alerts, missed replenishments | Low (after initial setup) | Use n8n built-in retry + error-notification nodes |

---

## Credential & Secret Notes

- JWT secret: stored in `server/.env` as `JWT_SECRET`
- Database: `DATABASE_URL` in `server/.env`
- No secrets in code or committed files (verified in audit)
- n8n credentials stored in n8n credential store only

---

## Next Steps (ordered)

1. Pick up **P1-1** and **P1-2** first — close the authentication gaps immediately.
2. Then **P1-3** (markOrdered fix) — single-line change, high impact.
3. Then **P1-4 + P1-5** (sequence-based numbering) — requires a Prisma migration.
4. Then **P1-6** (transaction wrapper) — single function refactor.
5. Then **P1-7 + P1-8** (balance + stock-status logic) — largest Phase 1 item; test thoroughly.
6. Then **P1-9** (auto Delivery on withdrawal complete).
7. Then **P1-10** (expiry validation).
8. Gate review: verify all Phase 1 items, run manual smoke test on full order + withdrawal cycle.
9. Begin Phase 2 tasks in order listed.
10. After P2-10: schedule n8n workflows and monitor for 48 h before sign-off.

---

*This file is the source of truth for AI-assisted work on Flow Control.*
*Full audit findings and code references: `docs/PDR-AUDIT-2026.md`*
