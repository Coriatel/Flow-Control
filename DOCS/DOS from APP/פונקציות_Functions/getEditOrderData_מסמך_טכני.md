# מסמך טכני - טעינת נתוני עריכת הזמנה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getEditOrderData.js

---

# מסמך טכני - getEditOrderData

## Logic

```javascript
const order = await Order.get(order_id);
const items = await OrderItem.filter({ order_id });

const enrichedItems = await Promise.all(
  items.map(async item => {
    const reagent = await Reagent.get(item.reagent_id);
    return {
      ...item,
      reagent_name: reagent.name,
      quantity_remaining_calc: item.quantity_ordered - item.quantity_received
    };
  })
);

const deliveries = await Delivery.filter({
  id: { $in: order.linked_delivery_ids || [] }
});

const withdrawals = order.order_type === 'framework'
  ? await WithdrawalRequest.filter({
      id: { $in: order.linked_withdrawal_request_ids || [] },
      is_deleted: false
    })
  : [];

return {
  order,
  items: enrichedItems,
  linked_deliveries: deliveries,
  linked_withdrawals: withdrawals,
  edit_permissions: {
    can_edit_items: order.status === 'pending_sap_details',
    can_edit_sap: ['pending_sap_details', 'pending_sap_permanent_id'].includes(order.status),
    can_delete: items.every(i => i.quantity_received === 0)
  }
};
```

## ישויות
- Order, OrderItem
- Delivery (linked)
- WithdrawalRequest (framework)
- Reagent (enrichment)