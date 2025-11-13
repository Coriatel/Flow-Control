# מסמך טכני - חישוב צריכה חודשית ממוצעת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/calculateAverageUsage.js

---

# מסמך טכני - calculateAverageUsage

## Logic

```javascript
async function calculateAverageUsage(reagent_id, months = 6) {
  const cutoffDate = subMonths(new Date(), months);
  
  const transactions = await InventoryTransaction.filter({
    reagent_id,
    transaction_type: { $in: ['withdrawal', 'disposal', 'shipment_out'] },
    created_date: { $gte: cutoffDate.toISOString() }
  });
  
  const totalUsage = transactions.reduce(
    (sum, t) => sum + Math.abs(t.quantity),
    0
  );
  
  const avgMonthly = totalUsage / months;
  
  await Reagent.update(reagent_id, {
    average_monthly_usage: avgMonthly
  });
  
  return { avgMonthly, totalUsage, months };
}
```