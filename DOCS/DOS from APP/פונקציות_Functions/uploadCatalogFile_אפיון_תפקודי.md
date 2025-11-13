# אפיון תפקודי - ייבוא קטלוג מקובץ

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/uploadCatalogFile.js

---

## מטרת הפונקציה

ייבוא קטלוג ריאגנטים מקובץ Excel - bulk import של ReagentCatalog.

## תהליך

1. העלאת קובץ קטלוג (Excel/CSV)
2. זיהוי עמודות
3. Validation (catalog_number unique)
4. יצירת ReagentCatalog records
5. דוח מפורט

## Structure

```csv
Name, Catalog Number, Supplier, Category, Unit
Anti-A, 123456, BIORAD, reagents, ml
Anti-B, 789012, BIORAD, reagents, ml
```