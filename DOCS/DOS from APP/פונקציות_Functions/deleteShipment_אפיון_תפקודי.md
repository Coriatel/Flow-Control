# אפיון תפקודי - למחיקת משלוח יוצא

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/deleteShipment.js

---

# אפיון תפקודי - deleteShipment

## מטרה
מחיקת משלוח יוצא עם החזרת המלאי.

## ⚠️ קריטי!
אם המשלוח כבר אושר/הוספק - **אסור למחוק**!
צריך להחזיר את הכמויות לאצוות.

## תהליך
1. Validation: status ≠ confirmed/delivered
2. החזרת כמויות ל-ReagentBatches
3. יצירת InventoryTransaction (shipment_cancellation)
4. Soft delete: is_deleted = true
5. עדכון Reagent summaries

## דוגמה
```
משלוח:
- Anti-A, batch ABC123: 10 יח' נשלחו

ביטול:
- ReagentBatch ABC123: +10 יח' (החזרה)
- InventoryTransaction: +10, type='shipment_cancellation'
```