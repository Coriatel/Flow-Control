# מסמך טכני - אצוות ריאגנטים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/ReagentBatch.json

---

# מסמך טכני - ReagentBatch Entity

## Schema

```json
{
  "name": "ReagentBatch",
  "type": "object",
  "properties": {
    "catalog_item_id": { "type": "string" },
    "reagent_id": { "type": "string" },
    "batch_number": { "type": "string" },
    "manufacture_date": { "type": "string", "format": "date" },
    "expiry_date": { "type": "string", "format": "date" },
    "current_quantity": { "type": "number", "default": 0 },
    "initial_quantity": { "type": "number" },
    "reserved_quantity": { "type": "number", "default": 0 },
    "available_quantity": { "type": "number" },
    "status": {
      "type": "string",
      "enum": ["incoming", "quarantine", "qc_pending", "active", "expired", "consumed", "recalled", "returned"],
      "default": "incoming"
    },
    "storage_location": { "type": "string" },
    "received_date": { "type": "string", "format": "date" },
    "received_by": { "type": "string" },
    "coa_document_url": { "type": "string" },
    "coa_upload_date": { "type": "string", "format": "date-time" },
    "coa_uploaded_by": { "type": "string" },
    "qc_status": {
      "type": "string",
      "enum": ["not_required", "pending", "in_progress", "passed", "failed", "inconclusive"],
      "default": "not_required"
    },
    "usage_log": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "date": { "type": "string", "format": "date" },
          "quantity_used": { "type": "number" },
          "used_by": { "type": "string" },
          "purpose": { "type": "string" },
          "notes": { "type": "string" }
        }
      }
    }
  },
  "required": ["catalog_item_id", "reagent_id", "batch_number", "expiry_date", "current_quantity", "initial_quantity"]
}
```

## Relationships

- **ReagentBatch** → **Reagent** (reagent_id)
- **ReagentBatch** → **ReagentCatalog** (catalog_item_id)
- **ReagentBatch** ← **DeliveryItem** (reagent_batch_id)
- **ReagentBatch** ← **InventoryTransaction** (batch_number)

## Key Operations

### Create Batch (processDelivery):
```javascript
const batch = await ReagentBatch.create({
  catalog_item_id: reagent.catalog_item_id,
  reagent_id: reagent.id,
  batch_number: deliveryItem.batch_number,
  expiry_date: deliveryItem.expiry_date,
  initial_quantity: deliveryItem.quantity_received,
  current_quantity: deliveryItem.quantity_received,
  status: reagent.requires_coa ? 'qc_pending' : 'active',
  received_date: delivery.delivery_date,
  received_by: user.email
});
```

### Update Quantity (withdrawal/count):
```javascript
const batch = await ReagentBatch.get(batch_id);
await ReagentBatch.update(batch_id, {
  current_quantity: batch.current_quantity - quantity_withdrawn,
  available_quantity: batch.current_quantity - quantity_withdrawn - batch.reserved_quantity,
  usage_log: [...batch.usage_log, {
    date: new Date(),
    quantity_used: quantity_withdrawn,
    used_by: user.email,
    purpose: 'withdrawal'
  }]
});
```

### Upload COA:
```javascript
const { file_url } = await base44.integrations.Core.UploadFile({ file });
await ReagentBatch.update(batch_id, {
  coa_document_url: file_url,
  coa_uploaded_by: user.email,
  coa_upload_date: new Date(),
  status: 'active' // if qc_status allows
});
```

## Indexes (Performance)

- reagent_id (frequent filtering)
- status (active batches queries)
- expiry_date (expiry checks)
- batch_number (uniqueness check)