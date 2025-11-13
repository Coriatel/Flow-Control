# מסמך טכני - ארכון נתונים ישנים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/archiveOldData.js

---

# מסמך טכני - archiveOldData

## Logic

```javascript
const twoYearsAgo = subYears(new Date(), 2);
const archived = [];

const oldTransactions = await InventoryTransaction.filter({
  created_date: { $lt: twoYearsAgo }
});

for (const tx of oldTransactions) {
  await ArchivedData.create({
    original_id: tx.id,
    original_type: 'InventoryTransaction',
    archived_date: new Date(),
    data: JSON.stringify(tx),
    archive_reason: 'auto_archive_older_than_2_years',
    retention_period: '7 years',
    can_be_deleted_after: addYears(new Date(), 7)
  });
  
  // Optional: delete original
  // await InventoryTransaction.delete(tx.id);
  
  archived.push(tx.id);
}

return { archived_count: archived.length };
```