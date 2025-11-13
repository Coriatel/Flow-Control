# מסמך טכני - חישוב השלמות מלאי

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getReplenishmentData.js

---

# מסמך טכני - getReplenishmentData

## Logic

```javascript
const reagents = await Reagent.filter({ category: 'reagents' });
const recommendations = [];

for (const r of reagents) {
  const current = r.total_quantity_all_batches || 0;
  const monthlyUsage = r.use_manual_usage 
    ? r.manual_monthly_usage 
    : r.average_monthly_usage || 1;
  
  const monthsLeft = current / monthlyUsage;
  const targetMonths = 4;
  const minMonths = 2;
  
  if (monthsLeft < minMonths) {
    const needed = (targetMonths * monthlyUsage) - current;
    const suggested = Math.ceil(needed);
    
    recommendations.push({
      reagent: r,
      current_stock: current,
      monthly_usage: monthlyUsage,
      months_left: monthsLeft,
      suggested_quantity: suggested,
      priority: monthsLeft < 0.5 ? 'critical' : 
                monthsLeft < 1 ? 'high' : 'medium',
      justification: `מלאי ל-${monthsLeft.toFixed(1)} חודשים`
    });
  }
}

const grouped = groupBy(recommendations, 'reagent.supplier');
return { recommendations, grouped_by_supplier: grouped };
```