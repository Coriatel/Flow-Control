# Flow-Control PRD
## Blood Bank Inventory Management System

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Created** | 2026-01-19 |
| **Status** | Active Development |
| **Owner** | Flow-Control Team |

---

## 1. Summary

Flow-Control is a Blood Bank Inventory Management System designed for laboratory reagent tracking, procurement, quality assurance, and reporting. The system manages 27 entity types across inventory, orders, deliveries, shipments, and alerts.

The platform provides centralized management for blood bank reagent batches, supplier relationships, procurement workflows, and quality control processes. It includes a comprehensive dashboard for monitoring stock levels, expiring items, and pending actions, with full audit trail capabilities for regulatory compliance.

**Key Capabilities:**
- Reagent catalog and batch lifecycle management
- Procurement workflow with SAP integration readiness
- Quality assurance with COA (Certificate of Analysis) tracking
- Automated alerting for expiry and low stock conditions
- Complete activity logging and compliance reporting
- RTL/Hebrew interface support

---

## 2. Goals

### Primary Goals

| # | Goal | Success Criteria |
|---|------|------------------|
| G1 | Centralized inventory tracking | All reagents and batches tracked in single system |
| G2 | Proactive expiry management | Zero expired reagents used due to tracking failures |
| G3 | Low-stock prevention | Alerts generated before stockout conditions |
| G4 | Streamlined procurement | Order-to-receipt cycle fully traceable |
| G5 | Quality assurance compliance | 100% COA documentation for batches |
| G6 | Audit trail completeness | All actions logged with user attribution |
| G7 | RTL/Hebrew accessibility | Full interface localization support |

### Strategic Goals

- **Operational Efficiency:** Reduce manual inventory tracking overhead by 50%
- **Compliance:** Meet regulatory requirements for blood bank reagent management
- **SAP Integration:** Prepare architecture for future SAP procurement integration
- **Scalability:** Support growth to 1000+ active batches

---

## 3. Non-Goals

The following are explicitly **out of scope** for version 1.0:

| Non-Goal | Rationale |
|----------|-----------|
| Manufacturing/production management | Blood bank is consumer, not producer |
| Patient data or medical records | Separate EHR/LIS systems handle this |
| Financial/billing integration | Finance handled by separate systems |
| Multi-site deployment | Single laboratory focus for v1.0 |
| External lab integrations | No cross-lab data sharing in v1.0 |
| Real-time instrument integration | Manual entry workflow for v1.0 |
| Mobile native applications | Web-responsive approach instead |

---

## 4. Users

### User Roles

| Role | Access Level | Primary Responsibilities |
|------|--------------|-------------------------|
| **ADMIN** | Full Control | System configuration, user management, role assignments, system settings |
| **MANAGER** | All Operations | Approvals, report generation, audit reviews, alert rule configuration |
| **USER** | Daily Operations | CRUD operations, inventory counts, withdrawal requests, batch management |
| **READONLY** | View Only | Audit reviews, report viewing, data exports |

### Permissions Matrix

| Feature | ADMIN | MANAGER | USER | READONLY |
|---------|-------|---------|------|----------|
| User Management | ✓ | - | - | - |
| System Settings | ✓ | - | - | - |
| Alert Rules | ✓ | ✓ | - | - |
| Approvals | ✓ | ✓ | - | - |
| Reports & Exports | ✓ | ✓ | ✓ | ✓ |
| CRUD Operations | ✓ | ✓ | ✓ | - |
| View Data | ✓ | ✓ | ✓ | ✓ |
| Inventory Counts | ✓ | ✓ | ✓ | - |
| Withdrawals | ✓ | ✓ | ✓ | - |

---

## 5. User Stories

### Inventory Management

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-01 | Lab technician | Scan a batch and see its expiry status | I can verify it's safe to use |
| US-02 | Lab technician | Record batch consumption | Inventory levels stay accurate |
| US-03 | Lab technician | View all batches for a reagent | I can select the appropriate batch (FIFO) |
| US-04 | Manager | See low stock warnings | I can initiate reorders before stockout |
| US-05 | Manager | View expiring items dashboard | I can prioritize batch usage |

### Procurement

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-06 | User | Create a purchase order | I can request needed reagents |
| US-07 | Manager | Approve pending orders | Procurement can proceed |
| US-08 | User | Record delivery receipt | Incoming batches are tracked |
| US-09 | User | Link deliveries to orders | Order fulfillment is tracked |
| US-10 | Manager | View order status dashboard | I know what's pending/complete |

### Quality Assurance

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-11 | User | Upload COA documents | Batch quality is documented |
| US-12 | Manager | Set batch QC status | Only approved batches are used |
| US-13 | Auditor | View QC history for batches | Compliance can be verified |

