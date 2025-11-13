# מסמך טכני - מרכז הבקרה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** pages/Dashboard.js

---

# מסמך טכני - Dashboard

## ארכיטקטורה

```
Frontend (React) → Single API Call → Backend (Deno) → Database
  Dashboard.js         getDashboardData      Supabase
```

## קבצים מעורבים

### Frontend
- `pages/Dashboard.js` - קומפוננט ראשי
- `components/dashboard/SummaryCard.jsx` - כרטיס סיכום
- `components/dashboard/CriticalActions.jsx` - התראות
- `components/dashboard/RecentActivity.jsx` - יומן
- `components/dashboard/NavGroupAccordion.jsx` - ניווט
- `components/dashboard/DashboardPopover.jsx` - פופאובר

### Backend
- `functions/getDashboardData.js` - פונקציה מרכזית

## State Management

```javascript
const [dashboardData, setDashboardData] = useState({
  expiringReagents: [],
  lowStockReagents: [],
  pendingOrders: [],
  pendingSupplies: [],
  dashboardNotes: [],
  lastInventoryCount: null,
  recentActivity: [],
  criticalActions: []
});
```

## API Pattern

### Single Comprehensive Call
```javascript
// ✅ NEW WAY
const response = await base44.functions.invoke('getDashboardData');
setDashboardData(response.data);
```

## Backend Logic

### getDashboardData.js
```javascript
1. Authenticate user
2. Parallel fetch (Promise.allSettled):
   - Reagent.list()
   - Order.list()
   - WithdrawalRequest.list()
   - ExpiredProductLog.list()
   - DashboardNote.filter()
   - CompletedInventoryCount.list()
   - InventoryTransaction.list()
   - Delivery.list()
3. Calculate:
   - expiringReagents
   - lowStockReagents
   - pendingOrders
   - pendingSupplies
   - recentActivity
   - criticalActions
4. Return consolidated JSON
```

## Performance

- Server-side calculations
- Minimal field selection
- Single API call
- useCallback for memoization
- Conditional rendering

## Entity Dependencies (Read-Only)

- Reagent
- ReagentBatch
- Order
- OrderItem
- WithdrawalRequest
- Delivery
- InventoryTransaction
- CompletedInventoryCount
- DashboardNote
- ExpiredProductLog

## Component Hierarchy

```
Dashboard
├── Header
├── CriticalActions
├── [SummaryCard x4]
├── Notes Card
├── RecentActivity
└── NavGroupAccordion
```

## Error Handling

### Backend
```javascript
try {
  const data = await fetch();
} catch (error) {
  console.error(error);
  return []; // Don't crash
}
```

### Frontend
```javascript
try {
  const response = await invoke();
  setData(response.data);
} catch (err) {
  setError(err.message);
  toast.error('שגיאה');
}
```

## Responsive Breakpoints

- Mobile: < 1024px (1 column)
- Desktop: >= 1024px (5 columns: 3+2)