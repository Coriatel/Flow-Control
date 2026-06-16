# Flow Control — Screens & Features Catalog

> **Audience:** engineers and AI agents.
> **Source:** live frontend at `/opt/flow-control/app/src` (routing `src/pages/index.jsx`, shell `src/pages/Layout.jsx`, ~55 page files).
> **Companion:** `FLOW_CONTROL_SPEC.md` (business logic, data model, API).
> **Last reconciled:** 2026-06-16.

The app is a **Hebrew RTL** single-page app with a collapsible sidebar shell, a screen-search box, quick-action shortcuts, accordion menu groups (persisted to `localStorage`), back-button navigation history, and a per-user security monitor. Every non-public route is wrapped in `ProtectedRoute` (authenticated-only; **no per-route role check** — see Roles).

---

## 1. Navigation & menu structure (as the user sees it)

**Quick shortcuts (top of sidebar):**
- **הכנסה למלאי** (Stock-in) → `NewDelivery`
- **הוצאה מהמלאי** (Stock-out) → 4 presets deep-linking `InventoryRemoval?preset=` : usage / shipment / destroy / other

**Accordion groups (workflow-frequency order):**
- 🏠 **בית** — Dashboard (מרכז הבקרה)
- ⚡ **פעולות יומיות** — NewDelivery, Deliveries, InventoryCount, NewWithdrawalRequest, WithdrawalRequests, DispenseItems, InventoryRemoval, ItemsInUse
- 📦 **ניהול מלאי** — BatchAndExpiryManagement, UsageDataManagement, InventoryReplenishment
- 🛒 **רכש ודרישות** — NewOrder, Orders, SupplyTracking
- 🚚 **משלוחים יוצאים** — NewShipment, OutgoingShipments
- 🔬 **בקרת איכות** — QualityAssurance, UploadCOA
- 📊 **דוחות ומעקב** — Reports, ActivityLog, AlertsManagement, Messages, DashboardNotes
- ⚙️ **נתונים ראשיים** — ManageReagents, ManageSuppliers
- 👥 **אנשי קשר** — Contacts, ImportContacts
- 📄 **מסמכי מערכת** — SystemDocumentation
- ⚙️ **ניהול מתקדם** *(rendered only when `user.role === "admin"`)* — SystemSettings, SystemManagement, AdminPanel

---

## 2. End-user screen inventory

