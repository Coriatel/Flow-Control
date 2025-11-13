# מסמך בדיקות - עריכת אצווה - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getEditReagentBatchData.js

---

# מסמך בדיקות - getEditReagentBatchData

## T1: אצווה עם COA
**תוצאה**: ✅ coa_status.has_coa = true

## T2: אצווה בהסגר
**תוצאה**: ✅ can_change_expiry = true

## T3: אצווה נצרכה
**תוצאה**: ✅ can_change_quantity = false

## Checklist
- [ ] batch נטען
- [ ] reagent context
- [ ] COA status
- [ ] QC status
- [ ] permissions