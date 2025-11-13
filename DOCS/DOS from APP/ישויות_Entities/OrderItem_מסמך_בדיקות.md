# מסמך בדיקות - פריטי הזמנה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/OrderItem.json

---

# מסמך בדיקות - OrderItem Entity

## T1: יצירה
**תוצאה**:
✅ quantity_remaining = quantity_ordered  
✅ line_status = 'open'  

---

## T2: קבלה חלקית
**Setup**: ordered=100

**צעדים**:
1. Receive 60

**תוצאה**:
✅ received = 60  
✅ remaining = 40  
✅ status = 'partially_received'  

---

## T3: קבלה מלאה
**צעדים**:
1. Receive remaining 40

**תוצאה**:
✅ received = 100  
✅ remaining = 0  
✅ status = 'fully_received'  

---

## T4: עודף
**צעדים**:
1. Receive 120 (עודף 20)

**תוצאה**:
✅ remaining = -20  
✅ status = 'fully_received'  
✅ alert created  

---

## Checklist
- [ ] quantity calculations
- [ ] status transitions
- [ ] snapshots
- [ ] linkages