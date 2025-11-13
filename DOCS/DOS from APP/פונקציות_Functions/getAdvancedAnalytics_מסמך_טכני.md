# מסמך טכני - אנליטיקה מתקדמת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getAdvancedAnalytics.js

---

# מסמך טכני - getAdvancedAnalytics

## Implementation

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { subMonths, format } from 'npm:date-fns@3.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { analysis_type, params } = await req.json();
  
  switch (analysis_type) {
    case 'usage_trends':
      return await analyzeUsageTrends(base44, params);
    
    case 'cost_analysis':
      return await analyzeCosts(base44, params);
    
    case 'forecast':
      return await forecastUsage(base44, params);
    
    case 'anomalies':
      return await detectAnomalies(base44, params);
  }
});

async function analyzeUsageTrends(base44, { reagent_id, months = 12 }) {
  const cutoff = subMonths(new Date(), months);
  
  const transactions = await base44.asServiceRole.entities.InventoryTransaction.filter({
    reagent_id,
    transaction_type: { $in: ['withdrawal', 'disposal'] },
    created_date: { $gte: cutoff }
  });
  
  // Group by month
  const monthlyData = {};
  for (const tx of transactions) {
    const month = format(parseISO(tx.created_date), 'yyyy-MM');
    monthlyData[month] = (monthlyData[month] || 0) + Math.abs(tx.quantity);
  }
  
  return { monthly_usage: monthlyData };
}

async function forecastUsage(base44, { reagent_id }) {
  const last12Months = await analyzeUsageTrends(base44, { reagent_id, months: 12 });
  const values = Object.values(last12Months.monthly_usage);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Simple linear regression
  const trend = calculateTrend(values);
  
  const forecast = [
    avg + trend,
    avg + trend * 2,
    avg + trend * 3
  ];
  
  return { forecast_next_3_months: forecast, confidence: 0.8 };
}
```

## ישויות מעורבות

### Read:
1. **InventoryTransaction** - historical data
2. **Reagent** - metadata
3. **Order** - cost data
4. **Delivery** - supplier performance

## Performance

- Large datasets (12 months)
- In-memory calculations
- ~1-3 seconds for complex analysis