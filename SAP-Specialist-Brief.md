# Flow Control — SAP Specialist Brief

## What This Document Is

This document describes **Flow Control**, a blood bank / laboratory reagent inventory management system currently running as a custom web app. The goal is to help a SAP specialist understand the business processes, data model, and workflows so they can design an equivalent (or better) solution within SAP.

Flow Control is used by a blood bank to manage reagent inventory end-to-end: from procurement through receiving, storage, dispensing, expiry tracking, quality assurance, and reporting.

---

## 1. Core Business Entities

### 1.1 Reagent Catalog (Master Data)

Each reagent is a catalog item with:
- Name, catalog number, category (Reagent / Cells / Consumable)
- Linked to a preferred supplier
- Auto-calculated aggregates: total quantity, active batch count, nearest expiry date, months of stock remaining, stock status (Normal / Low / Critical / Out of Stock)
- Average monthly usage (auto-calculated from transactions) + manual override option
- Flag: `requiresBatches` (some consumables don't need batch tracking)

**SAP equivalent**: Material Master (MM01) with MRP views, batch management flag.

### 1.2 Suppliers

- Supplier master data: name, short code, address, phone, email, website
- Default currency, payment terms, lead time in days, preferred flag
- Multiple contacts per supplier (name, role, phone, email, primary flag)

**SAP equivalent**: Vendor Master (XK01/BP).

### 1.3 Batches

Each reagent can have multiple batches. A batch tracks:
- Batch number, manufacture date, expiry date
- Initial quantity, current quantity, reserved quantity
- Storage location, storage conditions
- Status lifecycle: `INCOMING` -> `ACTIVE` -> `EXPIRED` / `CONSUMED` / `ON_HOLD` / `DESTROYED` / `IN_USE`
- QC status: `PENDING` / `APPROVED` / `REJECTED` / `REQUIRES_REVIEW`
- Certificate of Analysis (COA) document URL
- Link back to which delivery brought it in

**SAP equivalent**: Batch Master (MSC1N) with batch classification, shelf life, QM inspection lot.

---

## 2. Procurement Workflow

### 2.1 Immediate Orders (One-Time Purchase)

Status flow:
```
DRAFT -> PENDING_SAP -> APPROVED -> PARTIALLY_RECEIVED -> FULLY_RECEIVED -> CLOSED
```

An order contains:
- Supplier, order date, expected delivery window (start/end dates)
- Line items: reagent, requested qty, approved qty, received qty, unit price
- Auto-generated temporary number; permanent SAP number added later

**Current SAP integration point**: The system has a `sapPurchaseOrder` field and a `PENDING_SAP` status, meaning someone manually enters the order into SAP and updates the status. This is a key area where real SAP integration would eliminate double entry.

**SAP equivalent**: Purchase Requisition (ME51N) -> Purchase Order (ME21N).

### 2.2 Framework Orders (Blanket / Contract Orders)

A framework order is a long-term agreement with:
- Validity period (from/to dates)
- Maximum total quantity allowed
- Per-reagent allocated and consumed quantities

Against a framework order, the lab creates **Withdrawal Requests**:
```
DRAFT -> SUBMITTED -> APPROVED -> SHIPPING -> CLOSED
```

Each withdrawal request:
- References the parent framework order
- Contains line items: reagent, requested qty, approved qty, fulfilled qty
- Eventually fulfilled by a delivery

**SAP equivalent**: Outline Agreement / Contract (ME31K) with Schedule Lines or Scheduling Agreements. Withdrawal requests = Release Orders or Call-offs against the contract.

### 2.3 Smart Replenishment Calculator

The system auto-calculates what to order based on:
- **Effective monthly usage** = manual override or calculated average
- **Planning horizon** (configurable, e.g. 12 weeks)
- **Safety stock** = 2 weeks of usage
- **Net requirement** = (planning months x monthly usage) + safety stock - current stock - in-transit quantities
- In-transit = quantities from approved orders + pending withdrawal requests
- Near-expiry batches are subtracted from usable stock

One-click auto-creates either an order (for immediate purchase) or a withdrawal request (against a framework order).

**SAP equivalent**: MRP Run (MD01/MD02) with safety stock, reorder point, planned delivery time. The custom logic here is relatively standard MRP but with blood-bank-specific near-expiry deductions.

---

## 3. Receiving / Incoming Deliveries

When a shipment arrives at the blood bank:
1. User creates a Delivery record, links it to the originating Order or Withdrawal Request
2. Adds line items: reagent, batch number, quantity, expiry date
3. System auto-creates new `ReagentBatch` records for each batch received
4. System creates `InventoryTransaction` (type: RECEIPT) for audit trail
5. Reagent aggregate fields recalculated (total qty, stock status, etc.)
6. Certificate of Analysis (COA) can be uploaded and linked to batches

Delivery statuses: `NEW` -> `PROCESSING` -> `COMPLETED`

**SAP equivalent**: Goods Receipt (MIGO) against PO, with batch creation and QM integration.

---

## 4. Dispensing & Items-In-Use (Blood Bank Specific)

This is the most **domain-specific** workflow and likely requires custom development in SAP.

### 4.1 Dispensing from Inventory

When a technician needs a reagent:
1. **Scan barcode** (GS1-128, QR, DataMatrix, Code128, EAN-13) or search manually
2. System parses the barcode to extract lot number, expiry, catalog number
3. Matches to an ACTIVE batch in inventory
4. Technician confirms quantity and purpose
5. System deducts from batch quantity, creates `DispenseEvent` + `InventoryTransaction` (CONSUMPTION)
6. When batch quantity reaches 0, status changes from `ACTIVE` to `IN_USE`

### 4.2 Items Currently In Use

A dispensed reagent doesn't disappear -- it moves to "In Use" state because:
- Reagents in a blood bank are often opened and used over days/weeks
- Expiry must still be tracked while in use
- Alerts fire for items that expire while in active use

### 4.3 Partial Disposal

When an in-use item is partially or fully wasted:
- Record disposal as fraction: 25%, 50%, 75%, or 100%
- Reason: expired in use, contaminated, damaged, other
- 100% disposal marks the batch as `DESTROYED`

### 4.4 Return to Inventory

Admin can reverse a dispense (return an in-use batch back to ACTIVE inventory).

**SAP equivalent**: This could be modeled as Goods Issue (MB1A) for dispensing, with a custom Z-table or QM Usage Decision for in-use tracking. The partial disposal could be a Scrapping movement type. The barcode scanning would need a Fiori app with camera integration.

---

## 5. Outgoing Shipments

The blood bank ships reagents to hospitals/departments:
- Create shipment with destination hospital + department
- Add items: reagent, optional specific batch, quantity
- Status: `DRAFT` -> `SENT` -> `RECEIVED` / `CANCELLED`
- Each shipment deducts from inventory

**SAP equivalent**: Delivery / Goods Issue (VL01N or MB1A with movement type for transfer posting).

---

## 6. Physical Inventory Count

1. System creates/retrieves a count draft
2. All reagents with ACTIVE batches listed
3. User enters counted quantity per batch (can add new unlisted batches)
4. Save as draft (persists across sessions)
5. Complete count: adjusts all batch quantities to counted values, creates ADJUSTMENT transactions, archives results
6. History tab shows all past counts

**SAP equivalent**: Physical Inventory Document (MI01) -> Count Entry (MI04) -> Post Differences (MI07). Batch-level counting with variance tracking.

---

## 7. Quality Assurance

- Every batch has a QC status: `PENDING` / `APPROVED` / `REJECTED` / `REQUIRES_REVIEW`
- QA screen shows all batches with inline editing
- Certificate of Analysis (COA) documents uploaded per batch or per delivery
- Alert rules can flag batches missing COA

**SAP equivalent**: QM Inspection Lot (QA01), Usage Decision (QA11), with document management (DMS) for COA files.

---

## 8. Alerts & Notifications System

Configurable alert rules with types:

| Alert Type | Trigger |
|---|---|
| EXPIRY_WARNING | Batch expiring within N days |
| LOW_STOCK | Reagent has < N months of stock |
| COA_MISSING | Active batch without COA document |
| EXPIRED_IN_USE | In-use item expired > N days ago |
| PENDING_SUPPLY | Order/withdrawal pending > N days |
| COUNT_REQUIRED | No physical count in > N days |

Alerts have severity (LOW/MEDIUM/HIGH/CRITICAL) and workflow: `NEW` -> `IN_PROGRESS` -> `RESOLVED` / `DISMISSED`.

**SAP equivalent**: Exception messages in MRP, custom workflows (SAP Business Workflow), or SAP Alert Management. Many of these are standard MRP exception messages (shelf life expiry, below safety stock, overdue PO).

---

## 9. Reporting & Audit Trail

### Reports
- Inventory value and quantity over time (line/area charts)
- Consumption trends by reagent and category
- Expiry distribution analysis
- Supplier delivery performance
- CSV export capability

### Activity Log (Full Audit Trail)
Every action logged with:
- User, timestamp, action type, entity type/ID
- IP address, user agent
- Full JSON details of what changed

**SAP equivalent**: Standard SAP reporting (MB52 for stock, ME2M for POs, etc.) + Change Documents + custom ALV reports. Audit trail via SAP Change Document objects.

---

## 10. Barcode Configuration (Per-Supplier)

Different suppliers use different barcode formats. The system supports:
- GS1-128 with Application Identifiers (lot, expiry, GTIN, quantity, serial)
- QR codes and DataMatrix
- Custom regex patterns per supplier stored in database
- Admin UI to create, test, and manage barcode decode rules

**SAP equivalent**: Would need custom Fiori app with barcode parsing. SAP has standard GS1 barcode handling in EWM/WM, but blood bank reagent barcodes often have non-standard formats that require the per-supplier regex approach.

---

## 11. User Roles & Security

| Role | Permissions |
|---|---|
| ADMIN | Full access, user management, return items to inventory |
| MANAGER | Most operations, approve orders/withdrawals |
| USER | Daily operations (receive, dispense, count, etc.) |
| READONLY | View-only access |

**SAP equivalent**: SAP Authorization Objects and Roles (PFCG).

---

## 12. Dashboard (Command Center)

The dashboard provides at-a-glance status:
- **Critical Actions**: auto-generated alerts for items expiring today, critical stock levels, overdue inventory counts
- **4 Info Cards**: expiring reagents, low stock, in-transit supplies, pending purchase orders
- **Notes & Tasks**: persistent sticky notes with priority and direct links to relevant pages
- **Recent Activity**: last actions taken in the system

Each item is clickable and navigates to the relevant fix/action page.

**SAP equivalent**: SAP Fiori Launchpad with Overview Pages (OVP) or Analytical Apps.

---

## 13. Data Volumes (Current)

This is a small-to-medium operation:
- ~50-100 reagent catalog items
- ~200-500 active batches at any time
- ~10-20 suppliers
- ~5-10 orders per month
- ~50-100 dispense events per month
- ~1 physical count per month

---

## 14. Key Questions for SAP Specialist

1. **Batch Management**: SAP has standard batch management. Can it handle the `IN_USE` intermediate state (dispensed but not yet consumed/destroyed)?

2. **Framework Orders + Withdrawals**: Can SAP Contracts/Scheduling Agreements model the withdrawal request workflow with approval steps?

3. **Barcode Scanning**: What's the best approach for a Fiori app with camera-based barcode scanning that supports GS1 + custom per-supplier formats?

4. **Dispensing Workflow**: Standard Goods Issue (MB1A) doesn't track "in use" state. Options:
   - Custom movement types + batch status management?
   - QM inspection lot for in-use tracking?
   - Custom Z-table approach?

5. **Partial Disposal**: How to record fractional waste (25/50/75/100%) of a dispensed item?

6. **Replenishment**: Can standard MRP handle the near-expiry deduction from usable stock?

7. **COA Document Management**: DMS integration for Certificate of Analysis per batch?

8. **Alerts**: Which SAP alerting mechanism best fits: MRP exception messages, Business Workflow, or custom alert framework?

9. **Dashboard**: Fiori OVP app or custom Fiori Elements analytical page?

10. **Migration**: The current system has full API access. Data can be exported to CSV/JSON for migration to SAP master data.

---

## 15. Summary: What Makes This System Unique

The standard SAP MM/QM/WM modules cover ~70% of this system's functionality. The remaining ~30% is blood-bank-specific:

1. **Dispense -> In-Use -> Partial Disposal** lifecycle (not standard goods issue)
2. **Per-supplier barcode decode rules** with regex patterns
3. **Smart replenishment with near-expiry deduction**
4. **Framework order withdrawal request workflow** with approval chain
5. **Real-time dashboard with clickable critical actions**

These areas will need custom development in SAP (ABAP/Fiori) or integration with external tools.
