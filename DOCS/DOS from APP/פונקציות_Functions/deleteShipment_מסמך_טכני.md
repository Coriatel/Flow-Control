# מסמך טכני - למחיקת משלוח יוצא

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/deleteShipment.js

---

# מסמך טכני - deleteShipment

## Logic

```javascript
const shipment = await Shipment.get(shipment_id);

if (['delivered', 'confirmed'].includes(shipment.status)) {
  throw new Error('לא ניתן למחוק משלוח שכבר אושר/הוספק');
}

const items = await ShipmentItem.filter({ shipment_id });

for (const item of items) {
  const batch = await ReagentBatch.get(item.reagent_batch_id);
  
  await ReagentBatch.update(batch.id, {
    current_quantity: batch.current_quantity + item.quantity_sent,
    available_quantity: batch.available_quantity + item.quantity_sent
  });
  
  await InventoryTransaction.create({
    reagent_id: item.reagent_id,
    transaction_type: 'shipment_cancellation',
    quantity: item.quantity_sent,
    batch_number: item.batch_number,
    notes: `ביטול משלוח ${shipment.shipment_number}`
  });
}

await Shipment.update(shipment_id, {
  is_deleted: true,
  deleted_date: new Date(),
  deleted_by: user.email,
  deleted_reason: reason
});
```