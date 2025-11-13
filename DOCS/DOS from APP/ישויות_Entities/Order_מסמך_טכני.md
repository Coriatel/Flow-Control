# מסמך טכני - הזמנות/דרישות רכש

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Order.json

---

# מסמך טכני - Order Entity

## Schema

```json
{
  "name": "Order",
  "properties": {
    "order_number_temp": { "type": "string" },
    "order_number_permanent": { "type": "string" },
    "purchase_order_number_sap": { "type": "string" },
    "supplier_name_snapshot": { "type": "string" },
    "order_date": { "type": "string", "format": "date" },
    "status": {
      "type": "string",
      "enum": [
        "pending_sap_details",
        "approved",
        "partially_received",
        "fully_received",
        "closed",
        "cancelled",
        "pending_sap_permanent_id",
        "pending_sap_po_number"
      ],
      "default": "pending_sap_details"
    },
    "order_type": {
      "type": "string",
      "enum": ["immediate_delivery", "framework"]
    },
    "expected_delivery_start_date": { "type": "string", "format": "date" },
    "expected_delivery_end_date": { "type": "string", "format": "date" },
    "total_value": { "type": "number" },
    "notes": { "type": "string" },
    "is_deleted": { "type": "boolean", "default": false },
    "deleted_reason": { "type": "string" },
    "deleted_date": { "type": "string", "format": "date-time" },
    "deleted_by": { "type": "string" },
    "edit_history": { "type": "array" },
    "linked_withdrawal_request_ids": { "type": "array", "default": [] },
    "linked_delivery_ids": { "type": "array", "default": [] }
  },
  "required": ["order_number_temp", "supplier_name_snapshot", "order_date", "status", "order_type"]
}
```

## Auto-numbering Logic

```javascript
async function generateOrderNumber() {
  const year = new Date().getFullYear();
  const count = await Order.filter({ 
    order_number_temp: { $regex: `^O-${year}-` } 
  }).length;
  
  return `O-${year}-${String(count + 1).padStart(3, '0')}`;
}
// Example: O-2024-001, O-2024-002...
```

## Status Transitions

```
pending_sap_details
    ↓ (SAP permanent added)
pending_sap_po_number
    ↓ (SAP PO added)
approved
    ↓ (first delivery)
partially_received
    ↓ (all items received)
fully_received
    ↓ (manual close)
closed
```

## Relations

- Order → OrderItem (one-to-many)
- Order → Delivery (many-to-many via linked_delivery_ids)
- Order → WithdrawalRequest (many-to-many via linked_withdrawal_request_ids)

## Soft Delete

```javascript
await Order.update(order_id, {
  is_deleted: true,
  deleted_by: user.email,
  deleted_date: new Date(),
  deleted_reason: reason
});
```

הרשומה נשארת, אבל מסומנת כמחוקה.