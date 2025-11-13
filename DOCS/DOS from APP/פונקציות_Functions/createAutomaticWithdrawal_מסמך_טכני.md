# מסמך טכני - יצירת בקשת משיכה אוטומטית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/createAutomaticWithdrawal.js

---

# מסמך טכני - createAutomaticWithdrawal

## Logic

```javascript
const grouped = groupBy(recommendations, 'reagent.supplier');

for (const [supplier, items] of Object.entries(grouped)) {
  const framework = await Order.filter({
    supplier_name_snapshot: supplier,
    order_type: 'framework',
    status: 'approved'
  }).first();
  
  if (!framework) {
    throw new Error(`אין מסגרת פעילה ל-${supplier}`);
  }
  
  const withdrawal = await WithdrawalRequest.create({
    withdrawal_number: generateWithdrawalNumber(),
    framework_order_id: framework.id,
    framework_order_number_snapshot: framework.order_number_permanent,
    supplier_snapshot: supplier,
    request_date: new Date().toISOString().split('T')[0],
    urgency_level: 'routine',
    status: 'draft',
    requester_notes: 'בקשה אוטומטית ממערכת ההשלמה'
  });
  
  for (const rec of items) {
    await WithdrawalItem.create({
      withdrawal_request_id: withdrawal.id,
      reagent_id: rec.reagent.id,
      reagent_name_snapshot: rec.reagent.name,
      quantity_requested: rec.suggested_quantity,
      justification: rec.justification
    });
  }
}
```