# Flow Control - תיעוד מערכת מלא

**תאריך יצירה:** 30.10.2025

**סה"כ מסמכים:** 52

---

## תוכן עניינים

### סטנדרטים עיצוביים (1 מסמכים)
- סטנדרטים עיצוביים

### תבניות מסכים (2 מסמכים)
- תבנית: מסך עריכה
- תבנית: מסך עם טבלה

### קטלוג מסכים (16 מסמכים)
- מסך: Reports
- מסך: QualityAssurance
- מסך: EditReagentBatch
- מסך: BatchAndExpiryManagement
- מסך: EditShipment
- מסך: OutgoingShipments
- מסך: EditWithdrawalRequest
- מסך: WithdrawalRequests
- מסך: EditOrder
- מסך: NewOrder
- מסך: Orders
- מסך: EditDelivery
- מסך: NewDelivery
- מסך: ManageReagents
- מסך: InventoryCount
- מסך: Dashboard

### פונקציות שרת (24 מסמכים)
- פונקציה: deleteReagent
- פונקציה: deleteWithdrawal
- פונקציה: deleteShipment
- פונקציה: manageCOA
- פונקציה: generateReports
- פונקציה: archiveOldData
- פונקציה: alertsManager
- פונקציה: alertsEngine
- פונקציה: calculateReplenishment
- פונקציה: getSupplyTrackingData
- פונקציה: getEditShipmentData
- פונקציה: getOutgoingShipmentsData
- פונקציה: getEditWithdrawalData
- פונקציה: getWithdrawalRequestsData
- פונקציה: getEditOrderData
- פונקציה: getOrdersData
- פונקציה: getEditDeliveryData
- פונקציה: getNewDeliveryPageData
- פונקציה: getBatchAndExpiryData
- פונקציה: getManageReagentsData
- פונקציה: runSummaryUpdates
- פונקציה: updateReagentInventory
- פונקציה: processCompletedCount
- פונקציה: getDashboardData

### תהליכי עבודה (6 מסמכים)
- תהליך משלוח יוצא
- תהליך ניהול פגי תוקף
- תהליך בקשת משיכה ממסגרת
- תהליך יצירת דרישת רכש
- תהליך ספירת מלאי
- תהליך קליטת משלוח

### תיעוד טכני (3 מסמכים)
- ניהול State ו-Caching
- זרימת נתונים במערכת
- סקירת ארכיטקטורה

---



# 📂 סטנדרטים עיצוביים

---

# 🎨 סטנדרטים עיצוביים - Flow Control

## פלטת צבעים

### צבעים ראשיים
- **Primary Action:** #F59E0B (Amber-500)
- **Hover/Active:** #D97706 (Amber-600)
- **Primary Light:** #FBBF24 (Amber-400)

### צבעי סטטוס
- **Success:** #16A34A (Green-600)
- **Error/Danger:** #DC2626 (Red-600)
- **Warning:** #F59E0B (Amber-500)
- **Info:** #3B82F6 (Blue-500)

