# מסמך טכני - יומן פעילות מצטבר

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getAggregatedActivityLog.js

---

# מסמך טכני - getAggregatedActivityLog

## Logic

```javascript
const [transactions, orders, deliveries, shipments, withdrawals] = await Promise.all([
  InventoryTransaction.filter(dateFilter, '-created_date', 100),
  Order.filter(dateFilter, '-created_date', 50),
  Delivery.filter(dateFilter, '-created_date', 50),
  Shipment.filter(dateFilter, '-created_date', 50),
  WithdrawalRequest.filter(dateFilter, '-created_date', 50)
]);

const combined = [
  ...transactions.map(t => ({
    timestamp: t.created_date,
    type: t.transaction_type,
    user: t.created_by,
    description: `עדכון מלאי: ${t.quantity} ל-${t.reagent_name}`,
    entity_type: 'InventoryTransaction',
    entity_id: t.id
  })),
  ...orders.map(o => ({
    timestamp: o.created_date,
    type: 'order_created',
    user: o.created_by,
    description: `יצירת הזמנה ${o.order_number_temp}`,
    entity_type: 'Order',
    entity_id: o.id
  }))
  // ... etc
];

const sorted = combined.sort((a, b) => 
  parseISO(b.timestamp) - parseISO(a.timestamp)
);

return { activities: sorted, statistics: {...} };
```