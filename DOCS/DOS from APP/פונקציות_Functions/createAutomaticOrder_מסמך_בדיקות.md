# מסמך בדיקות - יצירת הזמנה אוטומטית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/createAutomaticOrder.js

---

# מסמך בדיקות - createAutomaticOrder

## T1: יצירה מהמלצות
**Setup**: 10 recommendations, 3 suppliers
**תוצאה**: ✅ 3 orders created

## T2: פריטים נכונים
**תוצאה**: ✅ OrderItems עם quantities נכונות

## Checklist
- [ ] orders created
- [ ] items created
- [ ] grouped by supplier
- [ ] justifications saved