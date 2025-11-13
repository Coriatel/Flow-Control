# מסמך בדיקות - משלוחים יוצאים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Shipment.json

---

# מסמך בדיקות - Shipment

## T1: יצירה
**תוצאה**: ✅ shipment_number אוטומטי, status='draft'

## T2: מעברי סטטוס
**תוצאה**: ✅ draft→prepared→sent→delivered→confirmed

## T3: ביטול
**תוצאה**: ✅ status='cancelled', פריטים חוזרים

## Checklist
- [ ] types
- [ ] status flow
- [ ] confirmations
- [ ] inventory updates