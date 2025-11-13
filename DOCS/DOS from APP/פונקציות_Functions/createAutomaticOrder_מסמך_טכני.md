# מסמך טכני - יצירת הזמנה אוטומטית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/createAutomaticOrder.js

---

# מסמך טכני - createAutomaticOrder

## Logic

```javascript
const grouped = groupBy(recommendations, 'reagent.supplier');
const createdOrders = [];

for (const [supplier, items] of Object.entries(grouped)) {
  const order = await Order.create({
    order_number_temp: generateOrderNumber(),
    supplier_name_snapshot: supplier,
    order_date: new Date().toISOString().split('T')[0],
    status: 'pending_sap_details',
    order_type: 'immediate_delivery',
    notes: 'הזמנה אוטומטית ממערכת ההשלמה'
  });
  
  for (const rec of items) {
    await OrderItem.create({
      order_id: order.id,
      reagent_id: rec.reagent.id,
      reagent_name_snapshot: rec.reagent.name,
      quantity_ordered: rec.suggested_quantity,
      notes: rec.justification
    });
  }
  
  createdOrders.push(order);
}

return { orders: createdOrders };
```