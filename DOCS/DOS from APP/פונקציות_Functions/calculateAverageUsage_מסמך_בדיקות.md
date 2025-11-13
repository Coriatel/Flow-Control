# מסמך בדיקות - חישוב צריכה חודשית ממוצעת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/calculateAverageUsage.js

---

# מסמך בדיקות - calculateAverageUsage

## T1: חישוב רגיל
**Setup**: 120 יח' ב-6 חודשים
**תוצאה**: ✅ avg = 20

## T2: ריאגנט חדש (אין transactions)
**תוצאה**: ✅ avg = 0

## T3: שימוש חריג (spike)
**תוצאה**: ✅ outlier filtering

## Checklist
- [ ] חישוב נכון
- [ ] סינון withdrawals
- [ ] עדכון reagent