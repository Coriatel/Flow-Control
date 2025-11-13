# מסמך טכני - טעינת נתונים לקליטת משלוח

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getNewDeliveryPageData.js

---

# מסמך טכני - getNewDeliveryPageData

## Logic

```javascript
const [openOrders, reagents, recentBatches] = await Promise.all([
  Order.filter({
    status: { $in: ['approved', 'partially_received'] },
    order_type: 'immediate_delivery'
  }),
  Reagent.list(),
  ReagentBatch.list('-created_date', 100)
]);

const orderItems = await Promise.all(
  openOrders.map(async o => {
    const items = await OrderItem.filter({ 
      order_id: o.id,
      quantity_remaining: { $gt: 0 }
    });
    return { ...o, items };
  })
);

const reagentsBySupplier = groupBy(reagents, 'supplier');

return {
  open_orders: orderItems,
  reagents_by_supplier: reagentsBySupplier,
  recent_batches: recentBatches,
  defaults: {
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_type: 'with_order'
  }
};
```

## ישויות
- Order, OrderItem
- Reagent
- ReagentBatch