# מסמך טכני - ניקוי ותחזוקה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/cleanupOperations.js

---

## Logic

```javascript
async function cleanupOperations({ dry_run = false }) {
  const cleaned = [];
  
  // 1. Orphaned DeliveryItems
  const allDeliveries = await Delivery.list();
  const validDeliveryIds = allDeliveries.map(d => d.id);
  const orphanedItems = await DeliveryItem.filter({
    delivery_id: { $nin: validDeliveryIds }
  });
  
  if (!dry_run) {
    for (const item of orphanedItems) {
      await DeliveryItem.delete(item.id);
    }
  }
  cleaned.push({ type: 'orphaned_delivery_items', count: orphanedItems.length });
  
  // 2. Old drafts
  const oldDrafts = await InventoryCountDraft.filter({
    last_update: { $lt: subDays(new Date(), 30) },
    completed: false
  });
  
  if (!dry_run) {
    for (const draft of oldDrafts) {
      await InventoryCountDraft.delete(draft.id);
    }
  }
  cleaned.push({ type: 'old_drafts', count: oldDrafts.length });
  
  return { cleaned, dry_run };
}
```