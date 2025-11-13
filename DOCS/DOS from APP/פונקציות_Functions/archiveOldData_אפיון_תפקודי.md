# אפיון תפקודי - ארכון נתונים ישנים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/archiveOldData.js

---

# אפיון תפקודי - archiveOldData

## מטרה
ארכוב נתונים ישנים - העברת נתונים מ-2+ שנים ל-ArchivedData.

## תהליך
1. זיהוי נתונים ישנים (> 2 שנים)
2. שמירת JSON מלא ב-ArchivedData
3. מחיקה מהטבלה הפעילה (אופציונלי)
4. Retention policy: 7 שנים

## מה מתארכב?
- CompletedInventoryCount (> 2 שנים)
- InventoryTransaction (> 2 שנים)
- Closed Orders (> 1 שנה)
- Closed Deliveries (> 1 שנה)