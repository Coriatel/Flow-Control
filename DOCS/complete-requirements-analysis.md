# Flow Control - ניתוח דרישות מלא ותוכנית בקנד

> מסמך זה נוצר מניתוח מקיף של קובץ ההתכתבות (64,511 שורות) והשוואה לתיעוד הקיים.

---

## חלק א': מיפוי מסכים קיימים מול דרישות

### סטטוס: ✅ קיים בפרונטנד | ⚙️ צריך בקנד | 📋 הדרישה

| מסך | קובץ | סטטוס פרונטנד | צריך בבקנד |
|-----|------|---------------|------------|
| **Dashboard** | Dashboard.jsx | ✅ | ⚙️ getDashboardData API |
| **ספירת מלאי** | InventoryCount.jsx | ✅ | ⚙️ saveInventoryCount, getReagentsByCategory |
| **קליטת משלוח** | NewDelivery.jsx | ✅ | ⚙️ createDelivery, updateInventory |
| **עריכת משלוח** | EditDelivery.jsx | ✅ | ⚙️ getDelivery, updateDelivery |
| **רשימת משלוחים** | Deliveries.jsx | ✅ | ⚙️ getDeliveries |
| **הזמנה חדשה** | NewOrder.jsx | ✅ | ⚙️ createOrder |
| **עריכת הזמנה** | EditOrder.jsx | ✅ | ⚙️ getOrder, updateOrder |
| **רשימת הזמנות** | Orders.jsx | ✅ | ⚙️ getOrders |
| **משיכה חדשה** | NewWithdrawalRequest.jsx | ✅ | ⚙️ createWithdrawal, checkAvailableQuantities |
| **עריכת משיכה** | EditWithdrawalRequest.jsx | ✅ | ⚙️ getWithdrawal, updateWithdrawal |
| **רשימת משיכות** | WithdrawalRequests.jsx | ✅ | ⚙️ getWithdrawals |
| **ניהול אצוות ותפוגות** | BatchAndExpiryManagement.jsx | ✅ | ⚙️ getBatches, updateBatchStatus |
| **עריכת אצווה** | EditReagentBatch.jsx | ✅ | ⚙️ getBatch, updateBatch |
| **ניהול ריאגנטים** | ManageReagents.jsx | ✅ | ⚙️ getReagents, CRUD |
| **ריאגנט חדש** | NewReagent.jsx | ✅ | ⚙️ createReagent |
| **עריכת ריאגנט** | EditReagent.jsx | ✅ | ⚙️ getReagent, updateReagent |
| **חישוב השלמות** | InventoryReplenishment.jsx | ✅ | ⚙️ calculateReplenishment |
| **ניהול ספקים** | ManageSuppliers.jsx | ✅ | ⚙️ getSuppliers, CRUD |
| **אנשי קשר** | Contacts.jsx | ✅ | ⚙️ getContacts, CRUD |
| **ייבוא אנשי קשר** | ImportContacts.jsx | ✅ | ⚙️ importContacts (CSV) |
| **בקרת איכות** | QualityAssurance.jsx | ✅ | ⚙️ getQAData, manageCOA |
| **העלאת COA** | UploadCOA.jsx | ✅ | ⚙️ uploadFile, linkCOA |
| **התראות** | AlertsManagement.jsx | ✅ | ⚙️ getAlerts, alertsEngine |
| **דוחות** | Reports.jsx | ✅ | ⚙️ generateReports |
| **יומן פעילות** | ActivityLog.jsx | ✅ | ⚙️ getActivityLog |
| **הערות דשבורד** | DashboardNotes.jsx | ✅ | ⚙️ getNotes, CRUD |
| **משלוחים יוצאים** | OutgoingShipments.jsx | ✅ | ⚙️ getShipments |
| **משלוח חדש** | NewShipment.jsx | ✅ | ⚙️ createShipment |
| **עריכת משלוח יוצא** | EditShipment.jsx | ✅ | ⚙️ getShipment, updateShipment |
| **מעקב אספקות** | SupplyTracking.jsx | ✅ | ⚙️ getSupplyTracking |
| **הגדרות מערכת** | SystemSettings.jsx | ✅ | ⚙️ getSettings, updateSettings |
| **פאנל ניהול** | AdminPanel.jsx | ✅ | ⚙️ adminFunctions |
| **ניקוי נתונים** | CleanupData.jsx | ✅ | ⚙️ cleanupOperations |
| **ארכיון** | ArchivedDataViewer.jsx | ✅ | ⚙️ getArchivedData |
| **נתוני צריכה** | UsageDataManagement.jsx | ✅ | ⚙️ getUsageData, updateUsage |

