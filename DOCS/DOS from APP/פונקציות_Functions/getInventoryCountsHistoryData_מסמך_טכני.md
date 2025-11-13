# מסמך טכני - היסטוריית ספירות מלאי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getInventoryCountsHistoryData.js

---

# מסמך טכני - getInventoryCountsHistoryData

## Logic

```javascript
const counts = await CompletedInventoryCount.filter(
  filters,
  '-count_date',
  limit
);

const enriched = counts.map(c => ({
  ...c,
  batches_count: Object.keys(c.entries || {}).length,
  has_csv: c.csv_generated,
  display_date: format(parseISO(c.count_date), 'dd/MM/yyyy', { locale: he })
}));

return { counts: enriched };
```

## ישויות
- CompletedInventoryCount (read)

## Performance
- Sorting: -count_date (newest first)
- Limit: 50 default
- Projection: only needed fields