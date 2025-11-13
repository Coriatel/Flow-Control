# מסמך בדיקות - טעינת נתוני עריכת הזמנה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getEditOrderData.js

---

# מסמך בדיקות - getEditOrderData

## T1: הזמנה רגילה עם משלוחים
**תוצאה**: ✅ deliveries linked

## T2: מסגרת עם משיכות
**תוצאה**: ✅ withdrawals linked

## T3: הרשאות עריכה
**תוצאה**: ✅ can_edit נכון לפי status

## Checklist
- [ ] order loaded
- [ ] items enriched
- [ ] deliveries linked
- [ ] withdrawals linked
- [ ] permissions