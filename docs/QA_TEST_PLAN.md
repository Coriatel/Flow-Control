# Flow Control - Comprehensive QA Test Plan

**Project**: Flow Control (Blood Bank Inventory Management System)
**Location**: `/opt/flow-control/app/`
**Version**: 1.0.0
**Last Updated**: 2026-01-20
**Prepared by**: QA Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Test Environment](#2-test-environment)
3. [Test Data](#3-test-data)
4. [Backend API Testing](#4-backend-api-testing)
5. [Frontend E2E Testing](#5-frontend-e2e-testing)
6. [Decimal Precision Testing](#6-decimal-precision-testing)
7. [RTL/Hebrew Testing](#7-rtlhebrew-testing)
8. [Edge Cases & Extreme Scenarios](#8-edge-cases--extreme-scenarios)
9. [Performance Testing](#9-performance-testing)
10. [Security Testing](#10-security-testing)
11. [Test Execution](#11-test-execution)
12. [Success Criteria](#12-success-criteria)

---

## 1. Executive Summary

### Project Scope
Complete QA audit of Flow Control covering:
- **Backend**: 80+ API endpoints across 14 route files, 6 services
- **Frontend**: 52 pages, 94+ components, Hebrew RTL interface
- **Database**: 27 tables, 16 enums (PostgreSQL via Prisma)
- **Environments**: Development (localhost) & Production (Docker)

### Test Coverage Goals
| Area | Target Coverage |
|------|-----------------|
| Backend Unit Tests | 80% |
| API Integration Tests | 100% endpoints |
| Frontend E2E Tests | 100% pages |
| Critical Paths | 100% |

---

## 2. Test Environment

### 2.1 Database Setup

```bash
# Create test database
createdb flow_control_test

# Run migrations
cd /opt/flow-control/app/server
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control_test" npm run prisma:migrate

# Seed QA data
npm run prisma:seed:qa
```

### 2.2 Environment Configuration

File: `/opt/flow-control/app/server/.env.test`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control_test"
JWT_SECRET="test-jwt-secret-for-qa-testing-only"
NODE_ENV=test
LOG_LEVEL=silent
PORT=3001
```

### 2.3 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testPathPattern=auth

# Run integration tests
npm run test:integration

# Run E2E tests (frontend)
cd /opt/flow-control/app
npx playwright test
```

---

## 3. Test Data

### 3.1 QA Seed Data Overview

The QA seeder (`seed-qa.ts`) creates:

| Entity | Count | Notes |
|--------|-------|-------|
| Users | 10 | All 4 roles (ADMIN, MANAGER, USER, READONLY) |
| Suppliers | 5 | With contacts (15 total) |
| Reagents | 30 | All 3 categories |
| Batches | 100 | All statuses, mixed expiry dates |
| Orders | 30 | All statuses |
| Deliveries | 20 | All statuses |
| Withdrawals | 15 | All statuses |
| Shipments | 15 | All statuses |
| Transactions | 200 | All types |
| Alert Rules | 10 | All types |
| Active Alerts | 30 | All severities |
| Activity Logs | 200 | Various actions |

### 3.2 Test User Credentials

| Email | Role | Password |
|-------|------|----------|
| admin@flow.test | ADMIN | Test123! |
| manager1@flow.test | MANAGER | Test123! |
| manager2@flow.test | MANAGER | Test123! |
| user1@flow.test | USER | Test123! |
| user2@flow.test | USER | Test123! |
| user3@flow.test | USER | Test123! |
| user4@flow.test | USER | Test123! |
| user5@flow.test | USER | Test123! |
| readonly1@flow.test | READONLY | Test123! |
| readonly2@flow.test | READONLY | Test123! |

### 3.3 Supplier Test Data

| Name | Code | Currency | Preferred |
|------|------|----------|-----------|
| Bio-Rad Laboratories | BRD | USD | Yes |
| Ortho Clinical Diagnostics | OCD | USD | No |
| Grifols | GRF | EUR | Yes |
| Immucor | IMC | USD | No |
| DiaMed / Bio-Rad | DIA | CHF | No |

---

## 4. Backend API Testing

### 4.1 Authentication & Authorization (auth.ts, users.ts)

**Priority: CRITICAL**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| AUTH-001 | Valid login | Normal | 200, returns JWT token |
| AUTH-002 | Wrong password | Edge | 401, "Invalid credentials" |
| AUTH-003 | Inactive user login | Edge | 401, account disabled message |
| AUTH-004 | Rate limit exceeded | Extreme | 429, rate limit message |
| AUTH-005 | SQL injection in email | Security | 400, validation error |
| AUTH-006 | Valid registration | Normal | 201, user created |
| AUTH-007 | Duplicate email registration | Edge | 409, already exists |
| AUTH-008 | Weak password | Edge | 400, password requirements |
| AUTH-009 | XSS in name field | Security | Sanitized or rejected |
| AUTH-010 | Token refresh | Normal | 200, new token |
| AUTH-011 | Expired token | Edge | 401, token expired |
| AUTH-012 | Malformed JWT | Edge | 401, invalid token |
| AUTH-013 | Admin route as USER | Security | 403, forbidden |
| AUTH-014 | Role escalation attempt | Security | 403, forbidden |

### 4.2 Suppliers (suppliers.ts)

**Priority: HIGH**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| SUP-001 | List active suppliers | Normal | 200, array of suppliers |
| SUP-002 | List including inactive | Edge | 200, filtered results |
| SUP-003 | Create supplier | Normal | 201, supplier created |
| SUP-004 | Duplicate supplier name | Edge | 409, already exists |
| SUP-005 | Unicode/emoji in name | Extreme | 201 or 400 (validate) |
| SUP-006 | Get supplier by ID | Normal | 200, supplier data |
| SUP-007 | Non-existent ID | Edge | 404, not found |
| SUP-008 | Update supplier | Normal | 200, updated data |
| SUP-009 | Delete supplier with orders | Edge | 400, has dependencies |
| SUP-010 | Add contact | Normal | 201, contact created |
| SUP-011 | Set primary contact | Normal | 200, primary updated |
| SUP-012 | 50+ contacts for supplier | Extreme | Handle pagination |

### 4.3 Reagents (reagents.ts)

**Priority: CRITICAL**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| REA-001 | List all reagents | Normal | 200, array |
| REA-002 | Filter by category | Normal | 200, filtered |
| REA-003 | Filter by supplier | Normal | 200, filtered |
| REA-004 | Combined filters | Edge | 200, combined filter |
| REA-005 | Search Hebrew text | Edge | 200, matches found |
| REA-006 | Create reagent | Normal | 201, created |
| REA-007 | Duplicate catalog number | Edge | 409, already exists |
| REA-008 | Special chars in name | Edge | 201 or sanitized |
| REA-009 | Get grouped by supplier | Normal | 200, grouped data |
| REA-010 | Get grouped by category | Normal | 200, grouped data |
| REA-011 | Empty groups | Edge | 200, empty arrays |
| REA-012 | 500+ reagents | Extreme | Performance check |

### 4.4 Batches (batches.ts)

**Priority: CRITICAL**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| BAT-001 | Create batch | Normal | 201, created |
| BAT-002 | Past expiry date | Edge | 400, invalid date |
| BAT-003 | Zero quantity | Edge | 400, invalid quantity |
| BAT-004 | Decimal quantity (0.25) | Edge | 201, handles decimals |
| BAT-005 | Decimal quantity (0.5) | Edge | 201, handles decimals |
| BAT-006 | Decimal quantity (0.75) | Edge | 201, handles decimals |
| BAT-007 | Withdraw valid quantity | Normal | 200, quantity updated |
| BAT-008 | Withdraw > available | Edge | 400, insufficient |
| BAT-009 | Concurrent withdrawals | Extreme | Race condition check |
| BAT-010 | Status ACTIVE→EXPIRED | Normal | 200, status changed |
| BAT-011 | Invalid status transition | Edge | 400, invalid transition |
| BAT-012 | Get expiring batches (30d) | Normal | 200, list |
| BAT-013 | Get expiring (days=0) | Edge | 200, today only |
| BAT-014 | Get expiring (days=365) | Edge | 200, full year |

### 4.5 Orders (orders.ts)

**Priority: HIGH**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| ORD-001 | Create IMMEDIATE order | Normal | 201, created |
| ORD-002 | Create FRAMEWORK order | Normal | 201, created |
| ORD-003 | Order with 50 items | Extreme | 201, handles large |
| ORD-004 | DRAFT → APPROVED | Normal | 200, status changed |
| ORD-005 | Invalid status transition | Edge | 400, invalid |
| ORD-006 | Approve as non-manager | Security | 403, forbidden |
| ORD-007 | Receive full order | Normal | 200, FULLY_RECEIVED |
| ORD-008 | Partial receipt | Edge | 200, PARTIALLY_RECEIVED |
| ORD-009 | Cancel DRAFT order | Normal | 200, cancelled |
| ORD-010 | Cancel received order | Edge | 400, cannot cancel |
| ORD-011 | Decimal item quantities | Edge | 201, handles decimals |

### 4.6 Deliveries (deliveries.ts)

**Priority: HIGH**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| DEL-001 | Create with order link | Normal | 201, linked |
| DEL-002 | Create without order | Normal | 201, standalone |
| DEL-003 | Recurring supply flag | Normal | 201, flag set |
| DEL-004 | NEW → PROCESSING | Normal | 200, status changed |
| DEL-005 | Process already processing | Edge | 400, invalid |
| DEL-006 | Receive all items | Normal | 200, COMPLETED |
| DEL-007 | Partial rejection | Edge | 200, quantities updated |
| DEL-008 | Reject all items | Edge | 200, all rejected |
| DEL-009 | Auto-create batches | Normal | Batches created |
| DEL-010 | Duplicate batch number | Edge | 400, duplicate |
| DEL-011 | 50 items delivery | Extreme | 201, handles large |

### 4.7 Withdrawals (withdrawals.ts)

**Priority: HIGH**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| WDR-001 | Create standard | Normal | 201, created |
| WDR-002 | With framework order | Normal | 201, linked |
| WDR-003 | Expired framework | Edge | 400, expired |
| WDR-004 | DRAFT → SUBMITTED | Normal | 200, submitted |
| WDR-005 | SUBMITTED → APPROVED | Normal | 200, approved |
| WDR-006 | Partial approval | Edge | 200, different qty |
| WDR-007 | APPROVED → SHIPPING | Normal | 200, shipping |
| WDR-008 | Partial fulfillment | Edge | 200, partial ship |
| WDR-009 | Decimal quantities | Edge | Handles decimals |

### 4.8 Shipments (shipments.ts)

**Priority: HIGH**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| SHP-001 | Create shipment | Normal | 201, created |
| SHP-002 | Hebrew hospital name | Edge | 201, handles Hebrew |
| SHP-003 | Empty items list | Edge | 400, required items |
| SHP-004 | DRAFT → SENT | Normal | 200, sent |
| SHP-005 | Insufficient inventory | Edge | 400, insufficient |
| SHP-006 | FIFO batch deduction | Normal | Oldest batch first |
| SHP-007 | Specific batch selection | Normal | Selected batch used |
| SHP-008 | Wrong reagent batch | Edge | 400, mismatch |

### 4.9 Inventory (inventory.ts)

**Priority: CRITICAL**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| INV-001 | Save count draft | Normal | 200, saved |
| INV-002 | Empty entries | Edge | 200, empty saved |
| INV-003 | 500 entries at once | Extreme | 200, handles large |
| INV-004 | Complete valid count | Normal | 200, completed |
| INV-005 | Complete non-existent | Edge | 404, not found |
| INV-006 | Variance calculation | Normal | Correct variance |
| INV-007 | Replenishment (3 months) | Normal | 200, recommendations |
| INV-008 | Replenishment (1 month) | Edge | 200, short term |
| INV-009 | Replenishment (12 months) | Edge | 200, long term |
| INV-010 | Transaction pagination | Normal | Paginated results |
| INV-011 | 1000 transactions | Extreme | Performance check |
| INV-012 | Decimal counted quantities | Edge | Handles decimals |

### 4.10 Alerts (alerts.ts)

**Priority: MEDIUM**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| ALR-001 | List all alerts | Normal | 200, array |
| ALR-002 | Filter by severity | Normal | 200, filtered |
| ALR-003 | Combined filters | Edge | 200, combined |
| ALR-004 | Resolve single alert | Normal | 200, resolved |
| ALR-005 | Resolve already resolved | Edge | 400, already resolved |
| ALR-006 | Batch resolve 100 | Extreme | 200, all resolved |
| ALR-007 | Create all rule types | Normal | 201, rules created |
| ALR-008 | Invalid threshold | Edge | 400, validation error |
| ALR-009 | Generate alerts check | Normal | New alerts created |
| ALR-010 | No conditions match | Edge | No new alerts |

### 4.11 Dashboard (dashboard.ts)

**Priority: MEDIUM**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| DSH-001 | Get all dashboard data | Normal | 200, complete data |
| DSH-002 | Empty database | Edge | 200, zeros/empty |
| DSH-003 | 10000 items | Extreme | Performance check |
| DSH-004 | Expiring items default | Normal | 200, list |
| DSH-005 | None expiring | Edge | 200, empty list |
| DSH-006 | Low stock indicators | Normal | Correct counts |

### 4.12 Files (files.ts)

**Priority: MEDIUM**

| ID | Test Case | Type | Expected Result |
|----|-----------|------|-----------------|
| FIL-001 | Upload PDF | Normal | 201, uploaded |
| FIL-002 | Upload image | Normal | 201, uploaded |
| FIL-003 | Invalid file type | Edge | 400, type not allowed |
| FIL-004 | 50MB file | Extreme | 413 or success |
| FIL-005 | Download valid file | Normal | 200, file stream |
| FIL-006 | Download non-existent | Edge | 404, not found |

---

## 5. Frontend E2E Testing

### 5.1 Authentication Pages

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| E2E-AUTH-001 | Valid login | Enter credentials, submit | Dashboard redirect |
| E2E-AUTH-002 | Invalid password | Wrong password | Hebrew error |
| E2E-AUTH-003 | Remember me | Check option, login | Persisted session |
| E2E-AUTH-004 | Registration flow | Complete form | Account created |
| E2E-AUTH-005 | Password strength | Type various passwords | Strength indicator |
| E2E-AUTH-006 | RTL form layout | Inspect | Right-to-left |

### 5.2 Dashboard Page

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| E2E-DSH-001 | Load dashboard | Login, navigate | All widgets load |
| E2E-DSH-002 | Expiring items widget | View widget | Correct data |
| E2E-DSH-003 | Low stock widget | View widget | Correct alerts |
| E2E-DSH-004 | Recent activity | Scroll activity | Items load |
| E2E-DSH-005 | Quick actions | Click actions | Navigate correctly |

### 5.3 Reagent Management

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| E2E-REA-001 | List reagents | Navigate to page | Table loads |
| E2E-REA-002 | Filter by category | Select filter | Filtered results |
| E2E-REA-003 | Search Hebrew | Type Hebrew text | Matches shown |
| E2E-REA-004 | Create reagent | Fill form, submit | Created, toast |
| E2E-REA-005 | Edit reagent | Load, modify, save | Updated |
| E2E-REA-006 | Delete reagent | Click delete, confirm | Removed |
| E2E-REA-007 | Decimal display | View quantities | Correct decimals |

### 5.4 Order Management

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| E2E-ORD-001 | Create order | Fill form, add items | Order created |
| E2E-ORD-002 | Multi-step form | Complete all steps | All steps work |
| E2E-ORD-003 | Item quantity decimal | Enter 10.5 | Accepted |
| E2E-ORD-004 | Approve order | Manager approves | Status changes |
| E2E-ORD-005 | Cancel order | Cancel, confirm | Cancelled |

### 5.5 Delivery Processing

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| E2E-DEL-001 | Create delivery | Fill form | Delivery created |
| E2E-DEL-002 | Process items | Mark items received | Status updates |
| E2E-DEL-003 | Partial rejection | Reject some items | Quantities correct |
| E2E-DEL-004 | Batch creation | Complete delivery | Batches created |

### 5.6 Inventory Count

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| E2E-INV-001 | Start count | Click start | Draft created |
| E2E-INV-002 | Enter quantities | Fill counts | Saved |
| E2E-INV-003 | Decimal counts | Enter 15.25 | Accepted |
| E2E-INV-004 | Complete count | Finalize | Transactions created |
| E2E-INV-005 | Variance display | View results | Correct variance |

---

## 6. Decimal Precision Testing

**Critical for medical/laboratory systems**

### 6.1 Test Values

| Value | Description | Usage |
|-------|-------------|-------|
| 0.25 | Quarter unit | Reagent fractional |
| 0.5 | Half unit | Common fraction |
| 0.75 | Three-quarter | Fractional use |
| 10.5 | Mixed number | Order quantity |
| 99.99 | Near boundary | Price testing |
| 0.01 | Minimum decimal | Edge case |

### 6.2 Pages Requiring Decimal Testing

| Page | Fields | Test Cases |
|------|--------|------------|
| NewBatch | initialQuantity | 10.25, 50.5, 100.75 |
| NewOrder | item quantities | 5.5, 10.25, 20.75 |
| NewDelivery | received quantities | 8.25, 15.5, 30.75 |
| NewWithdrawal | requested/approved | 3.25, 7.5, 12.75 |
| NewShipment | ship quantities | 2.25, 5.5, 8.75 |
| InventoryCount | counted quantities | All decimal values |
| BatchManagement | current quantity display | All decimal values |
| Reports | calculated totals | Sum of decimals |

### 6.3 Backend Decimal Tests

```typescript
// Example test for decimal handling
describe('Decimal Precision', () => {
  it('should handle 0.25 quantities', async () => {
    const response = await request(app)
      .post('/api/batches')
      .send({ quantity: 10.25 });
    expect(response.body.data.quantity).toBe('10.25');
  });

  it('should sum decimals correctly', async () => {
    // 10.25 + 5.5 + 2.75 = 18.5
    const total = await calculateTotal([10.25, 5.5, 2.75]);
    expect(total).toBe(18.5);
  });
});
```

---

## 7. RTL/Hebrew Testing

### 7.1 RTL Checklist

| Check | Criteria | Pass/Fail |
|-------|----------|-----------|
| HTML dir attribute | `dir="rtl"` on root | |
| Text direction | Right-to-left flow | |
| Form labels | Right of inputs | |
| Form alignment | Right-aligned | |
| Table headers | Right-aligned | |
| Table actions | Left column | |
| Navigation | Right-aligned items | |
| Buttons | Correct order | |
| Icons | Mirrored if needed | |
| Date display | Hebrew locale | |
| Numbers in RTL | LTR within RTL | |
| URLs/emails | LTR always | |

### 7.2 CSS Properties Check

```css
/* Should use logical properties */
.correct {
  margin-inline-start: 1rem;  /* NOT margin-left */
  padding-inline-end: 1rem;   /* NOT padding-right */
  text-align: start;          /* NOT text-align: left */
}
```

### 7.3 Hebrew Text Test Cases

| Page | Hebrew Elements | Test |
|------|-----------------|------|
| Login | Form labels, errors | Display correctly |
| Dashboard | Titles, labels | Display correctly |
| All Forms | Validation messages | Hebrew messages |
| Tables | Headers, content | Right-aligned |
| Alerts | Alert text | Readable |
| Reports | All text | Correct direction |

---

## 8. Edge Cases & Extreme Scenarios

### 8.1 Data Boundary Testing

| Scenario | Test Input | Expected |
|----------|------------|----------|
| Empty database | No data | Graceful empty states |
| Single item | Exactly 1 | Displays correctly |
| Max integer | 2147483647 | Handles or validates |
| Max string | 255 characters | Truncates or validates |
| Unicode names | Hebrew + emoji | Stores correctly |
| Special SQL chars | `'; DROP TABLE --` | Sanitized |

### 8.2 Concurrency Testing

| Scenario | Setup | Verification |
|----------|-------|--------------|
| Simultaneous withdrawals | 2 users same batch | No over-withdrawal |
| Concurrent order edits | 2 users same order | Conflict handling |
| Rapid API calls | 100 calls/second | Rate limiting works |
| Parallel batch creation | Same lot number | Unique constraint |

### 8.3 Error Recovery

| Scenario | Trigger | Expected |
|----------|---------|----------|
| Network timeout | Kill connection | Retry or error message |
| Database down | Stop DB | 500 with message |
| Invalid JSON | Malformed body | 400 validation |
| Missing auth | No token | 401 unauthorized |

---

## 9. Performance Testing

### 9.1 API Response Time Targets

| Endpoint | Target | Max Acceptable |
|----------|--------|----------------|
| Login | <200ms | 500ms |
| List endpoints | <300ms | 1000ms |
| Create/Update | <500ms | 1500ms |
| Dashboard | <500ms | 2000ms |
| Reports | <1000ms | 5000ms |

### 9.2 Load Testing Scenarios

```yaml
# Using Artillery or k6
scenarios:
  - name: Normal Load
    duration: 5m
    arrivalRate: 10
  - name: Peak Load
    duration: 5m
    arrivalRate: 50
  - name: Stress Test
    duration: 5m
    arrivalRate: 100
```

---

## 10. Security Testing

### 10.1 OWASP Top 10 Checks

| Vulnerability | Test Method | Status |
|---------------|-------------|--------|
| Injection | SQL/NoSQL injection attempts | |
| Broken Auth | Token manipulation | |
| Sensitive Data | Check HTTPS, encryption | |
| XXE | XML payload test | |
| Access Control | Cross-role access | |
| Misconfiguration | Header analysis | |
| XSS | Script injection | |
| Insecure Deserialization | Payload test | |
| Known Vulnerabilities | npm audit | |
| Logging | Check log coverage | |

### 10.2 Security Test Cases

| ID | Test | Expected |
|----|------|----------|
| SEC-001 | SQL injection in login | Rejected |
| SEC-002 | JWT tampering | Invalid token |
| SEC-003 | CSRF without token | Rejected |
| SEC-004 | XSS in form fields | Sanitized |
| SEC-005 | Path traversal | Blocked |
| SEC-006 | Rate limiting | Enforced |

---

## 11. Test Execution

### 11.1 Daily Tests

```bash
# Backend unit tests
cd /opt/flow-control/app/server
npm test

# Coverage report
npm run test:coverage
```

### 11.2 Pre-Release Tests

```bash
# Full test suite
npm run test:ci

# E2E tests
cd /opt/flow-control/app
npx playwright test

# Performance tests
npx artillery run tests/load-test.yml
```

### 11.3 Test Reporting

- Coverage reports: `/opt/flow-control/app/server/coverage/`
- Playwright reports: `/opt/flow-control/app/playwright-report/`
- Test results logged to CI/CD pipeline

---

## 12. Success Criteria

### 12.1 Quality Gates

| Metric | Threshold | Current |
|--------|-----------|---------|
| Backend test coverage | >80% | |
| All API endpoints tested | 100% | |
| All pages E2E tested | 100% | |
| Critical path coverage | 100% | |
| P0/P1 bugs | 0 | |
| Performance targets met | 100% | |

### 12.2 Sign-off Checklist

- [ ] All backend unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Decimal precision verified
- [ ] RTL/Hebrew verified all pages
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] QA team approval

---

## Appendix A: File References

| File | Purpose |
|------|---------|
| `/server/prisma/seed-qa.ts` | QA test data seeder |
| `/server/.env.test` | Test environment config |
| `/server/src/__tests__/` | Backend test files |
| `/e2e/` | Playwright E2E tests |
| `/docs/TEST_CASES.md` | Detailed test cases |
| `/docs/RTL_CHECKLIST.md` | RTL verification |

---

## Appendix B: Test Data Summary

### Batch Status Distribution (100 batches)
- ACTIVE: 60%
- CONSUMED: 20%
- EXPIRED: 10%
- INCOMING: 5%
- ON_HOLD: 3%
- DESTROYED: 2%

### Order Status Distribution (30 orders)
- DRAFT: 3
- PENDING_SAP: 3
- APPROVED: 6
- PARTIALLY_RECEIVED: 5
- FULLY_RECEIVED: 8
- CLOSED: 4
- CANCELLED: 1

---

*Document Version: 1.0*
*Last Updated: 2026-01-20*
