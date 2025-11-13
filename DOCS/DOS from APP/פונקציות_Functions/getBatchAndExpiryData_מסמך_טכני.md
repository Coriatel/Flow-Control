# מסמך טכני - ניהול אצוות ופגי תוקף - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getBatchAndExpiryData.js

---

# מסמך טכני - getBatchAndExpiryData

## Logic

```javascript
const now = new Date();
const allBatches = await ReagentBatch.filter({ status: 'active' });
const handledLogs = await ExpiredProductLog.list();
const handledKeys = new Set(handledLogs.map(l => `${l.reagent_id}_${l.original_expiry_date}`));

const expiringBatches = allBatches
  .filter(b => {
    const expDate = parseISO(b.expiry_date);
    const daysUntil = differenceInDays(expDate, now);
    const key = `${b.reagent_id}_${b.expiry_date}`;
    
    return daysUntil <= 30 && !handledKeys.has(key);
  })
  .map(b => ({
    ...b,
    days_until_expiry: differenceInDays(parseISO(b.expiry_date), now),
    priority: daysUntil < 0 ? 'critical' : daysUntil < 7 ? 'high' : 'medium',
    suggested_action: daysUntil < 0 ? 'dispose' : 'use_first',
    has_been_handled: false
  }));

const oldBatches = allBatches
  .filter(b => {
    const age = differenceInDays(now, parseISO(b.received_date));
    return age > 180; // 6 months
  });

const statistics = {
  expired_today: expiringBatches.filter(b => b.days_until_expiry < 0).length,
  expiring_this_week: expiringBatches.filter(b => b.days_until_expiry <= 7).length,
  expiring_this_month: expiringBatches.filter(b => b.days_until_expiry <= 30).length,
  old_batches_6m_plus: oldBatches.length
};

return { expiring_batches: expiringBatches, old_batches: oldBatches, handled_items: handledLogs, statistics };
```