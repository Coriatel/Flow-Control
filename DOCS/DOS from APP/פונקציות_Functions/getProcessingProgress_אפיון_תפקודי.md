# אפיון תפקודי - מעקב התקדמות עיבוד

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getProcessingProgress.js

---

## מטרת הפונקציה

מעקב אחר התקדמות עיבוד ספירת מלאי - real-time progress tracking. כשלוחצים "סיים ספירה" והמערכת מעבדת מאות אצוות, המשתמש רואה: "עיבוד 120/450 אצוות (26%)".

## תרחישי שימוש

1. **During Count Processing**: עדכון progress bar
2. **Batch Updates**: כל אצווה מעודכנת - +1 למונה
3. **Error Tracking**: אם יש שגיאה - מציג איזה פריט נכשל
4. **Completion**: "הושלם! 450/450 אצוות עודכנו"

## ממשק

```javascript
const { progress, total, current, errors } = await getProcessingProgress({
  process_id: "count_123"
});
```