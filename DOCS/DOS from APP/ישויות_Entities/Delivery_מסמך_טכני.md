# מסמך טכני - משלוחים (תעודות קבלה)

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Delivery.json

---

# מסמך טכני - Delivery Entity

## Schema

```json
{
  "name": "Delivery",
  "type": "object",
  "properties": {
    "delivery_number": { "type": "string" },
    "supplier": { 
      "type": "string",
      "enum": ["ELDAN", "BIORAD", "DYN", "OTHER"]
    },
    "delivery_date": { "type": "string", "format": "date" },
    "order_number": { "type": "string" },
    "linked_order_id": { "type": "string" },
    "delivery_type": {
      "type": "string",
      "enum": ["with_order", "no_charge", "replacement", "other"],
      "default": "with_order"
    },
    "delivery_reason_text": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["open", "processing", "processed", "closed"],
      "default": "open"
    },
    "completion_type": {
      "type": "string",
      "enum": ["full", "partial"]
    },
    "total_items_expected": { "type": "integer" },
    "total_items_received": { "type": "integer", "default": 0 },
    "has_non_order_items": { "type": "boolean", "default": false },
    "has_replacements": { "type": "boolean", "default": false },
    "document_url": { "type": "string" },
    "notes": { "type": "string" },
    "incomplete_fields": { "type": "array" },
    "completion_notes": { "type": "string" },
    "edit_history": { "type": "array" },
    "linked_withdrawal_request_ids": { "type": "array", "default": [] }
  },
  "required": ["supplier", "delivery_date", "delivery_type"]
}
```

## Processing Logic

```javascript
async function processDelivery(delivery_id) {
  const delivery = await Delivery.get(delivery_id);
  const items = await DeliveryItem.filter({ delivery_id });
  
  // 1. Create/update ReagentBatches
  for (const item of items) {
    const batch = await ReagentBatch.create({
      reagent_id: item.reagent_id,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      initial_quantity: item.quantity_received,
      current_quantity: item.quantity_received,
      status: 'incoming',
      received_date: delivery.delivery_date,
      delivery_reference: delivery.delivery_number
    });
    
    // 2. Update DeliveryItem with batch_id
    await DeliveryItem.update(item.id, {
      reagent_batch_id: batch.id
    });
  }
  
  // 3. Update Order (if linked)
  if (delivery.linked_order_id) {
    const orderItems = await OrderItem.filter({ order_id: delivery.linked_order_id });
    
    for (const oi of orderItems) {
      const receivedHere = items
        .filter(di => di.reagent_id === oi.reagent_id)
        .reduce((sum, di) => sum + di.quantity_received, 0);
      
      await OrderItem.update(oi.id, {
        quantity_received: oi.quantity_received + receivedHere,
        quantity_remaining: oi.quantity_ordered - (oi.quantity_received + receivedHere)
      });
    }
  }
  
  // 4. Update Delivery status
  await Delivery.update(delivery_id, {
    status: 'processed',
    total_items_received: items.length
  });
  
  // 5. Update all affected Reagents
  const uniqueReagents = [...new Set(items.map(i => i.reagent_id))];
  for (const reagent_id of uniqueReagents) {
    await updateReagentTotals(reagent_id);
  }
}
```

## Relations

### One-to-Many:
- Delivery → DeliveryItem (delivery_id)

### Many-to-One:
- Delivery → Order (linked_order_id)

### Many-to-Many:
- Delivery ↔ WithdrawalRequest (via linked_withdrawal_request_ids)