### Reporting & Audit

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-14 | Auditor | Export activity log to Excel | External audit requirements are met |
| US-15 | Manager | Generate inventory report | Monthly reconciliation is documented |
| US-16 | Manager | View consumption trends | Future needs can be forecasted |
| US-17 | Auditor | Search activity by user/date | Specific actions can be investigated |

### Alerts

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-18 | Manager | Configure alert thresholds | Alerts match operational needs |
| US-19 | User | View my active alerts | I know what needs attention |
| US-20 | Manager | Acknowledge/resolve alerts | Alert status reflects reality |

---

## 6. Core Workflows

### 6.1 Reagent Catalog Management

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Add Supplier   │────▶│  Add Reagent    │────▶│  Link to        │
│                 │     │  (Catalog #)    │     │  Supplier       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Steps:**
1. Create supplier record with contact and payment terms
2. Add reagent with catalog number, description, unit of measure
3. Link reagent to supplier(s) with pricing information
4. Set minimum stock levels and alert thresholds

### 6.2 Batch Lifecycle

```
INCOMING ──▶ ACTIVE ──▶ EXPIRED
                │
                ▼
            CONSUMED
```

**States:**
- **INCOMING:** Received but not yet available for use
- **ACTIVE:** Available for laboratory use
- **CONSUMED:** Fully used (quantity = 0)
- **EXPIRED:** Past expiry date

**Transitions:**
1. Batch created from delivery → INCOMING
2. QC approved → ACTIVE
3. Quantity reaches 0 → CONSUMED
4. Expiry date passes → EXPIRED

### 6.3 Procurement Workflow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Create  │──▶│   SAP    │──▶│ Supplier │──▶│ Delivery │──▶│  Batch   │
│  Order   │   │ Approval │   │  Ships   │   │ Receipt  │   │ Created  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Order Statuses:**
- `DRAFT` → `PENDING` → `SAP_APPROVED` → `SHIPPED` → `DELIVERED` → `COMPLETED`

### 6.4 Withdrawal/Shipment Workflow

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Request    │──▶│   Approval   │──▶│    Ship to   │──▶│   Update     │
│   Created    │   │   (Manager)  │   │   Department │   │   Inventory  │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

**Withdrawal Types:**
- Internal department transfer
- External shipment
- Disposal (expired/damaged)

### 6.5 Inventory Count Workflow

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Create     │──▶│    Enter     │──▶│   Review     │──▶│   Complete   │
│   Draft      │   │   Counts     │   │   Variance   │   │   & Adjust   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

**Process:**
1. Create inventory count draft (date, scope)
2. Enter physical counts per batch
3. System calculates variance (physical vs. expected)
4. Review and explain variances
5. Complete count - adjustments recorded as transactions

### 6.6 Quality Assurance

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Receive    │──▶│   Upload     │──▶│   Set QC     │
│   Batch      │   │   COA        │   │   Status     │
└──────────────┘   └──────────────┘   └──────────────┘
```

**QC Statuses:**
- `PENDING_QC` - Awaiting review
- `APPROVED` - Cleared for use
- `REJECTED` - Not suitable for use
- `QUARANTINE` - Under investigation

### 6.7 Alert System

```
Alert Rules (Configured)
         │
         ▼
┌─────────────────────────┐
│   Background Process    │
│   (Scheduled Check)     │
└─────────────────────────┘
         │
         ▼
    ┌────┴────┐
    │ Match?  │
    └────┬────┘
         │ Yes
         ▼
┌─────────────────────────┐
│   Create Active Alert   │
│   (User Notification)   │
└─────────────────────────┘
```

**Alert Types:**
- **Expiry Alerts:** Configurable days-before threshold
- **Low Stock Alerts:** Months-of-supply calculation
- **Pending Action Alerts:** Orders, counts requiring attention

---

## 7. Requirements

### 7.1 Functional Requirements - Must Have (P0)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01 | CRUD for all 27 entities | Create, read, update, delete operations functional |
| FR-02 | JWT authentication | Secure login with access/refresh tokens |
| FR-03 | Role-based access control | 4 roles with appropriate permissions |
| FR-04 | Expiry tracking | Batches auto-flagged on expiry date |
| FR-05 | Configurable alert thresholds | Admin can set days-before for expiry alerts |
| FR-06 | Low stock alerts | Months-of-supply calculation functional |
| FR-07 | Physical inventory counts | Draft → entries → complete workflow |
| FR-08 | Variance reporting | System vs physical difference calculated |
| FR-09 | Batch QC status | Status field with state transitions |
| FR-10 | COA document storage | File upload and retrieval for batches |
| FR-11 | Activity logging | All CRUD operations logged with user |
| FR-12 | Dashboard | Overview with KPIs and action items |

### 7.2 Functional Requirements - Should Have (P1)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-13 | Excel export | Reports exportable to .xlsx format |
| FR-14 | PDF export | Reports exportable to .pdf format |
| FR-15 | Dashboard KPIs | Stock levels, expiring items, pending counts |
| FR-16 | Activity log filtering | Filter by user, date range, action type |
| FR-17 | Activity log aggregation | Summary views by entity/user |
| FR-18 | Framework order management | Multi-delivery order support |
| FR-19 | Batch transaction history | Full audit trail per batch |

### 7.3 Functional Requirements - Could Have (P2)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-20 | Email notifications | Alerts sent via email |
| FR-21 | Barcode/QR scanning | Camera-based batch lookup |
| FR-22 | Mobile-optimized UI | Responsive design for tablets |
| FR-23 | Bulk import | CSV/Excel import for batches |
| FR-24 | Consumption forecasting | Trend-based predictions |

### 7.4 Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Page load time | < 2 seconds |
| **Performance** | API response time | < 500ms (95th percentile) |
| **Performance** | Concurrent users | 50+ simultaneous |
| **Security** | OWASP compliance | Top 10 addressed |
| **Security** | Password hashing | bcrypt with salt |
| **Security** | Token security | JWT with expiration |
| **Security** | HTTPS | TLS 1.2+ required |
| **Reliability** | Uptime target | 99.9% |
| **Reliability** | Recovery time | < 1 hour |
| **Data** | Database | PostgreSQL |
| **Data** | Backup frequency | Daily |
| **Data** | Retention | 7 years (regulatory) |
| **Usability** | Language support | Hebrew (RTL), English |
| **Usability** | Browser support | Chrome, Firefox, Safari (latest 2) |

---

## 8. Architecture

### 8.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 18 + Vite 6 + TailwindCSS + Radix UI + React Query   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
│        Express 5.1 + TypeScript 5.9 + Helmet + CORS         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│           Prisma 6.x ORM + PostgreSQL 15+                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Component Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | UI components and state |
| **Build** | Vite 6 | Development and bundling |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Components** | Radix UI | Accessible UI primitives |
| **Data Fetching** | TanStack Query | Server state management |
| **Backend** | Express 5.1 | REST API server |
| **Language** | TypeScript 5.9 | Type safety |
| **ORM** | Prisma 6.x | Database access |
| **Database** | PostgreSQL 15+ | Data persistence |
| **Auth** | JWT + bcrypt | Authentication |
| **Security** | Helmet | HTTP security headers |
| **Logging** | Pino | Structured logging |

### 8.3 Directory Structure

```
/opt/flow-control/app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API clients
│   │   └── utils/          # Utilities
│   └── public/
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
└── docs/                   # Documentation
```

---

## 9. Data Model Summary

### 9.1 Entity Categories

| Category | Entities | Count |
|----------|----------|-------|
| **Core** | Supplier, Reagent, ReagentBatch | 3 |
| **Orders** | Order, OrderItem, FrameworkOrder, FrameworkOrderDelivery | 4 |
| **Logistics** | Delivery, DeliveryItem, Withdrawal, WithdrawalItem, Shipment, ShipmentItem | 6 |
| **Inventory** | InventoryCountDraft, InventoryCountEntry, CompletedInventoryCount, InventoryTransaction | 4 |
| **Alerts** | AlertRule, ActiveAlert, DashboardNote | 3 |
| **System** | User, ActivityLog, SystemSettings, Department | 4 |
| **Quality** | COADocument, QCRecord | 2 |
| **Audit** | AuditTrail | 1 |
| **Total** | | **27** |

### 9.2 Core Entities

```
Supplier
├── id, name, contactPerson, email, phone
├── address, paymentTerms, isActive
└── reagents[] (1:N)

Reagent
├── id, catalogNumber, name, description
├── unitOfMeasure, minStockLevel, reorderPoint
├── supplierId (N:1)
└── batches[] (1:N)

ReagentBatch
├── id, batchNumber, lotNumber
├── quantity, initialQuantity, unitOfMeasure
├── expiryDate, receivedDate
├── qcStatus, location
├── reagentId (N:1)
└── transactions[] (1:N)
```

### 9.3 Enums (16 Total)

| Enum | Values |
|------|--------|
| UserRole | ADMIN, MANAGER, USER, READONLY |
| BatchStatus | INCOMING, ACTIVE, CONSUMED, EXPIRED |
| QCStatus | PENDING_QC, APPROVED, REJECTED, QUARANTINE |
| OrderStatus | DRAFT, PENDING, SAP_APPROVED, SHIPPED, DELIVERED, COMPLETED, CANCELLED |
| AlertType | EXPIRY, LOW_STOCK, PENDING_ORDER, PENDING_COUNT |
| AlertSeverity | LOW, MEDIUM, HIGH, CRITICAL |
| TransactionType | RECEIPT, WITHDRAWAL, ADJUSTMENT, COUNT_CORRECTION |
| ... | (additional enums for other entities) |

---

## 10. Success Metrics

### 10.1 Operational Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Stockouts due to tracking failures | Unknown | 0 | Monthly count |
| Expired reagents used | Unknown | 0 | Incident reports |
| Average order processing time | Unknown | < 24 hours | Order timestamps |
| Expiry tracking compliance | Unknown | 100% | Audit sampling |
| Time per inventory count (per reagent) | Unknown | < 5 minutes | Time tracking |

### 10.2 System Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| System uptime | 99.9% | Monitoring |
| API response time (p95) | < 500ms | APM |
| Page load time (p95) | < 2s | RUM |
| Error rate | < 0.1% | Logging |
| Successful login rate | > 99% | Auth logs |

### 10.3 User Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active users | 80% of staff | Auth logs |
| Features utilized | 90% of P0 features | Usage analytics |
| User-reported issues | < 5/month | Support tickets |
| Training completion | 100% of users | Training records |

---

## 11. Test Strategy

### 11.1 Testing Levels

| Level | Scope | Tools | Coverage Target |
|-------|-------|-------|-----------------|
| **Unit** | Service functions, utilities | Jest/Vitest | 80% |
| **Integration** | API endpoints, DB operations | Supertest | 70% |
| **E2E** | Critical user workflows | Playwright | Key paths |
| **Manual** | RTL/Hebrew, accessibility | Human testers | Full UI |

### 11.2 Critical Test Scenarios

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh flow
- [ ] Role-based access enforcement

**Batch Management:**
- [ ] Create batch from delivery
- [ ] Update batch quantity (withdrawal)
- [ ] Batch expiry status update
- [ ] QC status transitions

**Inventory Counts:**
- [ ] Create count draft
- [ ] Enter physical counts
- [ ] Variance calculation
- [ ] Count completion with adjustments

**Alerts:**
- [ ] Expiry alert generation
- [ ] Low stock alert calculation
- [ ] Alert acknowledgment
- [ ] Alert resolution

### 11.3 Performance Testing

| Test | Method | Success Criteria |
|------|--------|------------------|
| Load test | 50 concurrent users | < 500ms response |
| Stress test | 100 concurrent users | Graceful degradation |
| Endurance | 24-hour run | No memory leaks |

---

## 12. Production Requirements

### 12.1 Deployment

| Component | Requirement |
|-----------|-------------|
| Containerization | Docker with multi-stage builds |
| Orchestration | Docker Compose (single host) |
| Reverse Proxy | Caddy (auto HTTPS) |
| Process Management | Node.js cluster mode |

### 12.2 Configuration

| Environment | Purpose |
|-------------|---------|
| `development` | Local development |
| `staging` | Pre-production testing |
| `production` | Live system |

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Token signing key
- `JWT_EXPIRES_IN` - Token expiration
- `NODE_ENV` - Environment identifier
- `PORT` - Server port
- `CORS_ORIGIN` - Allowed origins

### 12.3 Database Operations

| Operation | Method |
|-----------|--------|
| Migrations | Prisma Migrate |
| Seeding | Prisma seed scripts |
| Backups | pg_dump (daily, 7-day retention) |
| Restore | pg_restore |

### 12.4 Monitoring

| Aspect | Tool/Method |
|--------|-------------|
| Health checks | `/health` endpoint |
| Logging | Pino (structured JSON) |
| Error tracking | Application logs |
| Metrics | Custom dashboard |

### 12.5 Security Checklist

- [ ] HTTPS enforced (TLS 1.2+)
- [ ] Security headers (Helmet)
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Input validation (Zod/Joi)
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (React default)
- [ ] CSRF protection
- [ ] Secrets in environment variables
- [ ] Dependency vulnerability scanning

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Batch** | A specific lot of reagent with unique lot number and expiry |
| **COA** | Certificate of Analysis - quality documentation from supplier |
| **Framework Order** | Long-term contract for multiple deliveries |
| **FIFO** | First In, First Out - inventory consumption method |
| **QC** | Quality Control |
| **Reagent** | Chemical substance used in laboratory testing |
| **SAP** | Enterprise resource planning system for procurement |
| **Withdrawal** | Removal of inventory for use or transfer |

---

## Appendix B: Related Documents

| Document | Location |
|----------|----------|
| Production Readiness Report | `/opt/flow-control/app/docs/production-readiness-report.md` |
| Implementation Summary | `/opt/flow-control/app/docs/implementation-summary.md` |
| API Documentation | `/opt/flow-control/app/server/` |
| Database Schema | `/opt/flow-control/app/server/prisma/schema.prisma` |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | Flow-Control Team | Initial PRD creation |
