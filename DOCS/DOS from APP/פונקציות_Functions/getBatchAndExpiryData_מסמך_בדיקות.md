# מסמך בדיקות - ניהול אצוות ופגי תוקף - טעינת נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getBatchAndExpiryData.js

---

# מסמך בדיקות - getBatchAndExpiryData

## T1: אצווה פגה היום
**תוצאה**: ✅ priority='critical', suggested='dispose'

## T2: אצווה פגה בשבוע
**תוצאה**: ✅ priority='high'

## T3: אצווה ישנה
**תוצאה**: ✅ מופיעה ב-old_batches

## T4: אצווה שטופלה
**תוצאה**: ✅ לא מופיעה (יש ExpiredProductLog)

## Checklist
- [ ] זיהוי פגים
- [ ] FIFO tracking
- [ ] handled filtering
- [ ] סטטיסטיקות
- [ ] המלצות