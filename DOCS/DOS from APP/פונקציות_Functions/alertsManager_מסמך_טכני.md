# מסמך טכני - מנהל ההתראות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/alertsManager.js

---

## Implementation

```javascript
async function alertsManager({ action, alert_ids, data }) {
  switch (action) {
    case 'acknowledge':
      for (const id of alert_ids) {
        await ActiveAlert.update(id, {
          status: 'acknowledged',
          acknowledged_by: user.email,
          acknowledged_at: new Date()
        });
      }
      break;
    
    case 'resolve':
      for (const id of alert_ids) {
        await ActiveAlert.update(id, {
          status: 'resolved',
          resolved_by: user.email,
          resolved_at: new Date(),
          action_taken: data.action_taken
        });
      }
      break;
    
    case 'snooze':
      for (const id of alert_ids) {
        await ActiveAlert.update(id, {
          status: 'snoozed',
          snoozed_until: addHours(new Date(), data.hours)
        });
      }
      break;
  }
  
  return { success: true, updated: alert_ids.length };
}
```