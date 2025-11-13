# אפיון תפקודי - ייבוא ספירת מלאי מקובץ

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/importInventoryCount.js

---

## מטרת הפונקציה

ייבוא ספירת מלאי מקובץ Excel/CSV - במקום להזין ידנית 500 אצוות.

## תהליך

1. משתמש מעלה קובץ Excel
2. הפונקציה מזהה עמודות (reagent_name, batch_number, quantity)
3. מתאימה לריאגנטים קיימים
4. יוצרת/מעדכנת draft
5. מדווחת על שגיאות (שורות שלא זוהו)

## Structure

```csv
Reagent Name, Batch Number, Quantity, Expiry Date
Anti-A, ABC123, 12, 2025-06-15
Anti-B, DEF456, 8, 2025-03-20
```