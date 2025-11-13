# אפיון תפקודי - עדכון מלאי ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/updateReagentInventory.js

---

## מטרת הפונקציה

עדכון מרכזי של מלאי ריאגנט - מחשב מחדש את כל הסיכומים: total_quantity, active_batches_count, nearest_expiry_date, oldest_batch_date, months_of_stock, reorder_suggestion.

## מתי קוראים לפונקציה?

1. אחרי קליטת משלוח
2. אחרי משיכה
3. אחרי ספירת מלאי
4. אחרי שינוי באצווה
5. אחרי תיקון שגיאות

## Logic המרכזי

```javascript
const batches = await ReagentBatch.filter({ reagent_id, status: 'active' });

const totalQty = batches.reduce((sum, b) => sum + b.current_quantity, 0);
const nearestExpiry = batches.sort((a,b) => a.expiry_date > b.expiry_date ? 1 : -1)[0]?.expiry_date;
const monthsOfStock = totalQty / reagent.average_monthly_usage;

await Reagent.update(reagent_id, {
  total_quantity_all_batches: totalQty,
  active_batches_count: batches.length,
  nearest_expiry_date: nearestExpiry,
  months_of_stock: monthsOfStock,
  reorder_suggestion: monthsOfStock < 2
});
```