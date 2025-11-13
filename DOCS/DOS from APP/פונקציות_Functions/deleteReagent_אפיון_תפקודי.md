# אפיון תפקודי - מחיקת ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/deleteReagent.js

---

# אפיון תפקודי - deleteReagent

## מטרה
מחיקה בטוחה של ריאגנט - deactivation במקום deletion.

## Validation
⚠️ **אסור למחוק אם יש**:
- אצוות פעילות
- הזמנות פתוחות
- משיכות פעילות
- משלוחים

✅ **מותר למחוק אם**:
- אין אצוות (או הכל expired/consumed)
- אין הזמנות פתוחות
- אין משיכות פעילות

## תוצאה
- is_active = false
- deactivation_date = today
- deactivation_reason = "deleted_by_user"