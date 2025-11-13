# מסמך טכני - פרטי ספירה בודדת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getSingleInventoryCountDetails.js

---

# מסמך טכני - getSingleInventoryCountDetails

## Logic

```javascript
const count = await CompletedInventoryCount.get(count_id);
const entries = count.entries || {};

const details = await Promise.all(
  Object.entries(entries).map(async ([batchId, entry]) => {
    const batch = await ReagentBatch.get(batchId);
    const reagent = await Reagent.get(batch.reagent_id);
    
    return {
      batch_id: batchId,
      reagent_name: reagent.name,
      batch_number: batch.batch_number,
      expiry_date: batch.expiry_date,
      counted: entry.counted,
      previous_quantity: entry.previous_quantity,
      delta: entry.counted - entry.previous_quantity,
      notes: entry.notes
    };
  })
);

return { count, details };
```