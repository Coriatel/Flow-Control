# מסמך בדיקות - פריטי משיכה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/WithdrawalItem.json

---

# מסמך בדיקות - WithdrawalItem

## T1: יצירה
**תוצאה**: ✅ כל השדות, line_status='pending'

## T2: אישור
**תוצאה**: ✅ quantity_approved מוגדר, status='approved'

## T3: אישור חלקי
**Setup**: ביקשתי 100, אושרו 60
**תוצאה**: ✅ approved=60, notes מסביר

## Checklist
- [ ] quantities
- [ ] approval
- [ ] justification
- [ ] pricing