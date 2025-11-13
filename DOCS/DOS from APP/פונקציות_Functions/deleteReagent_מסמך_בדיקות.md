# מסמך בדיקות - מחיקת ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/deleteReagent.js

---

# מסמך בדיקות - deleteReagent

## T1: מחיקה מותרת
**Setup**: אין אצוות/הזמנות
**תוצאה**: ✅ is_active=false

## T2: יש אצוות פעילות
**תוצאה**: ✅ שגיאה

## T3: יש הזמנות
**תוצאה**: ✅ שגיאה

## Checklist
- [ ] validation
- [ ] deactivation
- [ ] audit trail