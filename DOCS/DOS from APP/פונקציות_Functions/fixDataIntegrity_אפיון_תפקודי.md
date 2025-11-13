# אפיון תפקודי - תיקון שלמות נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/fixDataIntegrity.js

---

# אפיון תפקודי - fixDataIntegrity

## מטרה
תיקון אי-עקביות בנתונים - orphaned records, missing links, incorrect summaries.

## תיאור למשתמש
כשיש בעיות במערכת (למשל אחרי import או תקלה), לחץ "תקן שלמות נתונים" והמערכת:
- 🔍 בודקת כל אי-עקביות
- 🔗 מקשרת orphaned records
- 📊 מתקנת summaries שגויים
- 🗑️ מנקה duplicates
- 📋 מדווחת מה תוקן

## מה נבדק ומתוקן?

### 1. Orphaned DeliveryItems
- DeliveryItem ללא Delivery
- פתרון: מחיקה או קישור

### 2. Incorrect Summaries
- Reagent.total_quantity ≠ SUM(batches)
- פתרון: חישוב מחדש

### 3. Missing Links
- Order ללא OrderItems
- פתרון: סימון או מחיקה

### 4. Duplicate Batches
- אותו batch_number פעמיים
- פתרון: merge או mark

### 5. Negative Quantities
- batch.current_quantity < 0
- פתרון: set to 0 + create correction transaction

## דוח תיקון

```
תיקון שלמות נתונים - 10/11/2024

✅ 5 DeliveryItems orphaned → deleted
✅ 12 Reagent summaries → recalculated
✅ 3 negative quantities → corrected to 0
✅ 2 duplicate batches → merged
⚠️ 1 Order without items → flagged for review

סה"כ: 23 תיקונים
```