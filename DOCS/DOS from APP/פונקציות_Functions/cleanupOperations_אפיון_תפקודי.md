# אפיון תפקודי - ניקוי ותחזוקה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/cleanupOperations.js

---

## מטרת הפונקציה

ניקוי אוטומטי של המערכת - מחיקת orphaned records, cleanup של temporary data, ניקוי cache, reset של counters.

## תרחישי שימוש

1. **Scheduled Cleanup**: runs daily at 2 AM
2. **Manual Trigger**: admin runs cleanup
3. **Post-Migration**: cleanup after data import
4. **Performance**: cleanup when system slow

## פעולות ניקוי

- Orphaned DeliveryItems (no parent Delivery)
- Orphaned OrderItems (no parent Order)
- Old draft data (> 30 days)
- Expired sessions
- Temporary files