# אפיון תפקודי - מנהל ההתראות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/alertsManager.js

---

## מטרת הפונקציה

ניהול מצב ההתראות - acknowledge, resolve, snooze, escalate.

## פעולות

1. **Acknowledge**: אישור קריאת התראה
2. **Resolve**: פתרון ההתראה
3. **Snooze**: השתקה זמנית
4. **Escalate**: העלאת עדיפות
5. **Bulk Actions**: פעולות על כמה התראות

## תהליך Resolve

```javascript
await ActiveAlert.update(alert_id, {
  status: 'resolved',
  resolved_by: user.email,
  resolved_at: new Date(),
  action_taken: action_description
});
```