---

## חלק ב': ישויות (Entities) - סכמת Prisma

### 1. Reagent (ריאגנט)
```prisma
model Reagent {
  id                    String   @id @default(cuid())
  name                  String
  catalogNumber         String?
  category              Category @default(REAGENT)
  supplierId            String
  supplier              Supplier @relation(fields: [supplierId], references: [id])

  // מידע מלאי מצטבר
  totalQuantity         Decimal  @default(0)
  activeBatchesCount    Int      @default(0)
  nearestExpiryDate     DateTime?
  currentStockStatus    StockStatus @default(NORMAL)
  monthsOfStock         Decimal?

  // צריכה
  averageMonthlyUsage   Decimal?
  manualMonthlyUsage    Decimal?
  useManualUsage        Boolean  @default(false)

  // מטא
  isConsumable          Boolean  @default(false)
  requiresBatches       Boolean  @default(true)
  isDeleted             Boolean  @default(false)
  notes                 String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  batches               ReagentBatch[]
  transactions          InventoryTransaction[]
  orderItems            OrderItem[]
  withdrawalItems       WithdrawalItem[]
  deliveryItems         DeliveryItem[]
  shipmentItems         ShipmentItem[]
}

enum Category {
  REAGENT      // ריאגנטים
  CELLS        // כדוריות
  CONSUMABLE   // מתכלים
}

enum StockStatus {
  NORMAL
  LOW
  CRITICAL
  OUT_OF_STOCK
}
```

### 2. ReagentBatch (אצווה)
```prisma
model ReagentBatch {
  id                    String   @id @default(cuid())
  reagentId             String
  reagent               Reagent  @relation(fields: [reagentId], references: [id])

  batchNumber           String
  expiryDate            DateTime
  manufactureDate       DateTime?

  // כמויות
  initialQuantity       Decimal
  currentQuantity       Decimal
  reservedQuantity      Decimal  @default(0)

  // קבלה
  receivedDate          DateTime
  deliveryId            String?
  delivery              Delivery? @relation(fields: [deliveryId], references: [id])
  firstOpenedDate       DateTime?

  // אחסון
  storageLocation       String?
  storageConditions     String?

  // סטטוס ואיכות
  status                BatchStatus @default(ACTIVE)
  qcStatus              QCStatus    @default(PENDING)
  coaDocumentUrl        String?
  qcNotes               String?
  generalNotes          String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  transactions          InventoryTransaction[]
  expiredProductLogs    ExpiredProductLog[]
}

enum BatchStatus {
  INCOMING     // בדרך
  ACTIVE       // פעיל
  EXPIRED      // פג תוקף
  CONSUMED     // נצרך
  ON_HOLD      // בהסגר
  DESTROYED    // הושמד
}

enum QCStatus {
  PENDING
  APPROVED
  REJECTED
  REQUIRES_REVIEW
}
```

### 3. Supplier (ספק)
```prisma
model Supplier {
  id                    String   @id @default(cuid())
  name                  String   @unique
  shortCode             String?

  // פרטים
  address               String?
  phone                 String?
  email                 String?
  website               String?

  // תנאים
  defaultCurrency       String   @default("ILS")
  paymentTerms          String?
  leadTimeDays          Int?

  // סטטוס
  isPreferred           Boolean  @default(false)
  isActive              Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  reagents              Reagent[]
  contacts              SupplierContact[]
  orders                Order[]
  deliveries            Delivery[]
  withdrawalRequests    WithdrawalRequest[]
}
```

