# מסמך בדיקות - ארכון נתונים ישנים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/archiveOldData.js

---

# מסמך בדיקות - archiveOldData

## T1: ארכוב transactions ישנים
**Setup**: 100 transactions מ-2022
**תוצאה**: ✅ 100 archived

## T2: שמירת נתונים
**תוצאה**: ✅ JSON מלא נשמר

## T3: Retention policy
**תוצאה**: ✅ can_be_deleted_after מחושב

## Checklist
- [ ] זיהוי ישנים
- [ ] JSON serialization
- [ ] retention policy
- [ ] optional delete