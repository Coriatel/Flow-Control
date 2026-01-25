# Flow Control - Detailed Test Cases

**Project**: Flow Control (Blood Bank Inventory Management System)
**Last Updated**: 2026-01-20

---

## Table of Contents

1. [Authentication Test Cases](#1-authentication-test-cases)
2. [Supplier Test Cases](#2-supplier-test-cases)
3. [Reagent Test Cases](#3-reagent-test-cases)
4. [Batch Test Cases](#4-batch-test-cases)
5. [Order Test Cases](#5-order-test-cases)
6. [Delivery Test Cases](#6-delivery-test-cases)
7. [Withdrawal Test Cases](#7-withdrawal-test-cases)
8. [Shipment Test Cases](#8-shipment-test-cases)
9. [Inventory Test Cases](#9-inventory-test-cases)
10. [Alert Test Cases](#10-alert-test-cases)
11. [Decimal Precision Test Cases](#11-decimal-precision-test-cases)
12. [RTL/Hebrew Test Cases](#12-rtlhebrew-test-cases)

---

## 1. Authentication Test Cases

### TC-AUTH-001: Valid User Login

**Priority**: Critical
**Type**: Normal Flow

**Preconditions**:
- User exists in database with email `admin@flow.test`
- Password is `Test123!`

**Steps**:
1. POST `/api/auth/login`
2. Body: `{ "email": "admin@flow.test", "password": "Test123!" }`

**Expected Results**:
- Status: 200
- Response contains `accessToken`
- Response contains `user` object with `id`, `email`, `name`, `role`
- Token is valid JWT

**Test Data**:
```json
{
  "email": "admin@flow.test",
  "password": "Test123!"
}
```

---

### TC-AUTH-002: Login with Wrong Password

**Priority**: Critical
**Type**: Edge Case

**Preconditions**:
- User exists with email `admin@flow.test`

**Steps**:
1. POST `/api/auth/login`
2. Body: `{ "email": "admin@flow.test", "password": "WrongPassword123!" }`

**Expected Results**:
- Status: 401
- Error message in Hebrew: "אימייל או סיסמה שגויים"
- No token returned

---

### TC-AUTH-003: Login with Non-existent User

**Priority**: High
**Type**: Edge Case

**Steps**:
1. POST `/api/auth/login`
2. Body: `{ "email": "nonexistent@flow.test", "password": "Test123!" }`

**Expected Results**:
- Status: 401
- Generic error message (don't reveal if user exists)

---

### TC-AUTH-004: Login with Inactive User

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- User exists with `isActive: false`

**Steps**:
1. POST `/api/auth/login`
2. Use inactive user credentials

**Expected Results**:
- Status: 401 or 403
- Message indicates account is disabled

---

### TC-AUTH-005: Rate Limiting - Exceed Attempts

**Priority**: High
**Type**: Extreme

**Steps**:
1. Send 100 login requests in rapid succession
2. Same IP address

**Expected Results**:
- After threshold (e.g., 100 requests in 15 min), return 429
- Error message: "Too many requests"

---

### TC-AUTH-006: SQL Injection Attempt

**Priority**: Critical
**Type**: Security

**Steps**:
1. POST `/api/auth/login`
2. Body: `{ "email": "'; DROP TABLE users; --", "password": "test" }`

**Expected Results**:
- Status: 400
- Email validation error
- No database modification

---

### TC-AUTH-007: Valid User Registration

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/auth/register`
2. Body:
```json
{
  "email": "newuser@flow.test",
  "name": "משתמש חדש",
  "password": "NewUser123!"
}
```

**Expected Results**:
- Status: 201
- User created in database
- Password is hashed (not plain text)

---

### TC-AUTH-008: Registration with Duplicate Email

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- User with email `admin@flow.test` exists

**Steps**:
1. POST `/api/auth/register`
2. Body: `{ "email": "admin@flow.test", "name": "Test", "password": "Test123!" }`

**Expected Results**:
- Status: 409
- Error: "Email already registered"

---

### TC-AUTH-009: Registration with Weak Password

**Priority**: High
**Type**: Edge Case

**Steps**:
1. POST `/api/auth/register`
2. Body: `{ "email": "weak@flow.test", "name": "Test", "password": "123" }`

**Expected Results**:
- Status: 400
- Validation error for password requirements

---

### TC-AUTH-010: Access Protected Route Without Token

**Priority**: Critical
**Type**: Security

**Steps**:
1. GET `/api/reagents`
2. No Authorization header

**Expected Results**:
- Status: 401
- Error: "Authentication required"

---

### TC-AUTH-011: Access with Expired Token

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Generate token with very short expiry (already expired)

**Steps**:
1. GET `/api/reagents`
2. Authorization: `Bearer <expired-token>`

**Expected Results**:
- Status: 401
- Error: "Token expired"

---

### TC-AUTH-012: Admin Route as Regular User

**Priority**: Critical
**Type**: Security

**Preconditions**:
- Login as user with role `USER`

**Steps**:
1. GET `/api/users` (admin-only endpoint)
2. Authorization: Bearer token of USER role

**Expected Results**:
- Status: 403
- Error: "Forbidden - insufficient permissions"

---

## 2. Supplier Test Cases

### TC-SUP-001: List All Active Suppliers

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. GET `/api/suppliers`
2. With valid auth token

**Expected Results**:
- Status: 200
- Array of supplier objects
- Only active suppliers returned by default

---

### TC-SUP-002: Create New Supplier

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/suppliers`
2. Body:
```json
{
  "name": "Test Supplier Ltd",
  "shortCode": "TST",
  "defaultCurrency": "USD",
  "isPreferred": false,
  "leadTimeDays": 14
}
```

**Expected Results**:
- Status: 201
- Supplier created with ID
- All fields persisted

---

### TC-SUP-003: Create Supplier with Duplicate Name

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Supplier "Bio-Rad Laboratories" exists

**Steps**:
1. POST `/api/suppliers`
2. Body: `{ "name": "Bio-Rad Laboratories", ... }`

**Expected Results**:
- Status: 409
- Error: "Supplier name already exists"

---

### TC-SUP-004: Create Supplier with Hebrew Name

**Priority**: Medium
**Type**: Edge Case

**Steps**:
1. POST `/api/suppliers`
2. Body: `{ "name": "ספק בדיקות בע\"מ", "shortCode": "SBD" }`

**Expected Results**:
- Status: 201
- Hebrew name stored correctly
- Displays correctly in UI

---

### TC-SUP-005: Add Contact to Supplier

**Priority**: High
**Type**: Normal Flow

**Preconditions**:
- Supplier exists with ID

**Steps**:
1. POST `/api/suppliers/:id/contacts`
2. Body:
```json
{
  "name": "John Doe",
  "role": "Sales Manager",
  "phone": "+1-555-1234",
  "email": "john@supplier.test",
  "isPrimary": true
}
```

**Expected Results**:
- Status: 201
- Contact created and linked to supplier
- If isPrimary true, other contacts set to false

---

### TC-SUP-006: Set Primary Contact

**Priority**: Medium
**Type**: Normal Flow

**Preconditions**:
- Supplier has multiple contacts
- One contact is currently primary

**Steps**:
1. PATCH `/api/suppliers/:supplierId/contacts/:contactId`
2. Body: `{ "isPrimary": true }`

**Expected Results**:
- Status: 200
- New contact is primary
- Previous primary is now non-primary

---

### TC-SUP-007: Delete Supplier with Dependencies

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Supplier has existing orders/reagents

**Steps**:
1. DELETE `/api/suppliers/:id`

**Expected Results**:
- Status: 400 or soft delete
- Error: "Cannot delete supplier with existing orders"
- Or: Supplier marked as inactive

---

## 3. Reagent Test Cases

### TC-REA-001: List Reagents with Category Filter

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. GET `/api/reagents?category=REAGENT`

**Expected Results**:
- Status: 200
- Only reagents with category REAGENT returned

---

### TC-REA-002: Search Reagents with Hebrew Text

**Priority**: High
**Type**: Edge Case

**Steps**:
1. GET `/api/reagents?search=אנטי`

**Expected Results**:
- Status: 200
- Matches reagents with Hebrew names containing "אנטי"

---

### TC-REA-003: Create Reagent

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/reagents`
2. Body:
```json
{
  "name": "Anti-Fya",
  "catalogNumber": "NEW-001",
  "category": "REAGENT",
  "supplierId": "<valid-supplier-id>",
  "requiresBatches": true
}
```

**Expected Results**:
- Status: 201
- Reagent created with defaults (totalQuantity: 0, etc.)

---

### TC-REA-004: Create Reagent with Duplicate Catalog Number

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Reagent with catalog number "BRD-AA-001" exists

**Steps**:
1. POST `/api/reagents`
2. Body: `{ "catalogNumber": "BRD-AA-001", ... }`

**Expected Results**:
- Status: 409
- Error: "Catalog number already exists"

---

### TC-REA-005: Get Reagents Grouped by Supplier

**Priority**: Medium
**Type**: Normal Flow

**Steps**:
1. GET `/api/reagents/grouped/supplier`

**Expected Results**:
- Status: 200
- Reagents grouped by supplier name
- Each group has supplier info and reagent array

---

## 4. Batch Test Cases

### TC-BAT-001: Create Batch with Valid Data

**Priority**: Critical
**Type**: Normal Flow

**Steps**:
1. POST `/api/batches`
2. Body:
```json
{
  "reagentId": "<valid-reagent-id>",
  "batchNumber": "LOT-2026-00001",
  "expiryDate": "2027-01-20",
  "initialQuantity": 100,
  "receivedDate": "2026-01-20",
  "storageLocation": "Rack A1"
}
```

**Expected Results**:
- Status: 201
- Batch created with status ACTIVE
- currentQuantity equals initialQuantity
- Reagent's totalQuantity updated

---

### TC-BAT-002: Create Batch with Past Expiry Date

**Priority**: High
**Type**: Edge Case

**Steps**:
1. POST `/api/batches`
2. Body: `{ ..., "expiryDate": "2025-01-01" }`

**Expected Results**:
- Status: 400
- Error: "Expiry date must be in the future"

---

### TC-BAT-003: Create Batch with Decimal Quantity (0.25)

**Priority**: High
**Type**: Edge Case - Decimal

**Steps**:
1. POST `/api/batches`
2. Body: `{ ..., "initialQuantity": 10.25 }`

**Expected Results**:
- Status: 201
- Quantity stored as 10.25
- Displays correctly with decimal

---

### TC-BAT-004: Create Batch with Decimal Quantity (0.5)

**Priority**: High
**Type**: Edge Case - Decimal

**Steps**:
1. POST `/api/batches`
2. Body: `{ ..., "initialQuantity": 25.5 }`

**Expected Results**:
- Status: 201
- Quantity stored as 25.5

---

### TC-BAT-005: Create Batch with Decimal Quantity (0.75)

**Priority**: High
**Type**: Edge Case - Decimal

**Steps**:
1. POST `/api/batches`
2. Body: `{ ..., "initialQuantity": 50.75 }`

**Expected Results**:
- Status: 201
- Quantity stored as 50.75

---

### TC-BAT-006: Withdraw Valid Quantity

**Priority**: Critical
**Type**: Normal Flow

**Preconditions**:
- Batch exists with currentQuantity: 50

**Steps**:
1. POST `/api/batches/:id/withdraw`
2. Body: `{ "quantity": 10 }`

**Expected Results**:
- Status: 200
- currentQuantity now 40
- InventoryTransaction created
- Reagent's totalQuantity updated

---

### TC-BAT-007: Withdraw More Than Available

**Priority**: Critical
**Type**: Edge Case

**Preconditions**:
- Batch exists with currentQuantity: 10

**Steps**:
1. POST `/api/batches/:id/withdraw`
2. Body: `{ "quantity": 50 }`

**Expected Results**:
- Status: 400
- Error: "Insufficient quantity"
- No changes made

---

### TC-BAT-008: Withdraw Decimal Quantity (0.25)

**Priority**: High
**Type**: Edge Case - Decimal

**Preconditions**:
- Batch with currentQuantity: 10.5

**Steps**:
1. POST `/api/batches/:id/withdraw`
2. Body: `{ "quantity": 2.25 }`

**Expected Results**:
- Status: 200
- currentQuantity now 8.25

---

### TC-BAT-009: Concurrent Withdrawals (Race Condition)

**Priority**: High
**Type**: Extreme

**Preconditions**:
- Batch with currentQuantity: 10

**Steps**:
1. Simultaneously send two requests:
   - Request A: Withdraw 8
   - Request B: Withdraw 8

**Expected Results**:
- One succeeds, one fails
- Total withdrawal does not exceed 10
- Database integrity maintained

---

### TC-BAT-010: Get Batches Expiring Within 7 Days

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. GET `/api/batches/expiring?days=7`

**Expected Results**:
- Status: 200
- Only batches expiring within 7 days
- Sorted by expiry date ascending

---

### TC-BAT-011: Status Transition ACTIVE to EXPIRED

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. PATCH `/api/batches/:id`
2. Body: `{ "status": "EXPIRED" }`

**Expected Results**:
- Status: 200
- Batch status updated
- Reagent aggregates recalculated

---

## 5. Order Test Cases

### TC-ORD-001: Create IMMEDIATE Order

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/orders`
2. Body:
```json
{
  "supplierId": "<valid-supplier-id>",
  "orderType": "IMMEDIATE",
  "items": [
    { "reagentId": "<id>", "requestedQuantity": 50 }
  ]
}
```

**Expected Results**:
- Status: 201
- Order created with status DRAFT
- tempNumber generated
- Items linked to order

---

### TC-ORD-002: Create Order with Decimal Quantities

**Priority**: High
**Type**: Edge Case - Decimal

**Steps**:
1. POST `/api/orders`
2. Body:
```json
{
  "items": [
    { "reagentId": "<id>", "requestedQuantity": 25.5 },
    { "reagentId": "<id>", "requestedQuantity": 10.25 }
  ]
}
```

**Expected Results**:
- Status: 201
- Quantities stored as decimals
- Total calculated correctly (35.75)

---

### TC-ORD-003: Approve Order (Manager)

**Priority**: High
**Type**: Normal Flow

**Preconditions**:
- Order in DRAFT status
- User has MANAGER role

**Steps**:
1. PATCH `/api/orders/:id/approve`

**Expected Results**:
- Status: 200
- Order status changed to APPROVED
- approvedQuantity set

---

### TC-ORD-004: Approve Order (Non-Manager)

**Priority**: Critical
**Type**: Security

**Preconditions**:
- Order in DRAFT status
- User has USER role

**Steps**:
1. PATCH `/api/orders/:id/approve`

**Expected Results**:
- Status: 403
- Error: "Manager approval required"

---

### TC-ORD-005: Receive Partial Order

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Order with item requesting 50 units

**Steps**:
1. POST `/api/orders/:id/receive`
2. Body: `{ "items": [{ "itemId": "<id>", "receivedQuantity": 25 }] }`

**Expected Results**:
- Status: 200
- Order status: PARTIALLY_RECEIVED
- Item receivedQuantity: 25
- remainingQuantity calculated

---

## 6. Delivery Test Cases

### TC-DEL-001: Create Delivery Linked to Order

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/deliveries`
2. Body:
```json
{
  "supplierId": "<id>",
  "orderId": "<order-id>",
  "deliveryDate": "2026-01-20",
  "items": [
    {
      "reagentId": "<id>",
      "batchNumber": "LOT-NEW-001",
      "quantity": 50,
      "expiryDate": "2027-01-20"
    }
  ]
}
```

**Expected Results**:
- Status: 201
- Delivery created with status NEW
- Linked to order

---

### TC-DEL-002: Process Delivery - Complete

**Priority**: High
**Type**: Normal Flow

**Preconditions**:
- Delivery with status NEW

**Steps**:
1. PATCH `/api/deliveries/:id/process`

**Expected Results**:
- Status: 200
- Status changed to PROCESSING

---

### TC-DEL-003: Receive Delivery Items with Decimal Quantities

**Priority**: High
**Type**: Edge Case - Decimal

**Preconditions**:
- Delivery item with quantity 50.5

**Steps**:
1. POST `/api/deliveries/:id/receive`
2. Body:
```json
{
  "items": [
    {
      "itemId": "<id>",
      "acceptedQuantity": 45.25,
      "rejectedQuantity": 5.25,
      "rejectionReason": "Damaged packaging"
    }
  ]
}
```

**Expected Results**:
- Status: 200
- Quantities match: 45.25 + 5.25 = 50.5
- Batch created with 45.25

---

### TC-DEL-004: Auto-Create Batches on Completion

**Priority**: High
**Type**: Normal Flow

**Preconditions**:
- Delivery completed with items

**Steps**:
1. Complete delivery processing
2. Check batches

**Expected Results**:
- ReagentBatch records created for each item
- Batches linked to delivery
- Reagent totalQuantity updated

---

## 7. Withdrawal Test Cases

### TC-WDR-001: Create Withdrawal Request

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/withdrawals`
2. Body:
```json
{
  "supplierId": "<id>",
  "items": [
    { "reagentId": "<id>", "requestedQuantity": 20 }
  ]
}
```

**Expected Results**:
- Status: 201
- Withdrawal created with status DRAFT
- withdrawalNumber generated

---

### TC-WDR-002: Withdrawal with Framework Order

**Priority**: Medium
**Type**: Normal Flow

**Preconditions**:
- Valid framework order exists

**Steps**:
1. POST `/api/withdrawals`
2. Body: `{ "frameworkOrderId": "<id>", ... }`

**Expected Results**:
- Status: 201
- Linked to framework order
- Framework available quantity checked

---

### TC-WDR-003: Approve Withdrawal with Different Quantity

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Withdrawal with requestedQuantity: 50

**Steps**:
1. PATCH `/api/withdrawals/:id/approve`
2. Body: `{ "items": [{ "itemId": "<id>", "approvedQuantity": 30 }] }`

**Expected Results**:
- Status: 200
- approvedQuantity: 30 (different from requested)

---

### TC-WDR-004: Withdrawal with Decimal Quantities

**Priority**: High
**Type**: Edge Case - Decimal

**Steps**:
1. POST `/api/withdrawals`
2. Body: `{ "items": [{ "reagentId": "<id>", "requestedQuantity": 15.75 }] }`

**Expected Results**:
- Status: 201
- Quantity stored as 15.75

---

## 8. Shipment Test Cases

### TC-SHP-001: Create Shipment with Hebrew Destination

**Priority**: High
**Type**: Edge Case

**Steps**:
1. POST `/api/shipments`
2. Body:
```json
{
  "destinationHospital": "בית חולים שיבא",
  "destinationDepartment": "בנק דם",
  "shipmentDate": "2026-01-20",
  "items": [
    { "reagentId": "<id>", "quantity": 10 }
  ]
}
```

**Expected Results**:
- Status: 201
- Hebrew text stored correctly
- Displays in UI properly

---

### TC-SHP-002: Send Shipment - FIFO Deduction

**Priority**: Critical
**Type**: Normal Flow

**Preconditions**:
- Multiple batches exist for reagent
- Oldest batch expires first

**Steps**:
1. PATCH `/api/shipments/:id/send`

**Expected Results**:
- Status: 200
- Oldest batch (nearest expiry) deducted first
- InventoryTransaction created

---

### TC-SHP-003: Send Shipment - Insufficient Inventory

**Priority**: High
**Type**: Edge Case

**Preconditions**:
- Shipment item requires 100 units
- Only 50 available

**Steps**:
1. PATCH `/api/shipments/:id/send`

**Expected Results**:
- Status: 400
- Error: "Insufficient inventory for shipment"
- No deductions made

---

### TC-SHP-004: Shipment with Specific Batch

**Priority**: Medium
**Type**: Normal Flow

**Steps**:
1. POST `/api/shipments`
2. Body: `{ "items": [{ "reagentId": "<id>", "batchId": "<specific-batch>", "quantity": 10 }] }`

**Expected Results**:
- Status: 201
- Specified batch used (not FIFO)

---

## 9. Inventory Test Cases

### TC-INV-001: Save Count Draft

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. POST `/api/inventory/count/draft`
2. Body:
```json
{
  "entries": [
    { "reagentId": "<id>", "batchNumber": "LOT-001", "countedQuantity": 45 }
  ]
}
```

**Expected Results**:
- Status: 200
- Draft saved with entries
- Can continue editing

---

### TC-INV-002: Save Count with Decimal Quantities

**Priority**: High
**Type**: Edge Case - Decimal

**Steps**:
1. POST `/api/inventory/count/draft`
2. Body:
```json
{
  "entries": [
    { "reagentId": "<id>", "countedQuantity": 25.25 },
    { "reagentId": "<id>", "countedQuantity": 30.5 },
    { "reagentId": "<id>", "countedQuantity": 15.75 }
  ]
}
```

**Expected Results**:
- Status: 200
- All decimal values stored correctly
- Total: 71.5

---

### TC-INV-003: Complete Count - Calculate Variance

**Priority**: High
**Type**: Normal Flow

**Preconditions**:
- Batch has currentQuantity: 50
- Count draft has countedQuantity: 45

**Steps**:
1. POST `/api/inventory/count/:draftId/complete`

**Expected Results**:
- Status: 200
- Variance calculated: -5
- CompletedInventoryCount created
- InventoryTransaction for adjustment

---

### TC-INV-004: Replenishment Calculation

**Priority**: High
**Type**: Normal Flow

**Steps**:
1. GET `/api/inventory/replenishment?months=3`

**Expected Results**:
- Status: 200
- Each reagent shows:
  - Current stock
  - Average monthly usage
  - Recommended order quantity

---

### TC-INV-005: Transaction History Pagination

**Priority**: Medium
**Type**: Normal Flow

**Steps**:
1. GET `/api/inventory/transactions?page=1&limit=20`

**Expected Results**:
- Status: 200
- 20 transactions returned
- Total count in response
- Pagination metadata

---

## 10. Alert Test Cases

### TC-ALR-001: Create Expiry Warning Rule

**Priority**: Medium
**Type**: Normal Flow

**Steps**:
1. POST `/api/alerts/rules`
2. Body:
```json
{
  "ruleType": "EXPIRY_WARNING",
  "name": "30 Day Expiry Warning",
  "thresholdDays": 30,
  "isActive": true
}
```

**Expected Results**:
- Status: 201
- Rule created

---

### TC-ALR-002: Generate Alerts

**Priority**: Medium
**Type**: Normal Flow

**Preconditions**:
- Active rules exist
- Data matches rule conditions

**Steps**:
1. POST `/api/alerts/generate`

**Expected Results**:
- Status: 200
- New alerts created for matching conditions
- Alerts linked to rules

---

### TC-ALR-003: Resolve Alert

**Priority**: Medium
**Type**: Normal Flow

**Steps**:
1. PATCH `/api/alerts/:id/resolve`
2. Body: `{ "resolutionNotes": "Issue addressed" }`

**Expected Results**:
- Status: 200
- Alert status: RESOLVED
- resolvedAt timestamp set

---

### TC-ALR-004: Batch Resolve Multiple Alerts

**Priority**: Medium
**Type**: Extreme

**Steps**:
1. POST `/api/alerts/batch-resolve`
2. Body: `{ "alertIds": [<100 alert IDs>] }`

**Expected Results**:
- Status: 200
- All 100 alerts resolved
- Performance acceptable

---

## 11. Decimal Precision Test Cases

### TC-DEC-001: Backend - Store 0.25

**Steps**:
1. Create batch with initialQuantity: 10.25
2. Query batch

**Expected**: Quantity is exactly 10.25

---

### TC-DEC-002: Backend - Store 0.5

**Steps**:
1. Create batch with initialQuantity: 25.5
2. Query batch

**Expected**: Quantity is exactly 25.5

---

### TC-DEC-003: Backend - Store 0.75

**Steps**:
1. Create batch with initialQuantity: 50.75
2. Query batch

**Expected**: Quantity is exactly 50.75

---

### TC-DEC-004: Backend - Sum Decimals

**Steps**:
1. Create items: 10.25 + 5.5 + 3.75
2. Calculate total

**Expected**: Total is exactly 19.5

---

### TC-DEC-005: Backend - Subtract Decimals

**Steps**:
1. Batch with 100.5
2. Withdraw 25.75

**Expected**: Remaining is exactly 74.75

---

### TC-DEC-006: Frontend - Display 0.25

**Steps**:
1. Navigate to batch with quantity 10.25

**Expected**: Displays "10.25" (not "10.3" or "10")

---

### TC-DEC-007: Frontend - Display 0.5

**Steps**:
1. Navigate to batch with quantity 25.5

**Expected**: Displays "25.5" or "25.50"

---

### TC-DEC-008: Frontend - Input 0.75

**Steps**:
1. Open new batch form
2. Enter 50.75 in quantity field
3. Submit

**Expected**: Accepted and saved as 50.75

---

### TC-DEC-009: Frontend - Calculate Sum Display

**Steps**:
1. Order with items: 10.25, 5.5, 3.75
2. View order total

**Expected**: Total shows 19.5 exactly

---

### TC-DEC-010: Report - Decimal Totals

**Steps**:
1. Generate inventory report with decimal quantities

**Expected**: All sums calculated correctly

---

## 12. RTL/Hebrew Test Cases

### TC-RTL-001: HTML Direction Attribute

**Steps**:
1. View page source

**Expected**: `<html dir="rtl">`

---

### TC-RTL-002: Form Label Position

**Steps**:
1. Open any form (login, new reagent)

**Expected**: Labels appear to the right of inputs

---

### TC-RTL-003: Table Header Alignment

**Steps**:
1. Open any table view (reagents, orders)

**Expected**: Headers right-aligned

---

### TC-RTL-004: Table Action Column

**Steps**:
1. Open table with actions

**Expected**: Action buttons on left side

---

### TC-RTL-005: Navigation Menu

**Steps**:
1. Open sidebar navigation

**Expected**: Menu items right-aligned

---

### TC-RTL-006: Hebrew Validation Messages

**Steps**:
1. Submit empty form

**Expected**: Error messages in Hebrew

---

### TC-RTL-007: Numbers in RTL Context

**Steps**:
1. View quantities, prices, dates

**Expected**: Numbers display correctly (LTR within RTL)

---

### TC-RTL-008: URLs and Emails

**Steps**:
1. View supplier email/website

**Expected**: URLs and emails always LTR

---

### TC-RTL-009: Date Format

**Steps**:
1. View any date field

**Expected**: Hebrew locale format or ISO

---

### TC-RTL-010: Button Order

**Steps**:
1. View form with Cancel/Submit buttons

**Expected**: Primary action on left, secondary on right

---

*Document Version: 1.0*
*Last Updated: 2026-01-20*
