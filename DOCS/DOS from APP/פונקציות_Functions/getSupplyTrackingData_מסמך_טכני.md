# מסמך טכני - מעקב אספקות - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getSupplyTrackingData.js

---

# מסמך טכני - getSupplyTrackingData

## Logic

```javascript
const [orders, withdrawals, deliveries] = await Promise.all([
  Order.filter({ status: { $nin: ['closed', 'cancelled'] } }),
  WithdrawalRequest.filter({ status: { $nin: ['completed', 'cancelled'] } }),
  Delivery.list('-delivery_date', 50)
]);

const timeline = [
  ...orders.map(o => ({
    type: 'order_created',
    date: o.order_date,
    order_number: o.order_number_temp,
    supplier: o.supplier_name_snapshot,
    status: o.status
  })),
  ...withdrawals.map(w => ({
    type: 'withdrawal_submitted',
    date: w.request_date,
    withdrawal_number: w.withdrawal_number,
    supplier: w.supplier_snapshot,
    status: w.status
  })),
  ...deliveries.map(d => ({
    type: 'delivery_received',
    date: d.delivery_date,
    delivery_number: d.delivery_number,
    supplier: d.supplier,
    status: d.status
  }))
].sort((a, b) => parseISO(b.date) - parseISO(a.date));

return { timeline, pending_supplies: [...], overdue_items: [...] };
```