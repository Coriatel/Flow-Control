# מסמך בדיקות - תיקון שלמות נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/fixDataIntegrity.js

---

# מסמך בדיקות - fixDataIntegrity

## T1: Dry run
**תוצאה**: ✅ מזהה בעיות ללא תיקון

## T2: Fix orphans
**Setup**: 5 orphaned items
**תוצאה**: ✅ נמחקים

## T3: Fix summaries
**Setup**: reagent עם total לא נכון
**תוצאה**: ✅ מחושב מחדש

## T4: Fix negatives
**Setup**: batch עם quantity=-5
**תוצאה**: ✅ 0, transaction created

## Checklist
- [ ] orphans detection
- [ ] summaries correction
- [ ] negatives fix
- [ ] duplicates handling
- [ ] dry_run mode
- [ ] detailed report