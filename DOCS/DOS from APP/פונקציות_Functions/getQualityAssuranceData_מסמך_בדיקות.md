# מסמך בדיקות - בקרת איכות - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getQualityAssuranceData.js

---

# מסמך בדיקות - getQualityAssuranceData

## T1: אצווה בהסגר
**תוצאה**: ✅ days_in_quarantine מחושב

## T2: אצווה חסרת COA
**תוצאה**: ✅ action_required=['upload_coa']

## T3: QC passed
**תוצאה**: ✅ מופיע בסטטיסטיקה

## Checklist
- [ ] batches enriched
- [ ] COA tracking
- [ ] QC status
- [ ] action items
- [ ] statistics