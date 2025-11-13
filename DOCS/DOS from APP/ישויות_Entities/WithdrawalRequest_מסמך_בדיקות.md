# מסמך בדיקות - בקשות משיכה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/WithdrawalRequest.json

---

# מסמך בדיקות - WithdrawalRequest

## T1: יצירה
**תוצאה**:
✅ withdrawal_number אוטומטי  
✅ status = 'draft'  
✅ snapshots מצילום  

---

## T2: מעברי סטטוס
**תוצאה**: ✅ draft→submitted→approved→in_delivery→completed

---

## T3: דחייה
**תוצאה**: ✅ status='rejected', rejection_reason מוגדר

---

## Checklist
- [ ] auto-numbering
- [ ] status flow
- [ ] urgency levels
- [ ] approval process
- [ ] soft delete
- [ ] delivery linkage