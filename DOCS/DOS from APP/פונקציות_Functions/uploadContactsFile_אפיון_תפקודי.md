# אפיון תפקודי - ייבוא אנשי קשר מקובץ

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/uploadContactsFile.js

---

## מטרת הפונקציה

ייבוא אנשי קשר של ספקים מקובץ Excel - bulk import.

## תהליך

1. העלאת קובץ Excel/CSV
2. זיהוי עמודות אוטומטי
3. התאמה לספקים קיימים
4. יצירת SupplierContact records
5. דוח על הצלחות/כשלונות

## Structure

```csv
Supplier, Contact Name, Type, Phone, Email
BIORAD, John Smith, sales, 03-1234567, john@biorad.com
ELDAN, Jane Doe, service, 04-7654321, jane@eldan.co.il
```