### 4. SupplierContact (איש קשר)
```prisma
model SupplierContact {
  id                    String   @id @default(cuid())
  supplierId            String
  supplier              Supplier @relation(fields: [supplierId], references: [id])

  name                  String
  role                  String?
  phone                 String?
  mobile                String?
  email                 String?
  notes                 String?

  isPrimary             Boolean  @default(false)
  isActive              Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 5. Order (הזמנה)
```prisma
model Order {
  id                    String   @id @default(cuid())

  // מספרים
  tempNumber            String   @unique
  permanentNumber       String?
  sapPurchaseOrder      String?

  // ספק
  supplierId            String
  supplier              Supplier @relation(fields: [supplierId], references: [id])
  supplierSnapshot      String   // שם ספק בעת ההזמנה

  // סוג וסטטוס
  orderType             OrderType @default(IMMEDIATE)
  status                OrderStatus @default(DRAFT)

  // תאריכים
  orderDate             DateTime @default(now())
  expectedDeliveryStart DateTime?
  expectedDeliveryEnd   DateTime?
  closedDate            DateTime?

  // כספים
  totalValue            Decimal?
  currency              String   @default("ILS")

  // הערות
  internalNotes         String?
  supplierNotes         String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  items                 OrderItem[]
  deliveries            Delivery[]
  frameworkOrder        FrameworkOrder?
}

enum OrderType {
  IMMEDIATE    // הזמנה רגילה
  FRAMEWORK    // הזמנת מסגרת
}

