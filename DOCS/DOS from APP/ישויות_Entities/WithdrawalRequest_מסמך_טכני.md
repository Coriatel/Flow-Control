# מסמך טכני - בקשות משיכה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/WithdrawalRequest.json

---

# מסמך טכני - WithdrawalRequest

## Schema

```json
{
  "name": "WithdrawalRequest",
  "properties": {
    "withdrawal_number": { "type": "string" },
    "framework_order_id": { "type": "string" },
    "framework_order_number_snapshot": { "type": "string" },
    "supplier_snapshot": { "type": "string" },
    "request_date": { "type": "string", "format": "date" },
    "requested_delivery_date": { "type": "string", "format": "date" },
    "urgency_level": {
      "type": "string",
      "enum": ["routine", "urgent", "emergency"],
      "default": "routine"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "submitted", "approved", "rejected", "in_delivery", "completed", "cancelled"],
      "default": "draft"
    },
    "total_requested_value": { "type": "number" },
    "approved_value": { "type": "number" },
    "rejection_reason": { "type": "string" },
    "approval_notes": { "type": "string" },
    "approval_required": { "type": "boolean", "default": true },
    "auto_approved": { "type": "boolean", "default": false },
    "is_deleted": { "type": "boolean", "default": false },
    "deleted_date": { "type": "string", "format": "date-time" },
    "deleted_by": { "type": "string" },
    "deletion_reason": { "type": "string" },
    "linked_delivery_ids": { "type": "array", "default": [] }
  },
  "required": ["framework_order_id", "request_date", "urgency_level"]
}
```

## Auto-numbering

```javascript
const year = new Date().getFullYear();
const count = await WithdrawalRequest.filter({ 
  withdrawal_number: { $regex: `^W-${year}-` } 
}).length;

withdrawal_number = `W-${year}-${String(count + 1).padStart(3, '0')}`;
// W-2024-001, W-2024-002...
```

## Relations

- WithdrawalRequest → Order (framework_order_id)
- WithdrawalRequest → WithdrawalItem (one-to-many)
- WithdrawalRequest → Delivery (many-to-many via linked_delivery_ids)