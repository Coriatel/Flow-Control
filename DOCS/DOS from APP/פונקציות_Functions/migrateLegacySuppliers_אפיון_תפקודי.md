# אפיון תפקודי - העברת ספקים ישנים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/migrateLegacySuppliers.js

---

## מטרת הפונקציה

מיגרציה חד-פעמית - העברת ספקים מ-enum ל-Supplier entity.

## Before Migration
```json
{
  "supplier": "BIORAD",  // enum value
  "current_supplier_id": null
}
```

## After Migration
```json
{
  "supplier": "BIORAD",
  "current_supplier_id": "sup_123"  // link to Supplier entity
}
```