| Screen (Hebrew) | Route | Purpose | Key actions |
|---|---|---|---|
| מרכז הבקרה / Dashboard | `/`, `/Dashboard` | Operational command center | Expiry calendar (90d), low-stock, supplies-in-transit, order recommendations, critical actions, messages, recent activity, deep-link into all flows |
| קליטת משלוח / NewDelivery | `/NewDelivery` | Receive supplier delivery (stock-in) | Line items, supplier, batch#/expiry/price/qty (capped to outstanding), **barcode scan (GS1 lot/expiry)**, auto-prefill from linked order/withdrawal |
| משלוחים שהתקבלו / Deliveries | `/Deliveries` | Incoming deliveries register | Search/filter, view, export, drill to EditDelivery |
| EditDelivery | `/EditDelivery` | Edit/process/delete delivery | **Process → create batches & update inventory**, save, delete |
| ספירת מלאי / InventoryCount | `/InventoryCount` | Physical stock count | Draft + submit, per-batch counted qty, history, single-count details |
| משיכת ריאגנטים / NewWithdrawalRequest | `/NewWithdrawalRequest` | Withdrawal against a framework agreement | Select framework, add items, auto withdrawal#, submit |
| ניהול בקשות משיכה / WithdrawalRequests | `/WithdrawalRequests` | Manage withdrawals | Search/filter (status, urgency), drill to edit |
| EditWithdrawalRequest | `/EditWithdrawalRequest` | Edit a withdrawal | Edit items, status changes |
| הוצאה מהמלאי / DispenseItems | `/DispenseItems` | Scan-and-dispense out of stock | **Scan/type batch# or barcode**, search, confirm dispense + reason + notes |
| הוצאה מאוחדת / InventoryRemoval | `/InventoryRemoval` | Unified removal (usage/shipment/destroy/other) | Scan/search batch, pick reason, waste%, qty, notes (preset-driven) |
| פריטים בשימוש / ItemsInUse | `/ItemsInUse` | Track partially-opened items | Partial disposal (reason+detail), return-to-stock (**admin-only**) |
| ניהול אצוות ופגי תוקף / BatchAndExpiryManagement | `/BatchAndExpiryManagement` | Master batch & expiry console (flagship) | Search/filter, dispense/withdraw/destroy per batch, qty + handling notes, expiring-soon deep-links |
| ניהול נתוני צריכה / UsageDataManagement | `/UsageDataManagement` | Consumption data (manual vs auto) | View/edit manual & auto consumption, consumption status |
| חישוב השלמות מלאי / InventoryReplenishment | `/InventoryReplenishment` | Replenishment calc & recommendations | Calc replenishment, **create automatic order / withdrawal** |
| הקמת מסמך רכש חדש / NewOrder | `/NewOrder` | Create a requisition (דרישת רכש) | Supplier, catalog search, add items, notes, submit |
| ניהול דרישות רכש / Orders | `/Orders` | Manage requisitions | Search/filter, SAP PO/req numbers, status transitions, drill to edit |
| EditOrder | `/EditOrder` | Edit a requisition | SAP PO#, requisition#, edit items, save |
| מעקב אספקות / SupplyTracking | `/SupplyTracking` | Track supplies in transit | Search/filter, aggregated order+withdrawal pipeline |
| שליחת ריאגנטים / NewShipment | `/NewShipment` | Create outgoing shipment | Type, recipient (supplier-return / external), items, instructions, link source |
| ניהול משלוחים יוצאים / OutgoingShipments | `/OutgoingShipments` | Manage outgoing shipments | Search/filter, drill to edit, delete |
| EditShipment | `/EditShipment` | Edit/approve a shipment | Edit instructions/notes, approval, save |
| בקרת איכות / QualityAssurance | `/QualityAssurance` | Batch QA report & control | Search batches, QA actions, COA review |
| העלאת תעודות אנליזה / UploadCOA | `/UploadCOA` | Upload COA documents | Upload by delivery doc or batch |
| דוחות ומעקב / Reports | `/Reports` | Reports & analytics | Analytics & trends, traditional reports, export |
| יומן פעילות / ActivityLog | `/ActivityLog` | Aggregated audit log | Search activity |
| התראות ותזכורות / AlertsManagement | `/AlertsManagement` | Alerts & reminders center | Active alerts, alert rules (CRUD), annual reminders, settings |
| הודעות / Messages | `/Messages` | Internal messaging | All/unread/alerts; **send gated to admin/manager** |
| הערות ומשימות / DashboardNotes | `/DashboardNotes` | Notes & tasks board | Create/edit notes (priority, tags), search, filter |
| ניהול ריאגנטים / ManageReagents | `/ManageReagents` | Reagent master-data list | Search/filter, view/edit, drill to edit/new |
| הוספת ריאגנטים / NewReagent | `/NewReagent` | Add reagent(s) | Single-add or **file import**, auto-SKU |
| EditReagent | `/EditReagent` | Edit a reagent | Edit fields, storage, change supplier, delete |
| EditReagentBatch | `/EditReagentBatch` | Edit a batch (אצווה) | Edit batch fields/expiry/qty |
| ניהול ספקים / ManageSuppliers | `/ManageSuppliers` | Supplier master-data | Search/filter, CRUD (incl. website) |
| אנשי קשר / Contacts | `/Contacts` | Contact directory | Search/filter, CRUD contacts |
| קליטת אנשי קשר מקובץ / ImportContacts | `/ImportContacts` | Bulk-import contacts | Upload file, map/validate |
| ניהול תיעוד מערכת / SystemDocumentation | `/SystemDocumentation` | Documentation manager | Search/create/edit docs, export |

## 3. Admin / system screens
| Screen | Route | Purpose |
|---|---|---|
| הגדרות מערכת / SystemSettings | `/SystemSettings` | Branding (header/logo), batch-entry method (barcode/inference/manual), manual-entry policy, consumption source |
| ניהול מערכת / SystemManagement | `/SystemManagement` | Data ops, export & archive, **destructive catalog reset** (double-confirm) |
| פאנל ניהול מתקדם / AdminPanel | `/AdminPanel` | Admin landing (user mgmt, security — informational) |
| הגדרות אבטחה / SecuritySettings | `/SecuritySettings` | Per-device security posture (level, auto-logout, screenshot/devtools blocking) |
| מציג הארכיון / ArchivedDataViewer | `/ArchivedDataViewer` | View archived data (**hard admin gate**) |

