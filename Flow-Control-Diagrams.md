# Flow Control — תרשימים, מבנה נתונים ולוגיקה עסקית

## מסמך טכני-ויזואלי לבניית מערכת מקבילה ב-SAP

---

## תוכן עניינים

1. [מבנה נתונים (ERD)](#1-מבנה-נתונים-erd)
2. [מחזור חיי אצווה (Batch Lifecycle)](#2-מחזור-חיי-אצווה)
3. [תהליך רכש — הזמנה מיידית](#3-תהליך-רכש--הזמנה-מיידית)
4. [תהליך רכש — הזמנת מסגרת ובקשות משיכה](#4-תהליך-רכש--הזמנת-מסגרת-ובקשות-משיכה)
5. [קליטת משלוח (Goods Receipt)](#5-קליטת-משלוח)
6. [הוצאה מהמלאי (Dispensing)](#6-הוצאה-מהמלאי)
7. [פריטים בשימוש והשלכה חלקית](#7-פריטים-בשימוש-והשלכה-חלקית)
8. [ספירת מלאי פיזית](#8-ספירת-מלאי-פיזית)
9. [חישוב השלמות מלאי (Replenishment)](#9-חישוב-השלמות-מלאי)
10. [מנוע התראות](#10-מנוע-התראות)
11. [סטטוס מלאי ריאגנט (Stock Status)](#11-סטטוס-מלאי-ריאגנט)
12. [סקירת מסכים ופעולות](#12-סקירת-מסכים-ופעולות)
13. [משלוחים יוצאים](#13-משלוחים-יוצאים)
14. [בקרת איכות (QC)](#14-בקרת-איכות)
15. [סריקת ברקודים](#15-סריקת-ברקודים)
16. [תנועות מלאי (Inventory Transactions)](#16-תנועות-מלאי)

---

## 1. מבנה נתונים (ERD)

### 1.1 ישויות ליבה — ריאגנטים, ספקים, אצוות

```mermaid
erDiagram
    SUPPLIER ||--o{ REAGENT : "ספק_מועדף"
    SUPPLIER ||--o{ SUPPLIER_CONTACT : "אנשי_קשר"
    REAGENT ||--o{ REAGENT_BATCH : "אצוות"
    REAGENT ||--o{ INVENTORY_TRANSACTION : "תנועות"

    SUPPLIER {
        string id PK
        string name "שם הספק"
        string shortCode "קוד קצר"
        string phone "טלפון"
        string email "אימייל"
        int leadTimeDays "זמן אספקה (ימים)"
        string paymentTerms "תנאי תשלום"
        boolean isPreferred "ספק מועדף"
    }

    SUPPLIER_CONTACT {
        string id PK
        string supplierId FK
        string name "שם"
        string role "תפקיד"
        string phone "טלפון"
        string email "אימייל"
        boolean isPrimary "איש קשר ראשי"
    }

    REAGENT {
        string id PK
        string name "שם הריאגנט"
        string catalogNumber "מספר קטלוגי"
        enum category "קטגוריה: REAGENT/CELLS/CONSUMABLE"
        string supplierId FK
        decimal totalQuantity "סה''כ כמות (מחושב)"
        int activeBatchesCount "מס' אצוות פעילות (מחושב)"
        date nearestExpiryDate "תפוגה קרובה (מחושב)"
        enum currentStockStatus "NORMAL/LOW/CRITICAL/OUT_OF_STOCK"
        decimal monthsOfStock "חודשי מלאי (מחושב)"
        decimal averageMonthlyUsage "צריכה חודשית ממוצעת"
        decimal manualMonthlyUsage "צריכה חודשית ידנית"
        boolean requiresBatches "דורש ניהול אצוות"
    }

    REAGENT_BATCH {
        string id PK
        string reagentId FK
        string batchNumber "מספר אצווה"
        date expiryDate "תאריך תפוגה"
        date manufactureDate "תאריך ייצור"
        int initialQuantity "כמות התחלתית"
        int currentQuantity "כמות נוכחית"
        int reservedQuantity "כמות שמורה"
        string storageLocation "מיקום אחסון"
        enum status "INCOMING/ACTIVE/IN_USE/EXPIRED/CONSUMED/ON_HOLD/DESTROYED"
        enum qcStatus "PENDING/APPROVED/REJECTED/REQUIRES_REVIEW"
        string coaDocumentUrl "קישור תעודת אנליזה"
        string deliveryId FK
    }

    INVENTORY_TRANSACTION {
        string id PK
        string reagentId FK
        string batchId FK
        enum transactionType "RECEIPT/CONSUMPTION/WITHDRAWAL/ADJUSTMENT/DESTRUCTION/TRANSFER_IN/TRANSFER_OUT"
        int quantityDelta "שינוי כמות (+/-)"
        string sourceType "מקור: order/dispense/count/..."
        string sourceId "מזהה מקור"
        datetime createdAt "תאריך"
    }
```

### 1.2 שרשרת רכש — הזמנות, מסגרת, משיכות

```mermaid
erDiagram
    SUPPLIER ||--o{ ORDER : "הזמנות"
    ORDER ||--o{ ORDER_ITEM : "פריטים"
    ORDER_ITEM }o--|| REAGENT : "ריאגנט"
    ORDER ||--o| FRAMEWORK_ORDER : "מסגרת"
    FRAMEWORK_ORDER ||--o{ FRAMEWORK_ORDER_ITEM : "הקצאות"
    FRAMEWORK_ORDER ||--o{ WITHDRAWAL_REQUEST : "בקשות_משיכה"
    WITHDRAWAL_REQUEST ||--o{ WITHDRAWAL_ITEM : "פריטי_משיכה"
    ORDER ||--o{ DELIVERY : "משלוחים"
    WITHDRAWAL_REQUEST ||--o{ DELIVERY : "משלוחים"
    DELIVERY ||--o{ DELIVERY_ITEM : "פריטי_משלוח"

    ORDER {
        string id PK
        string tempNumber "מספר זמני (ORD-2026-0001)"
        string permanentNumber "מספר קבוע"
        string sapPurchaseOrder "מספר הזמנת SAP"
        string supplierId FK
        enum orderType "IMMEDIATE/FRAMEWORK"
        enum status "DRAFT/PENDING_SAP/APPROVED/PARTIALLY_RECEIVED/FULLY_RECEIVED/CLOSED/CANCELLED"
        date orderDate "תאריך הזמנה"
        date expectedDeliveryStart "אספקה צפויה - התחלה"
        date expectedDeliveryEnd "אספקה צפויה - סיום"
        decimal totalValue "ערך כולל"
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string reagentId FK
        int requestedQuantity "כמות מבוקשת"
        int approvedQuantity "כמות מאושרת"
        int receivedQuantity "כמות שהתקבלה"
        decimal unitPrice "מחיר ליחידה"
    }

    FRAMEWORK_ORDER {
        string id PK
        string orderId FK
        date validFrom "תקף מ-"
        date validTo "תקף עד"
        int maxTotalQuantity "מקסימום כמות כוללת"
        int availableQuantity "כמות זמינה (מחושב)"
    }

    WITHDRAWAL_REQUEST {
        string id PK
        string withdrawalNumber "מספר משיכה"
        string supplierId FK
        string frameworkOrderId FK
        enum status "DRAFT/SUBMITTED/APPROVED/SHIPPING/CLOSED/CANCELLED"
        date requestDate "תאריך בקשה"
        date approvalDate "תאריך אישור"
    }

    DELIVERY {
        string id PK
        string deliveryNumber "מספר משלוח"
        string supplierId FK
        string orderId FK
        string withdrawalRequestId FK
        date deliveryDate "תאריך קבלה"
        enum status "NEW/PROCESSING/COMPLETED/CANCELLED"
    }

    DELIVERY_ITEM {
        string id PK
        string deliveryId FK
        string reagentId FK
        string batchNumber "מספר אצווה"
        int quantity "כמות"
        date expiryDate "תפוגה"
        int acceptedQuantity "כמות מאושרת"
        int rejectedQuantity "כמות נדחית"
    }
```

### 1.3 הוצאה, שימוש, השלכה

```mermaid
erDiagram
    REAGENT_BATCH ||--o{ DISPENSE_EVENT : "הוצאות"
    REAGENT_BATCH ||--o{ PARTIAL_DISPOSAL : "השלכות"

    DISPENSE_EVENT {
        string id PK
        string reagentId FK
        string batchId FK
        int quantity "כמות שהוצאה"
        string dispensedById FK
        datetime dispensedAt "תאריך הוצאה"
        enum scanMethod "BARCODE/QR/MANUAL/SEARCH"
        string rawScanData "נתוני סריקה גולמיים"
        string purpose "מטרה"
    }

    PARTIAL_DISPOSAL {
        string id PK
        string reagentId FK
        string batchId FK
        decimal portionDisposed "חלק שהושלך: 0.25/0.50/0.75/1.00"
        int originalQuantity "כמות מקורית"
        enum reason "EXPIRED_IN_USE/CONTAMINATED/DAMAGED/OTHER"
        datetime disposedAt "תאריך"
    }
```

### 1.4 משלוחים יוצאים

```mermaid
erDiagram
    SHIPMENT ||--o{ SHIPMENT_ITEM : "פריטים"
    SHIPMENT_ITEM }o--|| REAGENT : "ריאגנט"
    SHIPMENT_ITEM }o--o| REAGENT_BATCH : "אצווה"

    SHIPMENT {
        string id PK
        string shipmentNumber "מספר משלוח"
        string destinationHospital "בית חולים יעד"
        string destinationDepartment "מחלקה"
        date shipmentDate "תאריך שליחה"
        enum status "DRAFT/SENT/RECEIVED/CANCELLED"
    }

    SHIPMENT_ITEM {
        string id PK
        string shipmentId FK
        string reagentId FK
        string batchId FK
        int quantity "כמות"
    }
```

---

## 2. מחזור חיי אצווה

```mermaid
stateDiagram-v2
    direction LR

    [*] --> INCOMING : קליטת משלוח
    INCOMING --> ACTIVE : אישור קליטה / בדיקת QC

    ACTIVE --> IN_USE : הוצאה מהמלאי\n(כמות=0)
    ACTIVE --> EXPIRED : תפוגה עברה
    ACTIVE --> ON_HOLD : בהמתנה\n(בעיית איכות)
    ACTIVE --> CONSUMED : נצרך במלואו\n(תנועת CONSUMPTION)

    IN_USE --> DESTROYED : השלכה מלאה\n(100%)
    IN_USE --> ACTIVE : החזרה למלאי\n(Admin בלבד)

    ON_HOLD --> ACTIVE : שוחרר\n(בדיקה עברה)
    ON_HOLD --> DESTROYED : נפסל

    EXPIRED --> DESTROYED : הושמד
    EXPIRED --> CONSUMED : נצרך למרות\nתפוגה (תיעוד)

    DESTROYED --> [*]
    CONSUMED --> [*]

    note right of ACTIVE
        הסטטוס הראשי.
        כמות > 0.
        ניתן להוצאה.
    end note

    note right of IN_USE
        הוצא מהמלאי.
        כמות = 0 אך לא הושמד.
        עדיין במעקב תפוגה.
    end note
```

---

## 3. תהליך רכש — הזמנה מיידית

```mermaid
flowchart TD
    A([משתמש פותח\nהקמת מסמך רכש]) --> B[בחירת ספק]
    B --> C[הוספת פריטים:\nריאגנט + כמות + מחיר]
    C --> D[שמירה כטיוטה]
    D --> E{שליחה ל-SAP?}

    E -- כן --> F[PENDING_SAP\nהזנה ידנית ב-SAP]
    F --> G[הוספת מספר SAP PO]
    G --> H[APPROVED\nאושר]

    E -- לא / ישיר --> H

    H --> I{הגיע משלוח?}
    I -- חלקי --> J[PARTIALLY_RECEIVED\nקליטת פריטים חלקית]
    J --> I
    I -- מלא --> K[FULLY_RECEIVED\nכל הפריטים התקבלו]
    K --> L[CLOSED\nהזמנה נסגרה]

    H --> M{ביטול?}
    M -- כן --> N[CANCELLED]

    style A fill:#e0f2fe
    style D fill:#fef3c7
    style F fill:#fce7f3
    style H fill:#d1fae5
    style J fill:#fed7aa
    style K fill:#bbf7d0
    style L fill:#e2e8f0
    style N fill:#fecaca
```

### סטטוסים:

| סטטוס | SAP מקביל | משמעות |
|--------|-----------|--------|
| `DRAFT` | דרישת רכש (ME51N) | טיוטה, ניתן לערוך |
| `PENDING_SAP` | ממתין ליצירת PO (ME21N) | הוזן ב-SAP, ממתין לאישור |
| `APPROVED` | הזמנת רכש מאושרת | מוכן לקליטה |
| `PARTIALLY_RECEIVED` | קבלה חלקית (MIGO) | חלק מהפריטים הגיעו |
| `FULLY_RECEIVED` | קבלה מלאה | כל הפריטים הגיעו |
| `CLOSED` | סגור | הזמנה הושלמה |
| `CANCELLED` | מבוטל | בוטל |

---

## 4. תהליך רכש — הזמנת מסגרת ובקשות משיכה

```mermaid
flowchart TD
    A([יצירת הזמנת מסגרת]) --> B[הגדרה:\nספק + תקופה + מקסימום כמות]
    B --> C[הקצאת כמויות לריאגנטים]
    C --> D[הזמנת מסגרת פעילה\nFramework Order]

    D --> E{צריך משיכה?}
    E -- כן --> F([יצירת בקשת משיכה])
    F --> G[בחירת ריאגנטים\nמתוך המסגרת]
    G --> H[DRAFT\nטיוטת בקשה]
    H --> I[SUBMITTED\nהוגש]
    I --> J{אישור?}
    J -- כן --> K[APPROVED\nאושר]
    J -- לא --> L[CANCELLED\nנדחה]
    K --> M[SHIPPING\nבשילוח]
    M --> N[משלוח הגיע\nקליטה]
    N --> O[CLOSED\nנסגר]

    O --> P{נותרה כמות\nבמסגרת?}
    P -- כן --> E
    P -- לא --> Q[מסגרת מוצתה]

    style A fill:#e0f2fe
    style D fill:#dbeafe
    style F fill:#e0f2fe
    style K fill:#d1fae5
    style M fill:#fef3c7
    style O fill:#e2e8f0
    style Q fill:#fecaca
```

### נוסחה: כמות זמינה במסגרת

```
כמות_זמינה = מקסימום_כולל - סכום(כמות_מבוקשת בכל בקשות המשיכה הפעילות)
```

---

## 5. קליטת משלוח

```mermaid
flowchart TD
    A([משלוח הגיע\nמהספק]) --> B[יצירת רשומת Delivery]
    B --> C[קישור להזמנה\nאו בקשת משיכה]
    C --> D[הוספת פריטים:\nריאגנט + אצווה + כמות + תפוגה]

    D --> E{לכל פריט}
    E --> F[יצירת ReagentBatch חדשה\nסטטוס: ACTIVE]
    F --> G[יצירת InventoryTransaction\nסוג: RECEIPT, כמות: +X]
    G --> H[עדכון כמויות שהתקבלו\nב-OrderItem]

    H --> I[updateReagentAggregates]
    I --> J[חישוב מחדש:\ntotalQuantity\nactiveBatchesCount\nnearestExpiryDate\ncurrentStockStatus\nmonthsOfStock]

    J --> K{עוד פריטים?}
    K -- כן --> E
    K -- לא --> L[עדכון סטטוס הזמנה]

    L --> M{כל הפריטים\nהתקבלו?}
    M -- כן --> N[FULLY_RECEIVED]
    M -- חלקית --> O[PARTIALLY_RECEIVED]

    P[העלאת תעודת אנליזה COA] -.-> F

    style A fill:#e0f2fe
    style F fill:#d1fae5
    style G fill:#fef3c7
    style N fill:#bbf7d0
    style O fill:#fed7aa
```

### תנועת מלאי שנוצרת:

| שדה | ערך |
|------|------|
| transactionType | `RECEIPT` |
| quantityDelta | `+כמות שהתקבלה` |
| sourceType | `order` |
| sourceId | `מזהה ההזמנה` |

---

## 6. הוצאה מהמלאי

```mermaid
flowchart TD
    A([טכנאי צריך ריאגנט]) --> B{שיטת זיהוי?}

    B -- סריקת ברקוד --> C[סריקת GS1/QR/DataMatrix]
    C --> D[פענוח:\nמספר אצווה + תפוגה + קטלוגי]
    D --> E[חיפוש אצווה ACTIVE\nעם כמות > 0]

    B -- חיפוש ידני --> F[חיפוש לפי שם/\nמספר קטלוגי/אצווה]
    F --> E

    E --> G{נמצאה אצווה?}
    G -- לא --> H[שגיאה:\nלא נמצאה אצווה פעילה]
    G -- כן --> I[אישור:\nכמות + מטרה]

    I --> J{כמות\nמספיקה?}
    J -- לא --> K[שגיאה:\nכמות לא מספיקה]
    J -- כן --> L[עדכון אצווה:\ncurrentQuantity -= כמות]

    L --> M{כמות חדשה = 0?}
    M -- כן --> N[סטטוס -> IN_USE]
    M -- לא --> O[סטטוס נשאר ACTIVE]

    N --> P[יצירת DispenseEvent]
    O --> P
    P --> Q[יצירת InventoryTransaction\nסוג: CONSUMPTION, כמות: -X]
    Q --> R[updateReagentAggregates]

    style A fill:#e0f2fe
    style C fill:#dbeafe
    style N fill:#fef3c7
    style P fill:#d1fae5
    style H fill:#fecaca
    style K fill:#fecaca
```

### לוגיקה:

```
כמות_חדשה = כמות_נוכחית - כמות_מוצאת

אם כמות_חדשה <= 0:
    סטטוס_אצווה = IN_USE    // הועבר לשימוש
אחרת:
    סטטוס_אצווה = ACTIVE    // עדיין זמין
```

---

## 7. פריטים בשימוש והשלכה חלקית

```mermaid
flowchart TD
    A[אצווה בסטטוס IN_USE] --> B{מה קורה עם הפריט?}

    B -- שימוש רגיל --> C[ממשיך במעקב תפוגה]
    C --> D{פג תוקף בזמן שימוש?}
    D -- כן --> E[התראה: EXPIRED_IN_USE]

    B -- השלכה חלקית --> F{כמה הושלך?}
    F -- 25% --> G1["portionDisposed = 0.25\nבזבוז = כמות × 0.25\nניצול = כמות × 0.75"]
    F -- 50% --> G2["portionDisposed = 0.50\nבזבוז = כמות × 0.50\nניצול = כמות × 0.50"]
    F -- 75% --> G3["portionDisposed = 0.75\nבזבוז = כמות × 0.75\nניצול = כמות × 0.25"]
    F -- 100% --> G4["portionDisposed = 1.00\nבזבוז = כמות × 1.00\nניצול = 0"]

    G1 --> H[יצירת PartialDisposal]
    G2 --> H
    G3 --> H
    G4 --> I[יצירת PartialDisposal\n+ סטטוס -> DESTROYED]

    B -- החזרה למלאי --> J{Admin בלבד}
    J --> K[שחזור כמות מקורית]
    K --> L[סטטוס -> ACTIVE]
    L --> M[יצירת InventoryTransaction\nסוג: ADJUSTMENT, כמות: +X]

    style A fill:#fef3c7
    style E fill:#fecaca
    style I fill:#fecaca
    style L fill:#d1fae5
    style J fill:#e0e7ff
```

### נוסחת חישוב בזבוז:

```
בזבוז = כמות_מקורית × חלק_השלכה
ניצול_בפועל = כמות_מקורית - בזבוז
= כמות_מקורית × (1 - חלק_השלכה)
```

---

## 8. ספירת מלאי פיזית

```mermaid
flowchart TD
    A([התחלת ספירה]) --> B{קיימת טיוטה?}
    B -- כן --> C[טעינת טיוטה קיימת]
    B -- לא --> D[יצירת טיוטה חדשה\nDRAFT]

    C --> E[הצגת כל הריאגנטים\nעם אצוות ACTIVE]
    D --> E

    E --> F[ספירה:\nהזנת כמות נספרת\nלכל אצווה]
    F --> G{אצווה חדשה\nנמצאה בספירה?}
    G -- כן --> H[הוספת אצווה חדשה:\nמספר + תפוגה + כמות]
    G -- לא --> I[המשך]
    H --> I

    I --> J[שמירת טיוטה\nIN_PROGRESS]
    J --> K{סיום ספירה?}
    K -- לא, המשך מאוחר --> J
    K -- כן --> L[השלמת ספירה\nTransaction]

    L --> M{לכל אצווה שנספרה}
    M --> N{אצווה קיימת?}
    N -- כן --> O[עדכון כמות\ncurrentQuantity = countedQuantity]
    N -- לא --> P[יצירת אצווה חדשה]

    O --> Q["יצירת InventoryTransaction\nסוג: ADJUSTMENT\ndelta = נספר - מערכת"]
    P --> Q

    Q --> R[updateReagentAggregates]
    R --> S{עוד אצוות?}
    S -- כן --> M
    S -- לא --> T[יצירת CompletedInventoryCount\nארכיון]
    T --> U[טיוטה -> COMPLETED]

    style A fill:#e0f2fe
    style J fill:#fef3c7
    style L fill:#d1fae5
    style T fill:#e2e8f0
```

### לוגיקה:

```
לכל אצווה שנספרה:
    הפרש = כמות_נספרת - כמות_במערכת

    אם אצווה קיימת:
        עדכון currentQuantity = כמות_נספרת
        יצירת תנועה ADJUSTMENT עם delta = הפרש
    אם אצווה חדשה (+ תפוגה):
        יצירת אצווה חדשה עם כמות = כמות_נספרת
        יצירת תנועה ADJUSTMENT עם delta = כמות_נספרת
```

---

## 9. חישוב השלמות מלאי

```mermaid
flowchart TD
    A([חישוב השלמות]) --> B[טעינת כל הריאגנטים\nעם נתוני צריכה]

    B --> C{לכל ריאגנט}
    C --> D[צריכה = ידנית או ממוצעת]
    D --> E["מלאי_יעד = צריכה × חודשי_תכנון"]
    E --> F["מלאי_בטחון = צריכה × 0.5 (2 שבועות)"]
    F --> G["סה''כ_נדרש = מלאי_יעד + מלאי_בטחון"]

    G --> H[מלאי_נוכחי = totalQuantity]
    H --> I["במשלוח = כמויות מהזמנות\nמאושרות + בקשות משיכה"]
    I --> J["כמות_קרובת_תפוגה =\nאצוות שפגות תוך 30 יום"]

    J --> K["מלאי_נטו = נוכחי + במשלוח - קרוב_תפוגה"]
    K --> L["הצעה = max(0, סה''כ_נדרש - מלאי_נטו)"]

    L --> M{הצעה > 0?}
    M -- כן --> N[הוספה לרשימת\nהמלצות להשלמה]
    M -- לא --> O[לא נדרשת השלמה]

    N --> P{עוד ריאגנטים?}
    O --> P
    P -- כן --> C
    P -- לא --> Q[מיון לפי\nחודשי מלאי\n(נמוך ביותר ראשון)]

    Q --> R{פעולה}
    R -- יצירת הזמנה --> S[createAutomaticOrder\nקיבוץ לפי ספק]
    R -- משיכה ממסגרת --> T[createAutomaticWithdrawal\nנגד הזמנת מסגרת]

    style A fill:#e0f2fe
    style N fill:#fef3c7
    style S fill:#d1fae5
    style T fill:#d1fae5
```

### נוסחה מלאה:

```
צריכה_חודשית = manualMonthlyUsage (אם הוגדר) || averageMonthlyUsage

מלאי_יעד = צריכה_חודשית × חודשי_תכנון (ברירת מחדל: 3)
מלאי_בטחון = צריכה_חודשית × 0.5
סה''כ_נדרש = מלאי_יעד + מלאי_בטחון

מלאי_נטו = מלאי_נוכחי + כמות_בהזמנות_פתוחות - כמות_קרובת_תפוגה

הצעת_הזמנה = max(0, סה''כ_נדרש - מלאי_נטו)

חודשי_מלאי = מלאי_נוכחי / צריכה_חודשית
```

---

## 10. מנוע התראות

```mermaid
flowchart TD
    A([הפעלת מנוע התראות\nידני או אוטומטי]) --> B[טעינת כל כללי ההתראה\nהפעילים]

    B --> C{לכל כלל}
    C --> D{סוג הכלל?}

    D -- EXPIRY_WARNING --> E["סרוק אצוות ACTIVE\nעם תפוגה < threshold ימים"]
    D -- LOW_STOCK --> F["סרוק ריאגנטים\nעם מלאי < threshold חודשים"]
    D -- COA_MISSING --> G["סרוק אצוות ACTIVE\nללא תעודת אנליזה"]
    D -- EXPIRED_IN_USE --> H["סרוק אצוות IN_USE\nשפגו לפני > threshold ימים"]
    D -- PENDING_SUPPLY --> I["סרוק הזמנות/משיכות\nבהמתנה > threshold ימים"]
    D -- COUNT_REQUIRED --> J["בדוק זמן מאז\nספירה אחרונה > threshold ימים"]

    E --> K{נמצאו\nישויות?}
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K

    K -- כן --> L["יצירת ActiveAlert\nלכל ישות שנמצאה"]
    K -- לא --> M[אין התראה]

    L --> N{עוד כללים?}
    M --> N
    N -- כן --> C
    N -- לא --> O[סיום]

    style A fill:#e0f2fe
    style L fill:#fecaca
    style O fill:#e2e8f0
```

### חומרת התראה ומחזור חיים:

```mermaid
stateDiagram-v2
    direction LR
    [*] --> NEW : התראה נוצרה
    NEW --> IN_PROGRESS : הוכר (Acknowledge)
    NEW --> DISMISSED : נדחה
    IN_PROGRESS --> RESOLVED : נפתר\n(עם הערות פתרון)
    IN_PROGRESS --> DISMISSED : נדחה
```

| חומרה | משמעות | דוגמה |
|--------|--------|--------|
| `CRITICAL` | דורש טיפול מיידי | ריאגנט פג תוקף היום |
| `HIGH` | דחוף | מלאי קריטי (< 1 חודש) |
| `MEDIUM` | לטיפול | מלאי נמוך (< 2 חודשים) |
| `LOW` | מידעי | חסר COA |

---

## 11. סטטוס מלאי ריאגנט

```mermaid
flowchart TD
    A[updateReagentAggregates] --> B["חישוב totalQuantity =\nסכום currentQuantity\nמכל אצוות ACTIVE"]

    B --> C["חישוב צריכה חודשית =\nידנית (אם הוגדרה)\nאו ממוצעת"]

    C --> D{totalQuantity = 0?}
    D -- כן --> E["OUT_OF_STOCK\n🔴 אזל מהמלאי"]

    D -- לא --> F{יש נתוני צריכה?}
    F -- לא --> G["NORMAL\n🟢 תקין (לא ניתן לחשב)"]

    F -- כן --> H["monthsOfStock =\ntotalQuantity / צריכה_חודשית"]

    H --> I{monthsOfStock < 1?}
    I -- כן --> J["CRITICAL\n🔴 פחות מחודש"]

    I -- לא --> K{monthsOfStock < 2?}
    K -- כן --> L["LOW\n🟡 1-2 חודשים"]
    K -- לא --> G

    style E fill:#fecaca
    style J fill:#fecaca
    style L fill:#fef3c7
    style G fill:#d1fae5
```

---

## 12. סקירת מסכים ופעולות

```mermaid
flowchart LR
    subgraph dashboard["דשבורד - מרכז הבקרה"]
        D1[התראות קריטיות]
        D2[הערות ומשימות]
        D3["4 כרטיסי מידע:\nתפוגה | מלאי נמוך | אספקות | רכש"]
        D4[פעולות אחרונות]
    end

    subgraph daily["פעולות יומיות"]
        O1[קליטת משלוח]
        O2[ספירת מלאי]
        O3[הוצאה מהמלאי]
        O4[פריטים בשימוש]
        O5[משיכת ריאגנטים]
    end

    subgraph procurement["רכש"]
        P1[הקמת הזמנה]
        P2[ניהול הזמנות]
        P3[מעקב אספקות]
        P4[חישוב השלמות]
    end

    subgraph logistics["משלוחים"]
        L1[שליחת ריאגנטים]
        L2[ניהול משלוחים יוצאים]
    end

    subgraph quality["איכות"]
        Q1[בקרת איכות]
        Q2[העלאת COA]
    end

    subgraph reporting["דוחות ומעקב"]
        R1[דוחות וגרפים]
        R2[יומן פעילות]
        R3[התראות ותזכורות]
        R4[הערות ומשימות]
    end

    subgraph master["נתוני אב"]
        M1[ניהול ריאגנטים]
        M2[ניהול ספקים]
        M3[ניהול אנשי קשר]
    end

    dashboard --> daily
    dashboard --> procurement
    daily --> logistics
    procurement --> daily
    quality --> daily
```

---

## 13. משלוחים יוצאים

```mermaid
flowchart TD
    A([יצירת משלוח יוצא]) --> B[בחירת יעד:\nבית חולים + מחלקה]
    B --> C[הוספת פריטים:\nריאגנט + אצווה + כמות]

    C --> D[DRAFT\nטיוטה]
    D --> E{שליחה?}
    E -- כן --> F[SENT\nנשלח]
    F --> G{התקבל?}
    G -- כן --> H[RECEIVED\nהתקבל]
    G -- לא --> I{ביטול?}
    I -- כן --> J[CANCELLED\nמבוטל]

    E -- ביטול --> J

    style A fill:#e0f2fe
    style D fill:#fef3c7
    style F fill:#dbeafe
    style H fill:#d1fae5
    style J fill:#fecaca
```

---

## 14. בקרת איכות

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING : אצווה חדשה\nנקלטה

    PENDING --> APPROVED : בדיקה עברה\n+ COA מאושר
    PENDING --> REJECTED : נדחה
    PENDING --> REQUIRES_REVIEW : דורש\nבדיקה נוספת

    REQUIRES_REVIEW --> APPROVED : אושר
    REQUIRES_REVIEW --> REJECTED : נדחה

    REJECTED --> [*] : סטטוס אצווה -> ON_HOLD
```

### פעולות QC לכל אצווה:

| פעולה | שדות מעודכנים |
|--------|---------------|
| עדכון סטטוס QC | `qcStatus` |
| העלאת תעודת אנליזה | `coaDocumentUrl` |
| עדכון תפוגה | `expiryDate` |
| עדכון כמות | `currentQuantity` |
| עדכון תאריך שימוש ראשון | `firstOpenedDate` |
| הוספת הערות QC | `qcNotes` |

---

## 15. סריקת ברקודים

```mermaid
flowchart TD
    A[נתוני סריקה גולמיים] --> B{ניסיון פענוח}

    B --> C["1. פענוח GS1-128/DataMatrix\nApplication Identifiers"]
    C --> D{הצלחה?}
    D -- כן --> E["AI 01: GTIN\nAI 10: מספר LOT\nAI 17: תאריך תפוגה\nAI 21: מספר סידורי\nAI 30/37: כמות"]

    D -- לא --> F["2. חיפוש תבנית ספק\nBarcodeFormat מ-DB"]
    F --> G{נמצאה תבנית?}
    G -- כן --> H["החלת regex:\nfieldMapping -> lotNumber,\nexpiryDate, catalogNumber"]

    G -- לא --> I["3. החזרת נתונים גולמיים"]

    E --> J[חיפוש אצווה ACTIVE\nלפי lot number]
    H --> J

    style A fill:#e0f2fe
    style E fill:#d1fae5
    style H fill:#d1fae5
    style I fill:#fef3c7
```

### תצורת ברקוד לכל ספק:

| שדה | תיאור | דוגמה |
|------|--------|--------|
| `barcodeType` | סוג ברקוד | CODE128, QR, GS1_128, DATAMATRIX |
| `parsePattern` | ביטוי רגולרי | `LOT:(\w+)\|EXP:(\d{6})` |
| `fieldMapping` | מיפוי שדות (JSON) | `{"lotNumber": 1, "expiryDate": 2}` |
| `dateFormat` | פורמט תאריך | `YYMMDD`, `YYYY-MM-DD` |

---

## 16. תנועות מלאי (Inventory Transactions)

כל שינוי במלאי מתועד כתנועה:

```mermaid
flowchart LR
    subgraph inputs["כניסה (+)"]
        R[RECEIPT\nקליטת משלוח]
        TI[TRANSFER_IN\nהעברה נכנסת]
        ADJ_PLUS["ADJUSTMENT (+)\nספירה / החזרה"]
    end

    subgraph stock["מלאי"]
        S[(ReagentBatch\ncurrentQuantity)]
    end

    subgraph outputs["יציאה (-)"]
        C[CONSUMPTION\nהוצאה מהמלאי]
        W[WITHDRAWAL\nמשיכה]
        TO[TRANSFER_OUT\nהעברה יוצאת]
        D[DESTRUCTION\nהשמדה]
        ADJ_MINUS["ADJUSTMENT (-)\nספירה / תיקון"]
    end

    R --> S
    TI --> S
    ADJ_PLUS --> S
    S --> C
    S --> W
    S --> TO
    S --> D
    S --> ADJ_MINUS
```

### טבלת סוגי תנועות:

| סוג תנועה | כיוון | מתי נוצר | SAP Movement Type |
|------------|--------|----------|-------------------|
| `RECEIPT` | +כמות | קליטת משלוח | 101 (GR against PO) |
| `CONSUMPTION` | -כמות | הוצאה מהמלאי (Dispense) | 261 (GI for consumption) |
| `WITHDRAWAL` | -כמות | משיכה מבקשת משיכה | 261 |
| `ADJUSTMENT` | +/- | ספירת מלאי / החזרה | 701/702 (PI differences) |
| `DESTRUCTION` | -כמות | השמדת פריט פגום/פג | 551 (Scrapping) |
| `TRANSFER_IN` | +כמות | העברה ממחסן אחר | 311 (Transfer posting) |
| `TRANSFER_OUT` | -כמות | שליחה לבית חולים | 311 (Transfer posting) |

---

## סיכום: מפת תהליכים מלאה

```mermaid
flowchart TB
    subgraph planning["📊 תכנון"]
        REPL[חישוב השלמות מלאי]
    end

    subgraph procure["🛒 רכש"]
        ORD[הזמנה מיידית]
        FRM[הזמנת מסגרת]
        WDR[בקשת משיכה]
    end

    subgraph receive["📦 קליטה"]
        DEL[קליטת משלוח]
        QC[בקרת איכות + COA]
    end

    subgraph storage["🏪 מלאי"]
        BAT[אצוות פעילות]
        CNT[ספירת מלאי]
        ALR[התראות]
    end

    subgraph usage["🔬 שימוש"]
        DIS[הוצאה / סריקה]
        INU[פריטים בשימוש]
        DSP[השלכה חלקית]
    end

    subgraph outgoing["🚚 משלוחים"]
        SHP[שליחה לבית חולים]
    end

    subgraph reporting_section["📈 דיווח"]
        RPT[דוחות]
        LOG[יומן פעילות]
    end

    REPL --> ORD
    REPL --> WDR
    FRM --> WDR
    ORD --> DEL
    WDR --> DEL
    DEL --> QC
    QC --> BAT
    BAT --> DIS
    DIS --> INU
    INU --> DSP
    BAT --> SHP
    BAT --> CNT
    BAT --> ALR
    ALR --> REPL
    BAT --> RPT
    DIS --> LOG
    DEL --> LOG
    CNT --> LOG
```
