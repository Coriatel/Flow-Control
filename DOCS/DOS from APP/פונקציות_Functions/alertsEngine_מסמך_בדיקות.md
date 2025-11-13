# מסמך בדיקות - מנוע התראות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/alertsEngine.js

---

# מסמך בדיקות - alertsEngine

## T1: יצירת התראה
**Setup**: ריאגנט פג מחר
**תוצאה**: ✅ ActiveAlert created

## T2: Auto-resolve
**Setup**: הפריט תוקן
**תוצאה**: ✅ alert resolved

## T3: מניעת duplicates
**תוצאה**: ✅ לא יוצר פעמיים

## Checklist
- [ ] rule checking
- [ ] alert creation
- [ ] auto-resolve
- [ ] notifications