**Dev/internal (URL-only, not in menu):** `BatchAndExpiryTechnicalSpec`, `CodeAnalysis`, `DevelopmentStrategy`, `TechnicalSpecs` (read-only spec docs).
**Unrouted/dead files:** `BackendManagement`, `CleanupData`, `QuickCleanup`, `FixReagents`, `SystemAnalysis`, `PerformanceAnalysis`, `TestingStrategy`. `processCompletedCount.jsx` is a helper module, not a screen.

---

## 4. Feature catalog by domain

- **Dashboard** — expiry calendar (90d), low-stock (months-of-stock coloring), supplies-in-transit, order recommendations, critical actions, messages feed, recent activity, mobile alerts, manual refresh.
- **Inventory** — physical count (draft/submit + history + reconciliation), replenishment calc with auto-order/auto-withdrawal generation, unified removal (usage/shipment/destroy/other + waste%), partially-used item tracking with return-to-stock & partial disposal.
- **Reagents (master data)** — catalog CRUD, single-add or file import, auto-SKU, storage location, "requires batch" flag, supplier change.
- **Batches / Expiry** — batch lifecycle, expiry tracking, destroy/withdraw/dispense per batch, expiry calendar, expiring-soon filters.
- **Procurement / Requisitions** — requisitions (דרישת רכש) with SAP PO / requisition# tracking, status machine, supplier catalog selection; framework agreements.
- **Withdrawals / Dispense** — framework withdrawal requests (urgency, status), scan-based dispensing (reason + notes, scan method).
- **Deliveries (incoming)** — receive → create batches & update inventory; auto-prefill from linked order/withdrawal; barcode/GS1 scan; per-line qty cap; process & delete.
- **Shipments (outgoing)** — to suppliers (returns) or external recipients, special instructions, link to source, approval, delete.
- **Quality Assurance / COA** — batch QA review, COA upload (by delivery or batch), COA accessibility check.
- **Suppliers / Contacts** — supplier CRUD, supplier-contact directory CRUD, bulk import.
- **Reports / Analytics** — advanced analytics & trends + traditional reports, aggregated activity/audit log.
- **Alerts / Messages / Notes** — configurable alert rules + active alerts + annual reminders; internal messaging; notes/tasks board.
- **Admin / System / Settings** — branding, batch-entry/manual-entry/consumption-source config, data export/archive, destructive catalog reset, security posture, archive viewer, documentation manager.

---

## 5. Roles & permission model

- **Roles:** `ADMIN`, `MANAGER`, `USER`, `READONLY`.
- **Auth:** JWT + refresh-cookie + Google OAuth; registration is **admin-approval-gated** (new accounts created inactive).
- **Reality of enforcement:** route protection is **binary** (authenticated-only); real role enforcement lives on **write/sensitive backend endpoints** via `authorize(...)` and a few in-page checks. The **Advanced admin** menu group is admin-only; `ArchivedDataViewer` hard-redirects non-admins; `Messages` send is admin/manager-only; `ItemsInUse` return-to-stock is admin-only.
- **Known issue:** role casing is inconsistent (`admin`/`ADMIN`, `manager`/`MANAGER`); effective live model ≈ **admin vs authenticated user**. Hardening RBAC is a recommended task.

---

## 6. Cross-cutting capabilities

- **Barcode / scanning (first-class):** `html5-qrcode` camera scanning; **GS1 parsing** extracts lot + expiry; wired into NewDelivery, DispenseItems, InventoryRemoval, BatchAndExpiryManagement; per-supplier `BarcodeFormat` decode config; batch-entry method configurable (barcode/inference/manual).
- **Mobile:** responsive RTL throughout, slide-in mobile menu, mobile-first dashboard ordering. No native app / PWA.
- **RTL / i18n:** fully Hebrew, hard-coded `dir="rtl"`, logical CSS, Hebrew date locale. **No translation layer** (Hebrew strings inline) — not multi-language yet.
- **Security UX:** per-user device fingerprint; per-device security posture (security level, auto-logout, screenshot/background-blur/devtools blocking); system-lock overlay primitive.
- **Multi-site:** none (single-facility). **Offline:** none (live backend fetch; `localStorage`/`sessionStorage` only for UI state).
