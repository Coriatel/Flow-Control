# מסמך טכני - מנוע התראות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/alertsEngine.js

---

# מסמך טכני - alertsEngine

## Logic

```javascript
const rules = await AlertRule.filter({ is_active: true });

for (const rule of rules) {
  let triggered = false;
  let affectedItems = [];
  
  switch (rule.rule_type) {
    case 'expiry_warning':
      const daysAhead = rule.conditions.days_ahead || 14;
      affectedItems = await ReagentBatch.filter({
        status: 'active',
        expiry_date: { $lte: addDays(new Date(), daysAhead) }
      });
      triggered = affectedItems.length > 0;
      break;
    
    case 'low_stock':
      affectedItems = await Reagent.filter({
        current_stock_status: 'low_stock'
      });
      triggered = affectedItems.length > 0;
      break;
  }
  
  if (triggered) {
    const existingAlert = await ActiveAlert.filter({
      alert_rule_id: rule.id,
      status: 'active'
    }).first();
    
    if (!existingAlert) {
      await ActiveAlert.create({
        alert_rule_id: rule.id,
        alert_type: rule.rule_type,
        priority: rule.priority,
        title: rule.rule_name,
        affected_items: affectedItems
      });
    }
  } else if (rule.auto_resolve) {
    await ActiveAlert.updateMany(
      { alert_rule_id: rule.id, status: 'active' },
      { status: 'resolved' }
    );
  }
}
```