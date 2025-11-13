# אפיון תפקודי - שינוי ספק ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/changeReagentSupplier.js

---

# אפיון תפקודי - changeReagentSupplier

## מטרה
שינוי ספק ריאגנט עם שמירת היסטוריה מלאה.

## תהליך
1. שמירת הספק הנוכחי ל-historical_suppliers
2. עדכון current_supplier_id
3. תיעוד: מתי, למה, מי

## היסטוריה
```json
{
  "historical_suppliers": [
    {
      "supplier_id": "sup1",
      "supplier_name": "BIORAD",
      "from_date": "2020-01-01",
      "to_date": "2024-06-30",
      "change_reason": "מחיר גבוה"
    },
    {
      "supplier_id": "sup2",
      "supplier_name": "ELDAN",
      "from_date": "2024-07-01",
      "to_date": "2024-11-10",
      "change_reason": "זמינות"
    }
  ],
  "current_supplier_id": "sup3",
  "supplier": "DYN"
}
```