enum OrderStatus {
  DRAFT              // טיוטה
  PENDING_SAP        // ממתין לפרטי SAP
  APPROVED           // מאושר
  PARTIALLY_RECEIVED // התקבל חלקית
  FULLY_RECEIVED     // התקבל מלא
  CLOSED             // סגור
  CANCELLED          // בוטל
}
```

### 6. OrderItem (פריט הזמנה)
```prisma
model OrderItem {
  id                    String   @id @default(cuid())
  orderId               String
  order                 Order    @relation(fields: [orderId], references: [id])
  reagentId             String
  reagent               Reagent  @relation(fields: [reagentId], references: [id])

  requestedQuantity     Decimal
  approvedQuantity      Decimal?
  receivedQuantity      Decimal  @default(0)
  remainingQuantity     Decimal?

  unitPrice             Decimal?
  currency              String   @default("ILS")

  notes                 String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 7. FrameworkOrder (הזמנת מסגרת)
```prisma
model FrameworkOrder {
  id                    String   @id @default(cuid())
  orderId               String   @unique
  order                 Order    @relation(fields: [orderId], references: [id])

  validFrom             DateTime
  validTo               DateTime
  maxTotalQuantity      Decimal?
  availableQuantity     Decimal?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  items                 FrameworkOrderItem[]
  withdrawalRequests    WithdrawalRequest[]
}
```

### 8. FrameworkOrderItem (פריט מסגרת)
```prisma
model FrameworkOrderItem {
  id                    String   @id @default(cuid())
  frameworkOrderId      String
  frameworkOrder        FrameworkOrder @relation(fields: [frameworkOrderId], references: [id])
  reagentId             String

  allocatedQuantity     Decimal
  consumedQuantity      Decimal  @default(0)
  availableQuantity     Decimal

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 9. WithdrawalRequest (בקשת משיכה)
```prisma
model WithdrawalRequest {
  id                    String   @id @default(cuid())
  withdrawalNumber      String   @unique

  // ספק ומסגרת
  supplierId            String
  supplier              Supplier @relation(fields: [supplierId], references: [id])
  supplierSnapshot      String
  frameworkOrderId      String?
  frameworkOrder        FrameworkOrder? @relation(fields: [frameworkOrderId], references: [id])

  // סטטוס
  status                WithdrawalStatus @default(DRAFT)

  // תאריכים
  requestDate           DateTime @default(now())
  approvalDate          DateTime?
  completionDate        DateTime?

  // כספים
  totalValueRequested   Decimal?
  totalValueApproved    Decimal?

  // הערות
  requesterNotes        String?
  approverNotes         String?

  // משתמשים
  requestedById         String?
  approvedById          String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  items                 WithdrawalItem[]
  deliveries            Delivery[]
}

enum WithdrawalStatus {
  DRAFT      // טיוטה
  SUBMITTED  // הוגש
  APPROVED   // מאושר
  SHIPPING   // באספקה
  CLOSED     // סגור
  CANCELLED  // בוטל
}
```

### 10. WithdrawalItem (פריט משיכה)
```prisma
model WithdrawalItem {
  id                    String   @id @default(cuid())
  withdrawalRequestId   String
  withdrawalRequest     WithdrawalRequest @relation(fields: [withdrawalRequestId], references: [id])
  reagentId             String
  reagent               Reagent  @relation(fields: [reagentId], references: [id])

  requestedQuantity     Decimal
  approvedQuantity      Decimal?
  fulfilledQuantity     Decimal  @default(0)

  unitPrice             Decimal?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 11. Delivery (משלוח נכנס)
```prisma
model Delivery {
  id                    String   @id @default(cuid())
  deliveryNumber        String   @unique

  // ספק
  supplierId            String
  supplier              Supplier @relation(fields: [supplierId], references: [id])
  supplierSnapshot      String

  // קישורים
  orderId               String?
  order                 Order?   @relation(fields: [orderId], references: [id])
  withdrawalRequestId   String?
  withdrawalRequest     WithdrawalRequest? @relation(fields: [withdrawalRequestId], references: [id])

  // תאריכים וסטטוס
  deliveryDate          DateTime
  status                DeliveryStatus @default(NEW)

  // תיעוד
  documentUrl           String?
  isRecurringSupply     Boolean  @default(false)
  notes                 String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  items                 DeliveryItem[]
  batches               ReagentBatch[]
}

enum DeliveryStatus {
  NEW        // חדש
  PROCESSING // בעיבוד
  COMPLETED  // הושלם
  CANCELLED  // בוטל
}
```

### 12. DeliveryItem (פריט משלוח)
```prisma
model DeliveryItem {
  id                    String   @id @default(cuid())
  deliveryId            String
  delivery              Delivery @relation(fields: [deliveryId], references: [id])
  reagentId             String
  reagent               Reagent  @relation(fields: [reagentId], references: [id])

  batchNumber           String
  quantity              Decimal
  expiryDate            DateTime

  acceptedQuantity      Decimal?
  rejectedQuantity      Decimal?
  rejectionReason       String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 13. Shipment (משלוח יוצא)
```prisma
model Shipment {
  id                    String   @id @default(cuid())
  shipmentNumber        String   @unique

  destinationHospital   String
  destinationDepartment String?

  shipmentDate          DateTime
  status                ShipmentStatus @default(DRAFT)

  documentUrl           String?
  notes                 String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  items                 ShipmentItem[]
}

enum ShipmentStatus {
  DRAFT     // טיוטה
  SENT      // נשלח
  RECEIVED  // התקבל
  CANCELLED // בוטל
}
```

### 14. ShipmentItem (פריט משלוח יוצא)
```prisma
model ShipmentItem {
  id                    String   @id @default(cuid())
  shipmentId            String
  shipment              Shipment @relation(fields: [shipmentId], references: [id])
  reagentId             String
  reagent               Reagent  @relation(fields: [reagentId], references: [id])
  batchId               String?

  quantity              Decimal

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 15. InventoryCountDraft (טיוטת ספירה)
```prisma
model InventoryCountDraft {
  id                    String   @id @default(cuid())

  startedAt             DateTime @default(now())
  lastSavedAt           DateTime @updatedAt
  status                CountDraftStatus @default(DRAFT)

  startedById           String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  entries               InventoryCountEntry[]
}

enum CountDraftStatus {
  DRAFT       // טיוטה
  IN_PROGRESS // בתהליך
  COMPLETED   // הושלם
}
```

### 16. InventoryCountEntry (שורת ספירה)
```prisma
model InventoryCountEntry {
  id                    String   @id @default(cuid())
  countDraftId          String
  countDraft            InventoryCountDraft @relation(fields: [countDraftId], references: [id])

  reagentId             String
  batchNumber           String?

  countedQuantity       Decimal
  expiryDate            DateTime?

  notes                 String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### 17. CompletedInventoryCount (ספירה מושלמת)
```prisma
model CompletedInventoryCount {
  id                    String   @id @default(cuid())

  countDate             DateTime
  completedAt           DateTime @default(now())

  totalReagentsCounted  Int
  totalBatchesCounted   Int
  varianceSummary       Json?

  csvExportUrl          String?
  pdfReportUrl          String?

  completedById         String?

  createdAt             DateTime @default(now())
}
```

### 18. InventoryTransaction (תנועת מלאי)
```prisma
model InventoryTransaction {
  id                    String   @id @default(cuid())

  reagentId             String
  reagent               Reagent  @relation(fields: [reagentId], references: [id])
  batchId               String?
  batch                 ReagentBatch? @relation(fields: [batchId], references: [id])

  transactionType       TransactionType
  quantityDelta         Decimal  // חיובי להוספה, שלילי להפחתה

  // מקור
  sourceType            String?  // delivery, withdrawal, count, destruction
  sourceId              String?

  performedById         String?
  notes                 String?

  createdAt             DateTime @default(now())
}

enum TransactionType {
  RECEIPT      // קבלה
  CONSUMPTION  // צריכה
  WITHDRAWAL   // משיכה
  ADJUSTMENT   // התאמה
  DESTRUCTION  // השמדה
  TRANSFER_IN  // העברה נכנסת
  TRANSFER_OUT // העברה יוצאת
}
```

### 19. ExpiredProductLog (רישום פג תוקף)
```prisma
model ExpiredProductLog {
  id                    String   @id @default(cuid())

  reagentId             String
  batchId               String
  batch                 ReagentBatch @relation(fields: [batchId], references: [id])

  quantity              Decimal
  actionTaken           ExpiredAction

  handledById           String?
  handledAt             DateTime @default(now())
  reason                String?
  notes                 String?

  createdAt             DateTime @default(now())
}

enum ExpiredAction {
  DESTROYED     // הושמד
  CONSUMED      // שימוש
  NOT_IN_STOCK  // לא במלאי
  OTHER         // אחר
}
```

### 20. AlertRule (כלל התראה)
```prisma
model AlertRule {
  id                    String   @id @default(cuid())

  ruleType              AlertRuleType
  name                  String
  description           String?

  // פרמטרים
  thresholdDays         Int?     // לפגי תוקף
  thresholdQuantity     Decimal? // למלאי נמוך
  thresholdMonths       Decimal? // לחודשי מלאי

  // קטגוריות
  appliesTo             Category[] // לאילו קטגוריות

  isActive              Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // קשרים
  alerts                ActiveAlert[]
}

enum AlertRuleType {
  EXPIRY_WARNING      // פג תוקף קרוב
  LOW_STOCK           // מלאי נמוך
  PENDING_SUPPLY      // אספקה ממתינה
  COUNT_REQUIRED      // נדרשת ספירה
  COA_MISSING         // חסר COA
  CUSTOM              // מותאם אישית
}
```

### 21. ActiveAlert (התראה פעילה)
```prisma
model ActiveAlert {
  id                    String   @id @default(cuid())

  alertRuleId           String
  alertRule             AlertRule @relation(fields: [alertRuleId], references: [id])

  // מה מתריע
  entityType            String   // reagent, batch, order, etc.
  entityId              String

  severity              AlertSeverity @default(MEDIUM)
  status                AlertStatus   @default(NEW)

  message               String
  details               Json?

  // טיפול
  resolvedById          String?
  resolvedAt            DateTime?
  resolutionNotes       String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum AlertSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AlertStatus {
  NEW
  IN_PROGRESS
  RESOLVED
  DISMISSED
}
```

### 22. DashboardNote (הערת דשבורד)
```prisma
model DashboardNote {
  id                    String   @id @default(cuid())

  title                 String?
  content               String
  noteType              NoteType @default(GENERAL)

  priority              Int      @default(0)
  isPinned              Boolean  @default(false)

  ctaRoute              String?  // קישור לדף

  createdById           String?
  dismissedAt           DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum NoteType {
  GENERAL
  TASK
  REMINDER
  ALERT
  INFO
}
```

### 23. SystemSettings (הגדרות מערכת)
```prisma
model SystemSettings {
  id                    String   @id @default(cuid())
  key                   String   @unique
  value                 Json
  description           String?

  updatedAt             DateTime @updatedAt
}

// הגדרות מרכזיות:
// - alertDaysReagents: 30
// - alertDaysCells: 10
// - lowStockMonthsThreshold: 2
// - defaultArchivalYears: 2
// - autoCountReminderDays: 30
```

### 24. ArchivedData (נתונים בארכיון)
```prisma
model ArchivedData {
  id                    String   @id @default(cuid())

  entityType            String
  entityId              String
  payload               Json

  archivedAt            DateTime @default(now())
  archivedById          String?

  restoredAt            DateTime?
  restoredById          String?
}
```

### 25. User (משתמש) - לאימות
```prisma
model User {
  id                    String   @id @default(cuid())
  email                 String   @unique
  name                  String
  role                  UserRole @default(USER)

  isActive              Boolean  @default(true)
  lastLoginAt           DateTime?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum UserRole {
  ADMIN
  MANAGER
  USER
  READONLY
}
```

---

## חלק ג': API Endpoints נדרשים

### Dashboard
```
GET  /api/dashboard           - נתוני דשבורד מרוכזים
GET  /api/dashboard/alerts    - התראות פעילות
GET  /api/dashboard/notes     - הערות
POST /api/dashboard/notes     - הערה חדשה
```

### Reagents
```
GET    /api/reagents              - רשימת ריאגנטים
GET    /api/reagents/:id          - פרטי ריאגנט
POST   /api/reagents              - ריאגנט חדש
PUT    /api/reagents/:id          - עדכון ריאגנט
DELETE /api/reagents/:id          - מחיקת ריאגנט
GET    /api/reagents/by-category  - לפי קטגוריה וספק
```

### Batches
```
GET    /api/batches               - רשימת אצוות
GET    /api/batches/:id           - פרטי אצווה
POST   /api/batches               - אצווה חדשה
PUT    /api/batches/:id           - עדכון אצווה
PUT    /api/batches/:id/status    - שינוי סטטוס
GET    /api/batches/expiring      - אצוות בפגיעה
```

### Inventory
```
GET  /api/inventory/count/draft         - טיוטת ספירה נוכחית
POST /api/inventory/count/draft         - שמירת טיוטה
POST /api/inventory/count/complete      - השלמת ספירה
GET  /api/inventory/count/history       - היסטוריית ספירות
GET  /api/inventory/replenishment       - חישוב השלמות
GET  /api/inventory/transactions        - תנועות מלאי
```

### Orders
```
GET    /api/orders                - רשימת הזמנות
GET    /api/orders/:id            - פרטי הזמנה
POST   /api/orders                - הזמנה חדשה
PUT    /api/orders/:id            - עדכון הזמנה
PUT    /api/orders/:id/status     - שינוי סטטוס
DELETE /api/orders/:id            - מחיקה
```

### Withdrawals
```
GET    /api/withdrawals           - רשימת משיכות
GET    /api/withdrawals/:id       - פרטי משיכה
POST   /api/withdrawals           - משיכה חדשה
PUT    /api/withdrawals/:id       - עדכון משיכה
PUT    /api/withdrawals/:id/status
GET    /api/withdrawals/available - יתרות זמינות
```

### Deliveries
```
GET    /api/deliveries            - רשימת משלוחים
GET    /api/deliveries/:id        - פרטי משלוח
POST   /api/deliveries            - משלוח חדש
PUT    /api/deliveries/:id        - עדכון משלוח
POST   /api/deliveries/:id/process - עיבוד משלוח
```

### Shipments (יוצאים)
```
GET    /api/shipments             - רשימת משלוחים יוצאים
GET    /api/shipments/:id
POST   /api/shipments
PUT    /api/shipments/:id
```

### Suppliers
```
GET    /api/suppliers
GET    /api/suppliers/:id
POST   /api/suppliers
PUT    /api/suppliers/:id
GET    /api/suppliers/:id/contacts
```

### Alerts
```
GET    /api/alerts
PUT    /api/alerts/:id/resolve
POST   /api/alerts/engine/run     - הרצת מנוע התראות
```

### Reports
```
GET  /api/reports/consumption     - דוח צריכה
GET  /api/reports/expiry          - דוח תפוגות
GET  /api/reports/inventory       - דוח מלאי
POST /api/reports/generate        - הפקת דוח
```

### Files
```
POST /api/files/upload            - העלאת קובץ
GET  /api/files/:id               - הורדת קובץ
POST /api/files/coa/:batchId      - קישור COA לאצווה
```

### System
```
GET  /api/settings
PUT  /api/settings/:key
GET  /api/activity-log
POST /api/cleanup
GET  /api/archived
```

---

## חלק ד': Jobs ומשימות רקע

### 1. alertsEngine (כל 30 דקות)
```typescript
// מה בודק:
- פגי תוקף: כדוריות 10 ימים, ריאגנטים 30 יום
- מלאי נמוך: פחות מ-2 חודשי מלאי
- אספקות ממתינות: הזמנות/משיכות פתוחות
- ספירת מלאי: אם עבר חודש מהספירה האחרונה
- COA חסר: אצוות ללא תעודה

// מה עושה:
- יוצר/מעדכן ActiveAlert
- שולח התראות (בעתיד: אימייל/SMS)
```

### 2. archiveOldData (יומי)
```typescript
// מה עושה:
- מעביר נתונים מעל שנתיים לארכיון
- שומר סיכום בArchivedData
```

### 3. summaryUpdates (יומי)
```typescript
// מה עושה:
- מעדכן שדות מצטברים בReagent
- מחשב averageMonthlyUsage
- מעדכן monthsOfStock
```

---

## חלק ה': כללי עסקים מרכזיים

### התראות תפוגה
| קטגוריה | ימים לפני | חומרה |
|---------|----------|-------|
| כדוריות | 10 | CRITICAL |
| כדוריות | 14 | HIGH |
| ריאגנטים | 30 | HIGH |
| ריאגנטים | 45 | MEDIUM |

### סטטוסי מלאי
| מצב | תנאי |
|-----|------|
| CRITICAL | monthsOfStock < 1 |
| LOW | monthsOfStock < 2 |
| NORMAL | monthsOfStock >= 2 |

### חישוב צריכה
```
צריכה חודשית = (מלאי בספירה קודמת + קבלות - מלאי נוכחי) / מספר חודשים
חודשי מלאי = מלאי נוכחי / צריכה חודשית
```

---

## חלק ו': סדר עדיפויות לפיתוח

### שלב 1 - בסיס (1-2 שבועות)
1. סכמת Prisma מלאה
2. Seed data מהCSV
3. API בסיסי לריאגנטים ואצוות

### שלב 2 - ליבה (2-3 שבועות)
4. ספירת מלאי
5. קליטת משלוחים
6. מנוע התראות

### שלב 3 - הזמנות (2 שבועות)
7. הזמנות ומשיכות
8. הזמנות מסגרת
9. מעקב אספקות

### שלב 4 - דוחות ואינטגרציות (1-2 שבועות)
10. דוחות וייצוא
11. ניהול קבצים (COA)
12. חיבור הפרונטנד

### שלב 5 - שיפורים (1 שבוע)
13. אופטימיזציות
14. בדיקות
15. תיעוד

---

*מסמך זה נוצר ב-7 בדצמבר 2025 על בסיס ניתוח מקיף של דרישות המערכת.*