### צבעים ניטרליים
- Slate-50 (#F8FAFC) - רקעים בהירים
- Slate-100 (#F1F5F9) - רקעים משניים
- Slate-200 (#E2E8F0) - גבולות
- Slate-600 (#475569) - טקסט משני
- Slate-800 (#1E293B) - טקסט ראשי

## טיפוגרפיה

### Headings
- **H1:** text-3xl (30px), font-bold
- **H2:** text-2xl (24px), font-semibold
- **H3:** text-xl (20px), font-semibold
- **H4:** text-lg (18px), font-medium

### Body Text
- **Normal:** text-sm (14px)
- **Large:** text-base (16px)
- **Small:** text-xs (12px)

## Spacing System

### Padding
- **xs:** p-1 (4px)
- **sm:** p-2 (8px)
- **md:** p-4 (16px)
- **lg:** p-6 (24px)
- **xl:** p-8 (32px)

### Margin
- **Between cards:** space-y-4 (16px)
- **Between sections:** space-y-6 (24px)
- **Between groups:** space-y-8 (32px)

## Components Design

### Cards
```jsx
<Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
  <CardHeader className="py-3 px-4">
    <CardTitle>כותרת</CardTitle>
  </CardHeader>
  <CardContent className="px-4 pb-4">
    ...
  </CardContent>
</Card>
```

### Buttons
```jsx
// Primary
<Button className="bg-amber-500 hover:bg-amber-600 text-white">
  פעולה ראשית
</Button>

// Secondary
<Button variant="outline">
  פעולה משנית
</Button>

// Danger
<Button className="bg-red-600 hover:bg-red-700 text-white">
  מחק
</Button>
```

### Tables
- **Sticky Headers:** `sticky top-0 z-20 bg-gray-100`
- **Rows:** `hover:bg-gray-50 transition-colors`
- **Borders:** `border-b border-gray-200`

## Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Mobile Design Rules
1. Stack vertically (flex-col)
2. Full-width buttons
3. Cards instead of tables
4. Collapsible sections
5. Touch-friendly (min 44px height)

## RTL Support

- **All pages:** `dir="rtl"`
- **Text align:** `text-right` by default
- **Icons:** Always on the right of text
- **Margins:** Use `mr-` for right, `ml-` for left

## Animation Standards

- **Transitions:** `transition-all duration-200`
- **Hover:** `hover:scale-105`
- **Loading:** `animate-spin` or `animate-pulse`


---



# 📂 תבניות מסכים

---

# ✏️ תבנית: מסך עריכה

## מבנה כללי

```
┌──────────────────────────────────────────┐
│ Header                                   │
│  - BackButton                            │
│  - Title (עם מספר/ID)                    │
│  - Action Buttons (Save, Delete, Print)  │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ Main Content (2-column grid)             │
│                                          │
│ ┌──────────────────┐ ┌────────────────┐ │
│ │ Left Column      │ │ Right Column   │ │
│ │ - Basic Info     │ │ - Linked Items │ │
│ │ - Details        │ │ - Status       │ │
│ │ - Notes          │ │ - Metadata     │ │
│ └──────────────────┘ └────────────────┘ │
└──────────────────────────────────────────┘
```

## קוד לדוגמה

```jsx
export default function EditScreen() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [item, setItem] = useState(null);
  const [linkedData, setLinkedData] = useState({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const response = await base44.functions.invoke('getEdit...Data', { id });
    setItem(response.data.item);
    setLinkedData(response.data.linked);
  };

  const handleSave = async () => {
    await base44.entities.Entity.update(id, item);
    toast.success('נשמר בהצלחה');
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1>עריכת פריט: {item?.number}</h1>
        <div className="flex gap-2">
          <Button onClick={handleSave}>שמור</Button>
          <Button onClick={handleDelete} variant="destructive">מחק</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>פרטים בסיסיים</CardTitle></CardHeader>
            <CardContent>...</CardContent>
          </Card>
        </div>

        {/* Sidebar - Linked Items */}
        <div className="space-y-4">
          {linkedData.order && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <Label>הזמנה מקושרת</Label>
                <Link to={`/EditOrder?id=${linkedData.order.id}`}>
                  {linkedData.order.number}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

## קישורים לישויות

### דוגמה - Card לקישור:
```jsx
{linkedOrder && (
  <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-900">
          הזמנה מקושרת
        </h3>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs text-amber-700">מספר הזמנה</Label>
        <Link
          to={`/EditOrder?id=${linkedOrder.id}`}
          className="flex items-center gap-1 text-amber-700 hover:underline"
        >
          {linkedOrder.order_number_temp}
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Badge className="bg-amber-100 text-amber-800">
          {linkedOrder.status}
        </Badge>
      </div>
    </CardContent>
  </Card>
)}
```


---

# 📊 תבנית: מסך עם טבלה

## מבנה כללי

```
┌─────────────────────────────────────┐
│ Header                              │
│  - BackButton                       │
│  - Title                            │
│  - Refresh Button                   │
│  - Primary Action (Add/Export)      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Filters Bar                         │
│  - Search Input                     │
│  - Filter Dropdowns                 │
│  - Reset Button                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ ResizableTable                      │
│  - Sticky Headers (z-20)            │
│  - Sortable Columns                 │
│  - Resizable Columns                │
│  - Row Actions (Edit/Delete/View)   │
└─────────────────────────────────────┘
```

## קוד לדוגמה

```jsx
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ResizableTable from '@/components/ui/ResizableTable';
import BackButton from '@/components/ui/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MyTableScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortState, setSortState] = useState({ key: 'created_date', direction: 'desc' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('get...Data');
      setData(response.data.items);
    } catch (error) {
      toast.error('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'name', label: 'שם', width: 200, sortable: true },
    { key: 'status', label: 'סטטוס', width: 120, 
      render: (value) => <Badge>{value}</Badge> },
    { key: 'actions', label: 'פעולות', width: 150,
      render: (value, row) => (
        <Button onClick={() => navigate(`/Edit?id=${row.id}`)}>
          ערוך
        </Button>
      )}
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold">כותרת</h1>
        <Button onClick={loadData}>רענן</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="חיפוש..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ResizableTable
        columns={columns}
        data={filteredData}
        onSort={handleSort}
        currentSort={sortState}
      />
    </div>
  );
}
```

## עקרונות חובה

### Desktop
- ✅ טבלה מלאה
- ✅ Sticky headers
- ✅ גלילה אופקית
- ✅ עמודות ניתנות לשינוי גודל

### Mobile
- ✅ כרטיסים במקום טבלה
- ✅ מידע מתומצת
- ✅ Actions בתחתית כרטיס


---



# 📂 קטלוג מסכים

---

# 🖥️ מסך: Reports

**סוג:** reports
**Path:** `pages/Reports.js`

---

## 🎯 תפקיד המסך

מסך Reports

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/Reports.js
```




---

# 🖥️ מסך: QualityAssurance

**סוג:** table
**Path:** `pages/QualityAssurance.js`

---

## 🎯 תפקיד המסך

מסך QualityAssurance

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/QualityAssurance.js
```




---

# 🖥️ מסך: EditReagentBatch

**סוג:** edit
**Path:** `pages/EditReagentBatch.js`

---

## 🎯 תפקיד המסך

מסך EditReagentBatch

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/EditReagentBatch.js
```




---

# 🖥️ מסך: BatchAndExpiryManagement

**סוג:** table
**Path:** `pages/BatchAndExpiryManagement.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך BatchAndExpiryManagement

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/BatchAndExpiryManagement.js
```




---

# 🖥️ מסך: EditShipment

**סוג:** edit
**Path:** `pages/EditShipment.js`

---

## 🎯 תפקיד המסך

מסך EditShipment

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/EditShipment.js
```




---

# 🖥️ מסך: OutgoingShipments

**סוג:** table
**Path:** `pages/OutgoingShipments.js`

---

## 🎯 תפקיד המסך

מסך OutgoingShipments

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/OutgoingShipments.js
```




---

# 🖥️ מסך: EditWithdrawalRequest

**סוג:** edit
**Path:** `pages/EditWithdrawalRequest.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך EditWithdrawalRequest

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/EditWithdrawalRequest.js
```




---

# 🖥️ מסך: WithdrawalRequests

**סוג:** table
**Path:** `pages/WithdrawalRequests.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך WithdrawalRequests

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/WithdrawalRequests.js
```




---

# 🖥️ מסך: EditOrder

**סוג:** edit
**Path:** `pages/EditOrder.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך EditOrder

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/EditOrder.js
```




---

# 🖥️ מסך: NewOrder

**סוג:** form
**Path:** `pages/NewOrder.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך NewOrder

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/NewOrder.js
```




---

# 🖥️ מסך: Orders

**סוג:** table
**Path:** `pages/Orders.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך Orders

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

לא מתועד

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/Orders.js
```




---

# 🖥️ מסך: EditDelivery

**סוג:** edit
**Path:** `pages/EditDelivery.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

צפייה ועריכת משלוח - עיבוד המשלוח ועדכון המלאי

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

- getEditDeliveryData()
- updateReagentInventory()

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/EditDelivery.js
```




---

# 🖥️ מסך: NewDelivery

**סוג:** form
**Path:** `pages/NewDelivery.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

קליטת משלוח נכנס - מילוי פרטי משלוח והוספת פריטים

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

- getNewDeliveryPageData()

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- Card, Button, Input וכו'

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/NewDelivery.js
```




---

# 🖥️ מסך: ManageReagents

**סוג:** table
**Path:** `pages/ManageReagents.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

ניהול מרכזי של כל הריאגנטים - הוספה, עריכה, מחיקה, החלפת ספק

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

- getManageReagentsData()
- deleteReagent()
- changeReagentSupplier()

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- ResizableTable
- ReagentCard
- BackButton

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/ManageReagents.js
```




---

# 🖥️ מסך: InventoryCount

**סוג:** table
**Path:** `pages/InventoryCount.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

ביצוע ספירת מלאי - טעינת אצוות קיימות, עריכת כמויות, השלמת ספירה

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

- getInventoryCountDraftData()
- processCompletedCount()

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- ResizableTable
- BatchEntry
- BackButton

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/InventoryCount.js
```




---

# 🖥️ מסך: Dashboard

**סוג:** dashboard
**Path:** `pages/Dashboard.js`
**⚠️ קריטי:** מסך מרכזי במערכת

---

## 🎯 תפקיד המסך

מסך הבית - מציג מצב כללי של המערכת, פעולות קריטיות, ופעילות אחרונה

---

## 🏗️ מבנה המסך


### Layout
- Header עם כפתורים
- Filters/Search bar
- Main content area
- Modals לפעולות

### Responsive
- Desktop: מבנה מלא
- Mobile: מתומצת וכרטיסים


---

## 🔧 פונקציות Backend

- getDashboardData()

---

## 💾 State Management


- **React Query** לנתונים מהשרת
- **useState** ל-UI state מקומי
- **localStorage** לשמירת preferences


---

## 🎨 קומפוננטות משומשות

- SummaryCard
- CriticalActions
- RecentActivity
- NavGroupAccordion

---

## 💻 דוגמת קוד


```jsx
// ראה קוד המסך המלא ב-pages/Dashboard.js
```




---



# 📂 פונקציות שרת

---

# ⚙️ פונקציית שרת: deleteReagent

## 📋 תיאור

מחיקת ריאגנט

**Path:** `functions/deleteReagent.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('deleteReagent', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('deleteReagent', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('deleteReagent', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: deleteWithdrawal

## 📋 תיאור

מחיקת בקשת משיכה

**Path:** `functions/deleteWithdrawal.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('deleteWithdrawal', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('deleteWithdrawal', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('deleteWithdrawal', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: deleteShipment

## 📋 תיאור

מחיקת משלוח יוצא

**Path:** `functions/deleteShipment.js`

---

## 📥 Input Parameters

```javascript
{
  shipmentId: "shipment_abc123",
  reason: "created by mistake",  // סיבת המחיקה
  rollbackInventory: true  // האם להחזיר מלאי
}
```


---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('deleteShipment', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('deleteShipment', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('deleteShipment', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: manageCOA

## 📋 תיאור

ניהול תעודות אנליזה

**Path:** `functions/manageCOA.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('manageCOA', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('manageCOA', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('manageCOA', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: generateReports

## 📋 תיאור

ייצור דוחות

**Path:** `functions/generateReports.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('generateReports', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('generateReports', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('generateReports', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: archiveOldData

## 📋 תיאור

ארכוב נתונים ישנים

**Path:** `functions/archiveOldData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('archiveOldData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('archiveOldData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('archiveOldData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: alertsManager

## 📋 תיאור

ניהול התראות

**Path:** `functions/alertsManager.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('alertsManager', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('alertsManager', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('alertsManager', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: alertsEngine

## 📋 תיאור

מנוע התראות

**Path:** `functions/alertsEngine.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('alertsEngine', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('alertsEngine', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('alertsEngine', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: calculateReplenishment

## 📋 תיאור

חישוב השלמות מלאי

**Path:** `functions/calculateReplenishment.js`

---

## 📥 Input Parameters

```javascript
{
  minWeeksOfStock: 4,  // מינימום שבועות מלאי
  minQuantity: 5       // מינימום כמות יחידות
}
```


---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('calculateReplenishment', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('calculateReplenishment', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('calculateReplenishment', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getSupplyTrackingData

## 📋 תיאור

טעינת נתוני מעקב אספקות

**Path:** `functions/getSupplyTrackingData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getSupplyTrackingData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getSupplyTrackingData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getSupplyTrackingData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getEditShipmentData

## 📋 תיאור

טעינת נתוני עריכת משלוח יוצא

**Path:** `functions/getEditShipmentData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getEditShipmentData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getEditShipmentData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getEditShipmentData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getOutgoingShipmentsData

## 📋 תיאור

טעינת נתוני משלוחים יוצאים

**Path:** `functions/getOutgoingShipmentsData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getOutgoingShipmentsData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getOutgoingShipmentsData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getOutgoingShipmentsData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getEditWithdrawalData

## 📋 תיאור

טעינת נתוני עריכת משיכה

**Path:** `functions/getEditWithdrawalData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getEditWithdrawalData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getEditWithdrawalData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getEditWithdrawalData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getWithdrawalRequestsData

## 📋 תיאור

טעינת נתוני בקשות משיכה

**Path:** `functions/getWithdrawalRequestsData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getWithdrawalRequestsData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getWithdrawalRequestsData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getWithdrawalRequestsData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getEditOrderData

## 📋 תיאור

טעינת נתוני עריכת הזמנה

**Path:** `functions/getEditOrderData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getEditOrderData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getEditOrderData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getEditOrderData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getOrdersData

## 📋 תיאור

טעינת נתוני דרישות רכש

**Path:** `functions/getOrdersData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getOrdersData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getOrdersData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getOrdersData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getEditDeliveryData

## 📋 תיאור

טעינת נתוני עריכת משלוח

**Path:** `functions/getEditDeliveryData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getEditDeliveryData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getEditDeliveryData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getEditDeliveryData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getNewDeliveryPageData

## 📋 תיאור

טעינת נתוני דף משלוח חדש

**Path:** `functions/getNewDeliveryPageData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getNewDeliveryPageData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getNewDeliveryPageData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getNewDeliveryPageData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getBatchAndExpiryData

## 📋 תיאור

טעינת נתוני אצוות ופגי תוקף

**Path:** `functions/getBatchAndExpiryData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getBatchAndExpiryData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getBatchAndExpiryData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getBatchAndExpiryData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: getManageReagentsData

## 📋 תיאור

טעינת נתוני ניהול ריאגנטים

**Path:** `functions/getManageReagentsData.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getManageReagentsData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getManageReagentsData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getManageReagentsData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: runSummaryUpdates

> ⚠️ **פונקציה קריטית** - שגיאה כאן תשפיע על כל המערכת!

## 📋 תיאור

הרצת עדכוני סיכום כלליים

**Path:** `functions/runSummaryUpdates.js`

---

## 📥 Input Parameters

ראה קוד הפונקציה

---

## 📤 Output Response

ראה קוד הפונקציה

---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('runSummaryUpdates', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('runSummaryUpdates', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)

תלויות לא מתועדות

---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('runSummaryUpdates', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח

- אין הערות מיוחדות



---

# ⚙️ פונקציית שרת: updateReagentInventory

> ⚠️ **פונקציה קריטית** - שגיאה כאן תשפיע על כל המערכת!

## 📋 תיאור

עדכון סיכומי מלאי ריאגנטים

**Path:** `functions/updateReagentInventory.js`

---

## 📥 Input Parameters

```javascript
{
  deliveryId: "delivery_abc123"  // מזהה ה-Delivery לעיבוד
}
```

**חשוב:** המשלוח חייב להיות בסטטוס `processing`


---

## 📤 Output Response

```javascript
{
  success: true,
  updatedReagents: 12,
  createdBatches: 8,
  updatedBatches: 4,
  errors: null
}
```


---

## 🧠 לוגיקה מפורטת

ראה קוד הפונקציה

---

## 🔄 תהליך ביצוע צעד אחר צעד


### תהליך מפורט

**שלב 1: וולידציה**
```javascript
const delivery = await base44.entities.Delivery.get(deliveryId);
if (!delivery) return { error: 'Delivery not found' };
if (delivery.status !== 'processing') return { error: 'Invalid status' };
```

**שלב 2: טעינת פריטים**
```javascript
const items = await base44.entities.DeliveryItem.filter({ delivery_id: deliveryId });
```

**שלב 3: עיבוד כל פריט**
```javascript
for (const item of items) {
  // 3.1: שלוף ריאגנט
  const reagent = await base44.entities.Reagent.get(item.reagent_id);
  
  // 3.2: בדוק אם אצווה קיימת
  let batch = null;
  if (item.reagent_batch_id) {
    batch = await base44.entities.ReagentBatch.get(item.reagent_batch_id);
  }
  
  // 3.3: עדכן או צור אצווה
  if (batch) {
    await base44.entities.ReagentBatch.update(batch.id, {
      current_quantity: batch.current_quantity + item.quantity_received,
      status: 'active'
    });
  } else {
    batch = await base44.entities.ReagentBatch.create({
      reagent_id: item.reagent_id,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      current_quantity: item.quantity_received,
      initial_quantity: item.quantity_received,
      status: 'active'
    });
  }
  
  // 3.4: צור תנועת מלאי
  await base44.entities.InventoryTransaction.create({
    reagent_id: item.reagent_id,
    transaction_type: 'delivery',
    quantity: item.quantity_received,
    batch_number: item.batch_number,
    document_number: delivery.delivery_number
  });
  
  // 3.5: עדכן סיכום ריאגנט
  const allBatches = await base44.entities.ReagentBatch.filter({
    reagent_id: reagent.id,
    status: { $in: ['active', 'quarantine'] }
  });
  
  const totalQuantity = allBatches.reduce((sum, b) => sum + b.current_quantity, 0);
  const nearestExpiry = Math.min(...allBatches.map(b => b.expiry_date));
  
  await base44.entities.Reagent.update(reagent.id, {
    total_quantity_all_batches: totalQuantity,
    active_batches_count: allBatches.length,
    nearest_expiry_date: nearestExpiry
  });
}
```

**שלב 4: עדכון קישורים**
```javascript
// עדכן Order
if (delivery.linked_order_id) {
  const order = await base44.entities.Order.get(delivery.linked_order_id);
  await base44.entities.Order.update(order.id, {
    linked_delivery_ids: [...(order.linked_delivery_ids || []), deliveryId]
  });
}

// עדכן WithdrawalRequests
if (relatedWithdrawalIds.size > 0) {
  for (const wid of relatedWithdrawalIds) {
    const wr = await base44.entities.WithdrawalRequest.get(wid);
    await base44.entities.WithdrawalRequest.update(wid, {
      linked_delivery_ids: [...(wr.linked_delivery_ids || []), deliveryId]
    });
  }
}
```

**שלב 5: סיום**
```javascript
await base44.entities.Delivery.update(deliveryId, {
  status: 'processed'
});
```


---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('updateReagentInventory', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('updateReagentInventory', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)


### Entities Used
- Delivery.get() / update()
- DeliveryItem.filter()
- ReagentBatch.get() / create() / update()
- Reagent.get() / update()
- InventoryTransaction.create()
- Order.get() / update()
- WithdrawalRequest.get() / update()

### Other Functions
- ללא תלות ישירה


---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('updateReagentInventory', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)


### מקרי קצה

1. **פריט ללא reagent_batch_id**
   - יוצר אצווה חדשה
   - מזין batch_number ו-expiry_date מה-DeliveryItem

2. **כמות גבוהה מההזמנה**
   - מעבד בכל מקרה
   - מתעד ב-InventoryTransaction
   - המשתמש כבר אישר ב-NewDelivery

3. **משלוח ללא Order מקושר**
   - OK - לא מעדכן Order
   - רק מעדכן Reagent + Batch

4. **Order מקושר למספר WithdrawalRequests**
   - עובר על כל withdrawal_request_ids
   - מעדכן כל אחד ב-linked_delivery_ids


---

## 🔍 נקודות חשובות למפתח


- ⚠️ **קריטי:** פונקציה זו מעדכנת מלאי - חובה transaction!
- 🔄 **Idempotent:** לא להריץ פעמיים על אותו deliveryId
- 🔗 **Linking:** חשוב מאוד לעדכן את כל הקישורים (Order, WithdrawalRequest)
- 📝 **Audit:** כל שינוי מתועד ב-InventoryTransaction




---

# ⚙️ פונקציית שרת: processCompletedCount

> ⚠️ **פונקציה קריטית** - שגיאה כאן תשפיע על כל המערכת!

## 📋 תיאור

עיבוד ספירת מלאי מושלמת

**Path:** `functions/processCompletedCount.js`

---

## 📥 Input Parameters

```javascript
{
  draftId: "draft_abc123"  // מזהה ה-InventoryCountDraft לעיבוד
}
```


---

## 📤 Output Response

```javascript
{
  success: true,
  count_number: "FC-I-042",
  count_id: "count_xyz",
  reagents_updated: 35
}
```

**במקרה של שגיאה:**
```javascript
{
  success: false,
  error: "Draft not found",
  stack: "..."
}
```


---

## 🧠 לוגיקה מפורטת


### אלגוריתם ספירת מלאי

```javascript
// 1. וולידציה
const draft = await base44.entities.InventoryCountDraft.get(draftId);
if (!draft || draft.completed) throw new Error();

// 2. יצירת מספר ייחודי
const lastNum = getLastCountNumber();
const newNumber = `FC-I-${(lastNum + 1).toString().padStart(3, '0')}`;

// 3. יצירת CompletedInventoryCount
const completedCount = await base44.entities.CompletedInventoryCount.create({
  count_number: newNumber,
  count_date: draft.start_date,
  entries: draft.batch_entries
});

// 4. עיבוד כל אצווה
for (const [reagentId, batches] of Object.entries(draft.batch_entries)) {
  for (const batchEntry of batches) {
    const { id: batchId, batch_number, quantity } = batchEntry;
    
    if (quantity === 0) {
      // אצווה אפס → סמן כנצרכה
      await base44.entities.ReagentBatch.update(batchId, {
        status: 'consumed',
        current_quantity: 0
      });
      
      // תעד בתנועת מלאי
      await base44.entities.InventoryTransaction.create({
        reagent_id: reagentId,
        transaction_type: 'count_update',
        quantity: -(existingBatch.current_quantity),
        notes: `ספירה ${newNumber} - אצווה נצרכה`
      });
      
    } else if (batchId) {
      // אצווה קיימת → עדכן כמות
      const diff = quantity - existingBatch.current_quantity;
      await base44.entities.ReagentBatch.update(batchId, {
        current_quantity: quantity
      });
      
      if (diff !== 0) {
        await base44.entities.InventoryTransaction.create({
          reagent_id: reagentId,
          transaction_type: 'count_update',
          quantity: diff
        });
      }
    } else {
      // אצווה חדשה → צור
      await base44.entities.ReagentBatch.create({
        reagent_id: reagentId,
        batch_number: batch_number,
        current_quantity: quantity,
        initial_quantity: quantity,
        status: 'active'
      });
    }
  }
}

// 5. עדכן סיכומים
await base44.functions.invoke('runSummaryUpdates');
```


---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('processCompletedCount', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('processCompletedCount', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)


### Entities Used
- InventoryCountDraft.get()
- CompletedInventoryCount.create()
- ReagentBatch.get() / create() / update()
- Reagent.get() / update()
- InventoryTransaction.create()

### Other Functions
- **runSummaryUpdates()** - נקרא בסוף

### Critical Dependencies
⚠️ תלוי ב-runSummaryUpdates להשלמת עדכון הסיכומים


---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('processCompletedCount', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)


### מקרי קצה

1. **אצווה עם כמות 0**
   - ✅ ReagentBatch.status = 'consumed'
   - ✅ ReagentBatch.current_quantity = 0
   - ✅ InventoryTransaction שלילי (הפחתה)
   - ❌ לא מוחקים את האצווה!

2. **אצווה חדשה שלא היתה במערכת**
   - יוצר ReagentBatch חדש
   - initial_quantity = quantity
   - received_date = תאריך הספירה

3. **כמות גבוהה מאוד (anomaly)**
   - מעבד בכל מקרה
   - רושם ב-InventoryTransaction
   - ניתן להוסיף התראה עתידית

4. **ריאגנט ללא catalog_item_id**
   - משתמש ב-reagent_id כ-catalog_item_id
   - צריך לתקן בהמשך


---

## 🔍 נקודות חשובות למפתח


- ⚠️ **One-time operation:** טיוטה יכולה להתעבד רק פעם אחת
- 🔢 **Unique Numbers:** חובה לוודא ייחודיות של count_number
- 🗑️ **Zero Handling:** טיפול מיוחד באצוות אפס - לא למחוק!
- ⏱️ **Background:** runSummaryUpdates יכול לקחת זמן - אל תחכה לו




---

# ⚙️ פונקציית שרת: getDashboardData

> ⚠️ **פונקציה קריטית** - שגיאה כאן תשפיע על כל המערכת!

## 📋 תיאור

טעינת נתוני דשבורד

**Path:** `functions/getDashboardData.js`

---

## 📥 Input Parameters

**ללא פרמטרים**

הפונקציה משתמשת באוטומטי ב:
- `base44.auth.me()` - נתוני המשתמש המחובר


---

## 📤 Output Response

```javascript
{
  expiringReagents: [
    { id, name, nearest_expiry_date, supplier, total_quantity }
  ],
  lowStockReagents: [
    { id, name, total_quantity, months_of_stock, supplier }
  ],
  pendingOrders: [
    { id, order_number_temp, supplier_name_snapshot, status }
  ],
  pendingSupplies: [
    { id, type, requestDate, withdrawal_number, status }
  ],
  recentActivity: [
    { id, icon, color, description, date }
  ],
  criticalActions: [
    { priority, text, link }
  ],
  statistics: {
    totalReagents, totalOrders, totalWithdrawals
  }
}
```


---

## 🧠 לוגיקה מפורטת


### אלגוריתם מרכזי

1. **Fetch All Data in Parallel**
```javascript
const [reagents, orders, withdrawals, ...] = await Promise.allSettled([
  base44.entities.Reagent.list(),
  base44.entities.Order.list(),
  // ...
]);
```

2. **Calculate Expiring Reagents**
```javascript
const now = new Date();
const fourteenDaysAhead = addDays(now, 14);

const expiring = reagents
  .filter(r => {
    const expDate = parseISO(r.nearest_expiry_date);
    return isBefore(expDate, fourteenDaysAhead) && 
           isAfter(expDate, now) &&
           !handledExpiredKeys.has(`${r.id}_${r.nearest_expiry_date}`);
  })
  .sort((a, b) => parseISO(a.nearest_expiry_date) - parseISO(b.nearest_expiry_date));
```

3. **Calculate Low Stock**
```javascript
const lowStock = reagents
  .filter(r => {
    if (r.category !== 'reagents') return false;
    const monthsOfStock = r.total_quantity / (r.average_monthly_usage || 1);
    return monthsOfStock * 4.33 < 4 || r.total_quantity < 5;
  })
  .sort((a, b) => {
    const aMonths = a.total_quantity / (a.average_monthly_usage || 1);
    const bMonths = b.total_quantity / (b.average_monthly_usage || 1);
    return aMonths - bMonths;
  });
```

4. **Generate Critical Actions**
```javascript
const criticalActions = [];

if (expiredToday.length > 0) {
  criticalActions.push({
    priority: 'critical',
    text: `דרוש טיפול מיידי ב-${expiredToday.length} ריאגנטים`,
    link: 'BatchAndExpiryManagement'
  });
}
```


---

## 🔄 תהליך ביצוע צעד אחר צעד

תהליך לא מתועד

---

## 💻 דוגמת קוד שימוש


### Frontend Usage

```javascript
import { base44 } from '@/api/base44Client';

// קריאה לפונקציה
const response = await base44.functions.invoke('getDashboardData', {
  // parameters here
});

if (response.data.success) {
  toast.success('הפעולה הושלמה');
} else {
  toast.error(response.data.error);
}
```

### With React Query

```javascript
const mutation = useMutation({
  mutationFn: (params) => base44.functions.invoke('getDashboardData', params),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
  }
});

// שימוש
mutation.mutate({ /* params */ });
```


---

## 🔗 תלויות (Dependencies)


### Entities Used
- Reagent.list()
- Order.list()
- WithdrawalRequest.list()
- ExpiredProductLog.list()
- DashboardNote.filter()
- CompletedInventoryCount.list()
- InventoryTransaction.list()
- Delivery.list()

### External Libraries
- date-fns: `differenceInDays`, `addDays`, `parseISO`

### Other Functions
- ללא תלות בפונקציות אחרות


---

## ⚠️ שגיאות אפשריות וטיפול


### HTTP Status Codes

| Code | משמעות | דוגמה |
|------|--------|-------|
| 200 | Success | פעולה הושלמה בהצלחה |
| 400 | Bad Request | פרמטרים חסרים או שגויים |
| 401 | Unauthorized | משתמש לא מחובר |
| 403 | Forbidden | אין הרשאות (למשל, לא admin) |
| 404 | Not Found | הישות המבוקשת לא קיימת |
| 500 | Server Error | שגיאה פנימית בשרת |

### שגיאות נפוצות

```javascript
// שגיאה 1: משתמש לא מחובר
{
  error: "Unauthorized",
  status: 401
}

// שגיאה 2: נתונים חסרים
{
  error: "deliveryId is required",
  status: 400
}

// שגיאה 3: סטטוס לא תקין
{
  error: "Delivery must be in processing status",
  currentStatus: "processed",
  status: 400
}
```

### Handling בצד Frontend

```javascript
try {
  const response = await base44.functions.invoke('getDashboardData', params);
  
  if (response.data.error) {
    throw new Error(response.data.error);
  }
  
  // Success
  toast.success('הפעולה הושלמה');
  
} catch (error) {
  console.error('Function error:', error);
  toast.error(`שגיאה: ${error.message}`);
}
```


---

## 🧪 מקרי קצה (Edge Cases)

אין מקרי קצה מתועדים

---

## 🔍 נקודות חשובות למפתח


- ⚠️ **ביצועים:** רץ בכל טעינת דשבורד - צריך להיות מהיר!
- 💡 **Cache:** שקול להוסיף Redis cache בעתיד
- 🔍 **Monitoring:** לוג זמני ביצוע לכל חלק
- 📊 **Optimization:** Promise.allSettled במקום Promise.all (לא נכשל אם ישות אחת נכשלת)




---



# 📂 תהליכי עבודה

---

# 🔄 תהליך משלוח יוצא

## 📋 תיאור

תהליך יצירת ושליחת משלוח יוצא

---

## 🎯 מטרה ויעדים

מטרה לא מתועדת

---

## 📊 Flow Diagram

תרשים לא זמין

---

## 🔗 ישויות מעורבות

ישויות לא מתועדות

---

## ⚙️ פונקציות Backend מעורבות

פונקציות לא מתועדות

---

## 🎨 ממשק משתמש (UI)

UI לא מתועד

---

## 💾 זרימת נתונים (Data Flow)


```
Frontend State → API Call → Backend Logic → Database → Response → Frontend Update
```

ראה תרשים Flow Diagram למעלה לפירוט מלא.


---

## ⚠️ טיפול בשגיאות


### עקרונות

1. **Validation בצד לקוח**
   - בדיקת שדות חובה
   - פורמט תקין
   - טווחים הגיוניים

2. **Validation בצד שרת**
   - בדיקה חוזרת של כל הקלט
   - בדיקת הרשאות
   - בדיקת תקינות הפניות (IDs)

3. **Error Messages**
   - ברורים ומפורטים
   - בעברית
   - כוללים הצעה לפתרון

4. **Logging**
   - כל שגיאה מתועדת ב-console
   - כולל stack trace
   - timestamp מדויק

### דוגמה
```javascript
try {
  // פעולה
} catch (error) {
  console.error('[FunctionName] Error:', error);
  return Response.json({ 
    success: false, 
    error: error.message,
    details: 'פרטים נוספים כאן'
  }, { status: 500 });
}
```


---

## 🧪 מקרי קצה


- **תקלת תקשורת:** retry logic
- **נתונים חלקיים:** הצג מה שיש + הודעה
- **concurrent updates:** optimistic locking
- **גדול מדי:** pagination בשרת


---

## 🔍 נקודות ביישום


### נקודות לתשומת לב

1. ✅ **טסט לפני פרודקשן**
2. ✅ **תיעוד כל שינוי**
3. ✅ **שמור backward compatibility**
4. ✅ **הוסף migration scripts**




---

# 🔄 תהליך ניהול פגי תוקף

## 📋 תיאור

תהליך זיהוי וטיפול בפריטים פגי תוקף

---

## 🎯 מטרה ויעדים

מטרה לא מתועדת

---

## 📊 Flow Diagram

תרשים לא זמין

---

## 🔗 ישויות מעורבות

ישויות לא מתועדות

---

## ⚙️ פונקציות Backend מעורבות

פונקציות לא מתועדות

---

## 🎨 ממשק משתמש (UI)

UI לא מתועד

---

## 💾 זרימת נתונים (Data Flow)


```
Frontend State → API Call → Backend Logic → Database → Response → Frontend Update
```

ראה תרשים Flow Diagram למעלה לפירוט מלא.


---

## ⚠️ טיפול בשגיאות


### עקרונות

1. **Validation בצד לקוח**
   - בדיקת שדות חובה
   - פורמט תקין
   - טווחים הגיוניים

2. **Validation בצד שרת**
   - בדיקה חוזרת של כל הקלט
   - בדיקת הרשאות
   - בדיקת תקינות הפניות (IDs)

3. **Error Messages**
   - ברורים ומפורטים
   - בעברית
   - כוללים הצעה לפתרון

4. **Logging**
   - כל שגיאה מתועדת ב-console
   - כולל stack trace
   - timestamp מדויק

### דוגמה
```javascript
try {
  // פעולה
} catch (error) {
  console.error('[FunctionName] Error:', error);
  return Response.json({ 
    success: false, 
    error: error.message,
    details: 'פרטים נוספים כאן'
  }, { status: 500 });
}
```


---

## 🧪 מקרי קצה


- **תקלת תקשורת:** retry logic
- **נתונים חלקיים:** הצג מה שיש + הודעה
- **concurrent updates:** optimistic locking
- **גדול מדי:** pagination בשרת


---

## 🔍 נקודות ביישום


### נקודות לתשומת לב

1. ✅ **טסט לפני פרודקשן**
2. ✅ **תיעוד כל שינוי**
3. ✅ **שמור backward compatibility**
4. ✅ **הוסף migration scripts**




---

# 🔄 תהליך בקשת משיכה ממסגרת

## 📋 תיאור

תהליך יצירת ואישור בקשת משיכה מהזמנת מסגרת

---

## 🎯 מטרה ויעדים


**מטרה ראשית:** למשוך פריטים מהזמנת מסגרת פעילה ללא צורך ביצירת הזמנה חדשה.

**יעדים:**
- ✅ ניצול הזמנות מסגרת יעיל
- ✅ מעקב אחר יתרות בהזמנות מסגרת
- ✅ תהליך אישור מובנה
- ✅ קישור אוטומטי למשלוחים שמגיעים


---

## 📊 Flow Diagram

תרשים לא זמין

---

## 🔗 ישויות מעורבות

ישויות לא מתועדות

---

## ⚙️ פונקציות Backend מעורבות

פונקציות לא מתועדות

---

## 🎨 ממשק משתמש (UI)

UI לא מתועד

---

## 💾 זרימת נתונים (Data Flow)


```
Frontend State → API Call → Backend Logic → Database → Response → Frontend Update
```

ראה תרשים Flow Diagram למעלה לפירוט מלא.


---

## ⚠️ טיפול בשגיאות


### עקרונות

1. **Validation בצד לקוח**
   - בדיקת שדות חובה
   - פורמט תקין
   - טווחים הגיוניים

2. **Validation בצד שרת**
   - בדיקה חוזרת של כל הקלט
   - בדיקת הרשאות
   - בדיקת תקינות הפניות (IDs)

3. **Error Messages**
   - ברורים ומפורטים
   - בעברית
   - כוללים הצעה לפתרון

4. **Logging**
   - כל שגיאה מתועדת ב-console
   - כולל stack trace
   - timestamp מדויק

### דוגמה
```javascript
try {
  // פעולה
} catch (error) {
  console.error('[FunctionName] Error:', error);
  return Response.json({ 
    success: false, 
    error: error.message,
    details: 'פרטים נוספים כאן'
  }, { status: 500 });
}
```


---

## 🧪 מקרי קצה


- **תקלת תקשורת:** retry logic
- **נתונים חלקיים:** הצג מה שיש + הודעה
- **concurrent updates:** optimistic locking
- **גדול מדי:** pagination בשרת


---

## 🔍 נקודות ביישום


### נקודות לתשומת לב

1. ✅ **טסט לפני פרודקשן**
2. ✅ **תיעוד כל שינוי**
3. ✅ **שמור backward compatibility**
4. ✅ **הוסף migration scripts**




---

# 🔄 תהליך יצירת דרישת רכש

## 📋 תיאור

תהליך יצירת דרישת רכש והמעקב אחריה

---

## 🎯 מטרה ויעדים

מטרה לא מתועדת

---

## 📊 Flow Diagram

תרשים לא זמין

---

## 🔗 ישויות מעורבות

ישויות לא מתועדות

---

## ⚙️ פונקציות Backend מעורבות

פונקציות לא מתועדות

---

## 🎨 ממשק משתמש (UI)

UI לא מתועד

---

## 💾 זרימת נתונים (Data Flow)


```
Frontend State → API Call → Backend Logic → Database → Response → Frontend Update
```

ראה תרשים Flow Diagram למעלה לפירוט מלא.


---

## ⚠️ טיפול בשגיאות


### עקרונות

1. **Validation בצד לקוח**
   - בדיקת שדות חובה
   - פורמט תקין
   - טווחים הגיוניים

2. **Validation בצד שרת**
   - בדיקה חוזרת של כל הקלט
   - בדיקת הרשאות
   - בדיקת תקינות הפניות (IDs)

3. **Error Messages**
   - ברורים ומפורטים
   - בעברית
   - כוללים הצעה לפתרון

4. **Logging**
   - כל שגיאה מתועדת ב-console
   - כולל stack trace
   - timestamp מדויק

### דוגמה
```javascript
try {
  // פעולה
} catch (error) {
  console.error('[FunctionName] Error:', error);
  return Response.json({ 
    success: false, 
    error: error.message,
    details: 'פרטים נוספים כאן'
  }, { status: 500 });
}
```


---

## 🧪 מקרי קצה


- **תקלת תקשורת:** retry logic
- **נתונים חלקיים:** הצג מה שיש + הודעה
- **concurrent updates:** optimistic locking
- **גדול מדי:** pagination בשרת


---

## 🔍 נקודות ביישום


### נקודות לתשומת לב

1. ✅ **טסט לפני פרודקשן**
2. ✅ **תיעוד כל שינוי**
3. ✅ **שמור backward compatibility**
4. ✅ **הוסף migration scripts**




---

# 🔄 תהליך ספירת מלאי

## 📋 תיאור

תהליך ביצוע ספירת מלאי מתחילה לסוף

---

## 🎯 מטרה ויעדים


**מטרה ראשית:** לבצע ספירת מלאי פיזית ולעדכן את המערכת בהתאם למציאות בשטח.

**יעדים משניים:**
- ✅ זיהוי הפרשים בין המערכת למציאות
- ✅ טיפול באצוות שנצרכו לגמרי (כמות 0)
- ✅ זיהוי אצוות חדשות שלא תועדו
- ✅ יצירת תיעוד מלא לביקורת


---

## 📊 Flow Diagram

תרשים לא זמין

---

## 🔗 ישויות מעורבות


- **InventoryCountDraft** - הטיוטה בזמן הספירה
- **CompletedInventoryCount** - הספירה המושלמת
- **ReagentBatch** - כל אצווה שנספרה
- **Reagent** - סיכומים מתעדכנים
- **InventoryTransaction** - תיעוד כל שינוי


---

## ⚙️ פונקציות Backend מעורבות


1. **getInventoryCountDraftData**
   - טוען ריאגנטים ואצוות לספירה
   
2. **processCompletedCount** (קריטי!)
   - מעבד ספירה
   - מעדכן אצוות
   
3. **runSummaryUpdates**
   - מעדכן סיכומי ריאגנטים


---

## 🎨 ממשק משתמש (UI)

UI לא מתועד

---

## 💾 זרימת נתונים (Data Flow)


```
Frontend State → API Call → Backend Logic → Database → Response → Frontend Update
```

ראה תרשים Flow Diagram למעלה לפירוט מלא.


---

## ⚠️ טיפול בשגיאות


### עקרונות

1. **Validation בצד לקוח**
   - בדיקת שדות חובה
   - פורמט תקין
   - טווחים הגיוניים

2. **Validation בצד שרת**
   - בדיקה חוזרת של כל הקלט
   - בדיקת הרשאות
   - בדיקת תקינות הפניות (IDs)

3. **Error Messages**
   - ברורים ומפורטים
   - בעברית
   - כוללים הצעה לפתרון

4. **Logging**
   - כל שגיאה מתועדת ב-console
   - כולל stack trace
   - timestamp מדויק

### דוגמה
```javascript
try {
  // פעולה
} catch (error) {
  console.error('[FunctionName] Error:', error);
  return Response.json({ 
    success: false, 
    error: error.message,
    details: 'פרטים נוספים כאן'
  }, { status: 500 });
}
```


---

## 🧪 מקרי קצה


- **תקלת תקשורת:** retry logic
- **נתונים חלקיים:** הצג מה שיש + הודעה
- **concurrent updates:** optimistic locking
- **גדול מדי:** pagination בשרת


---

## 🔍 נקודות ביישום


### נקודות לתשומת לב

1. ✅ **טסט לפני פרודקשן**
2. ✅ **תיעוד כל שינוי**
3. ✅ **שמור backward compatibility**
4. ✅ **הוסף migration scripts**




---

# 🔄 תהליך קליטת משלוח

## 📋 תיאור

תהליך מלא של קליטת משלוח נכנס עד לעדכון המלאי

---

## 🎯 מטרה ויעדים


**מטרה ראשית:** לקלוט משלוח נכנס מהספק, לעדכן את המלאי בצורה מדויקת, וליצור תיעוד מלא.

**יעדים משניים:**
- ✅ קישור המשלוח להזמנה מקורית (אם קיימת)
- ✅ עדכון אצוות קיימות או יצירת אצוות חדשות
- ✅ רישום מלא של כל התנועות ב-InventoryTransaction
- ✅ עדכון אוטומטי של כל הקישורים (Order ↔ Delivery ↔ WithdrawalRequest)


---

## 📊 Flow Diagram


```
┌──────────────┐
│ NewDelivery  │ ← משתמש ממלא טופס
└──────┬───────┘
       │
       │ POST Delivery + DeliveryItem[]
       ↓
┌──────────────────┐
│   Database       │ Delivery (status: open)
│                  │ DeliveryItem × N
└──────┬───────────┘
       │
       │ Navigate to EditDelivery?id=...
       ↓
┌──────────────────┐
│  EditDelivery    │ ← משתמש רואה פרטים
└──────┬───────────┘
       │
       │ Click "עבד משלוח"
       │ invoke('updateReagentInventory')
       ↓
┌───────────────────────────┐
│  updateReagentInventory   │
│  ┌─────────────────────┐  │
│  │ For each item:      │  │
│  │ - Update Batch      │  │
│  │ - Update Reagent    │  │
│  │ - Create Transaction│  │
│  │ - Link Order        │  │
│  └─────────────────────┘  │
└───────────┬───────────────┘
            │
            │ Multiple UPDATEs + CREATEs
            ↓
┌───────────────────────┐
│     Database          │
│  - ReagentBatch +50   │
│  - Reagent total +50  │
│  - Transaction logged │
│  - Order linked       │
│  - Delivery processed │
└───────────┬───────────┘
            │
            │ Response
            ↓
┌──────────────────┐
│  EditDelivery    │ ← "עובד בהצלחה" + רענון
└──────────────────┘
```


---

## 🔗 ישויות מעורבות


- **Delivery** - תעודת המשלוח הראשית
- **DeliveryItem** - פריטים בודדים במשלוח
- **ReagentBatch** - אצוות שנוצרו/עודכנו
- **Reagent** - ריאגנטים שהמלאי שלהם עודכן
- **InventoryTransaction** - תיעוד כל תנועה
- **Order** (אופציונלי) - הזמנה מקורית
- **WithdrawalRequest** (אופציונלי) - בקשות משיכה קשורות


---

## ⚙️ פונקציות Backend מעורבות


1. **getNewDeliveryPageData**
   - טוען ריאגנטים, ספקים, הזמנות פתוחות
   
2. **updateReagentInventory** (קריטי!)
   - מעבד את המשלוח
   - מעדכן מלאי
   
3. **getEditDeliveryData**
   - טוען משלוח עם כל הקישורים


---

## 🎨 ממשק משתמש (UI)


### NewDelivery Screen
- טופס מרכזי עם שלבים
- בחירת ספק (Select)
- אופציה לקשר להזמנה קיימת
- טבלה דינמית להוספת פריטים
- כפתור "שמור" → יוצר Delivery

### EditDelivery Screen
- תצוגת פרטי המשלוח
- כרטיסים לישויות מקושרות
- כפתור "עבד משלוח" (צהוב, בולט)
- לאחר עיבוד → כפתורים להדפסה/סגירה


---

## 💾 זרימת נתונים (Data Flow)


```
Frontend State → API Call → Backend Logic → Database → Response → Frontend Update
```

ראה תרשים Flow Diagram למעלה לפירוט מלא.


---

## ⚠️ טיפול בשגיאות


### עקרונות

1. **Validation בצד לקוח**
   - בדיקת שדות חובה
   - פורמט תקין
   - טווחים הגיוניים

2. **Validation בצד שרת**
   - בדיקה חוזרת של כל הקלט
   - בדיקת הרשאות
   - בדיקת תקינות הפניות (IDs)

3. **Error Messages**
   - ברורים ומפורטים
   - בעברית
   - כוללים הצעה לפתרון

4. **Logging**
   - כל שגיאה מתועדת ב-console
   - כולל stack trace
   - timestamp מדויק

### דוגמה
```javascript
try {
  // פעולה
} catch (error) {
  console.error('[FunctionName] Error:', error);
  return Response.json({ 
    success: false, 
    error: error.message,
    details: 'פרטים נוספים כאן'
  }, { status: 500 });
}
```


---

## 🧪 מקרי קצה


- **תקלת תקשורת:** retry logic
- **נתונים חלקיים:** הצג מה שיש + הודעה
- **concurrent updates:** optimistic locking
- **גדול מדי:** pagination בשרת


---

## 🔍 נקודות ביישום


### נקודות לתשומת לב

1. ✅ **טסט לפני פרודקשן**
2. ✅ **תיעוד כל שינוי**
3. ✅ **שמור backward compatibility**
4. ✅ **הוסף migration scripts**




---



# 📂 תיעוד טכני

---

# 🔄 ניהול State ו-Caching

## React Query - הספרייה המרכזית

### הגדרה בסיסית
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query - לטעינת נתונים
const { data, isLoading, error } = useQuery({
  queryKey: ['reagents'],
  queryFn: () => base44.entities.Reagent.list(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000 // 30 minutes
});

// Mutation - לעדכון נתונים
const mutation = useMutation({
  mutationFn: (newReagent) => base44.entities.Reagent.create(newReagent),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['reagents'] });
  }
});
```

## Cache Strategy

### Query Keys Convention
```javascript
['reagents']                    // כל הריאגנטים
['reagent', id]                 // ריאגנט ספציפי
['dashboard']                   // נתוני דשבורד
['delivery', id]                // משלוח ספציפי
['orders', { status: 'pending' }] // הזמנות מסוננות
```

### Invalidation Rules
```javascript
// לאחר יצירת משלוח
queryClient.invalidateQueries({ queryKey: ['deliveries'] });
queryClient.invalidateQueries({ queryKey: ['reagents'] }); // כי המלאי השתנה

// לאחר ספירת מלאי
queryClient.invalidateQueries(); // invalidate הכל!
```

## Local State

### useState for UI State
```javascript
const [isEditing, setIsEditing] = useState(false);
const [selectedItems, setSelectedItems] = useState([]);
const [filters, setFilters] = useState({ status: 'all' });
```

### localStorage for Persistence
```javascript
// שמירת עמודות נראות
const [visibleColumns, setVisibleColumns] = useState(() => {
  const saved = localStorage.getItem('tableColumns');
  return saved ? JSON.parse(saved) : defaultColumns;
});

useEffect(() => {
  localStorage.setItem('tableColumns', JSON.stringify(visibleColumns));
}, [visibleColumns]);
```

## Optimistic Updates

```javascript
const mutation = useMutation({
  mutationFn: updateReagent,
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['reagent', id] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['reagent', id]);
    
    // Optimistically update
    queryClient.setQueryData(['reagent', id], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['reagent', id], context.previous);
  }
});
```


---

# 💾 זרימת נתונים במערכת

## תרשים זרימה כללי

```
┌──────────┐
│  User    │
│  Action  │
└────┬─────┘
     │
     ↓
┌────────────────┐
│  Frontend      │
│  (React)       │
│  - Validation  │
│  - UI State    │
└────┬───────────┘
     │
     │ base44.functions.invoke()
     │ או base44.entities.*
     ↓
┌────────────────────┐
│  Backend Function  │
│  (Deno)            │
│  - Auth Check      │
│  - Business Logic  │
│  - Data Transform  │
└────┬───────────────┘
     │
     │ SQL Queries
     ↓
┌──────────────┐
│  Database    │
│  (Postgres)  │
└────┬─────────┘
     │
     │ Response
     ↓
┌────────────────┐
│  Frontend      │
│  - Display     │
│  - Update UI   │
└────────────────┘
```

## דוגמה: קליטת משלוח

### Step-by-Step Data Flow

```
1. USER: ממלא טופס NewDelivery
   └→ State: { supplier, delivery_date, items: [] }

2. FRONTEND: לחיצה על "שמור"
   └→ base44.entities.Delivery.create(deliveryData)
   └→ base44.entities.DeliveryItem.bulkCreate(items)

3. DATABASE: רשומות נוצרות
   └→ Delivery (id: "abc123", status: "open")
   └→ DeliveryItem × N (delivery_id: "abc123")

4. FRONTEND: ניווט ל-EditDelivery?id=abc123
   └→ base44.functions.invoke('getEditDeliveryData', { id })

5. BACKEND: getEditDeliveryData
   └→ SELECT * FROM Delivery WHERE id = ?
   └→ SELECT * FROM DeliveryItem WHERE delivery_id = ?
   └→ SELECT * FROM Order WHERE id = delivery.linked_order_id
   └→ Return { delivery, items, linkedOrder }

6. USER: לחיצה על "עבד משלוח"
   └→ base44.functions.invoke('updateReagentInventory', { deliveryId })

7. BACKEND: updateReagentInventory
   └→ For each DeliveryItem:
       ├→ UPDATE/CREATE ReagentBatch
       ├→ UPDATE Reagent.total_quantity
       ├→ CREATE InventoryTransaction
       └→ UPDATE Order.linked_delivery_ids

8. DATABASE: עדכונים מרובים
   └→ ReagentBatch.current_quantity += quantity
   └→ Reagent.total_quantity_all_batches recalculated
   └→ InventoryTransaction created

9. FRONTEND: הודעת הצלחה + רענון נתונים
```

## State Management עם React Query

```javascript
// Query for fetching data
const { data, isLoading } = useQuery({
  queryKey: ['delivery', deliveryId],
  queryFn: () => base44.functions.invoke('getEditDeliveryData', { id: deliveryId })
});

// Mutation for updating
const mutation = useMutation({
  mutationFn: (data) => base44.entities.Delivery.update(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['delivery'] });
    toast.success('עודכן בהצלחה');
  }
});
```


---

# 🏗️ סקירת ארכיטקטורה - Flow Control

## Stack טכנולוגי

### Frontend
- **Framework:** React 18.2
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 3.x
- **UI Library:** Shadcn/ui
- **State:** React Query (TanStack Query)
- **Router:** React Router DOM v6
- **Forms:** React Hook Form
- **Icons:** Lucide React
- **Charts:** Recharts
- **Dates:** date-fns

### Backend
- **Runtime:** Deno 1.x
- **Platform:** Base44 (BaaS)
- **Database:** PostgreSQL (managed)
- **Auth:** Base44 Auth Service (JWT)
- **Functions:** Deno Deploy Handlers
- **File Storage:** Base44 Storage

## ארכיטקטורת המערכת

```
┌─────────────────────────────────────────┐
│         Frontend (React SPA)            │
│  - Pages (מסכים)                        │
│  - Components (רכיבים)                  │
│  - Layout (תבנית ראשית)                 │
└──────────────┬──────────────────────────┘
               │
               │ HTTP/REST
               ↓
┌─────────────────────────────────────────┐
│       Base44 SDK (@base44/sdk)          │
│  - entities.* (CRUD)                    │
│  - functions.invoke()                   │
│  - auth.me()                            │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      Backend Functions (Deno)           │
│  - Business Logic                       │
│  - Data Aggregation                     │
│  - Complex Calculations                 │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
│  - Entities (Tables)                    │
│  - Relations                            │
│  - Indexes                              │
└─────────────────────────────────────────┘
```

## גישת Backend-Heavy

### עקרון בסיסי
**כל הלוגיקה המורכבת בשרת, Frontend רק מציג**

### יתרונות
1. ✅ ביצועים מעולים (במיוחד mobile)
2. ✅ מניעת rate limits
3. ✅ קוד פשוט יותר ב-Frontend
4. ✅ קל יותר לתחזוקה
5. ✅ אבטחה טובה יותר

### דוגמה
```javascript
// ❌ לא טוב - הרבה קריאות
const reagents = await base44.entities.Reagent.list();
const batches = await base44.entities.ReagentBatch.list();
const orders = await base44.entities.Order.list();
// ... עיבודים מורכבים בצד לקוח

// ✅ טוב - קריאה אחת
const response = await base44.functions.invoke('getDashboardData');
// הכל מעובד ומוכן להצגה
```

## Security Architecture

### Authentication Flow
```
1. User Login → Base44 Auth
2. JWT Token issued
3. Token stored in browser
4. Every request includes token
5. Backend validates with base44.auth.me()
```

### Authorization Levels
- **User:** CRUD on own data
- **Admin:** Full access + system management
- **Service Role:** Backend functions with elevated permissions

### Security Features
- Device fingerprinting
- Security level per user
- Audit logging
- Soft deletes (is_deleted flag)


---

