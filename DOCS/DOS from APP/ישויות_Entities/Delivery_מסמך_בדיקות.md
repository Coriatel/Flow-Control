# מסמך בדיקות - משלוחים (תעודות קבלה)

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Delivery.json

---

# מסמך בדיקות - Delivery Entity

## T1: יצירת משלוח עם הזמנה
**צעדים**:
1. Create Delivery: type='with_order'
2. linked_order_id = existing_order

**תוצאה**:
✅ נוצר  
✅ status = 'open'  
✅ קישור תקף  

---

## T2: עיבוד משלוח מלא
**Setup**: Delivery + 3 DeliveryItems

**צעדים**:
1. processDelivery()

**תוצאה**:
✅ 3 ReagentBatches נוצרו  
✅ OrderItems עודכנו  
✅ Reagents עודכנו  
✅ status = 'processed'  

---

## T3: משלוח חלקי
**Setup**: הוזמנו 5, הגיעו 3

**תוצאה**:
✅ completion_type = 'partial'  
✅ total_items_received = 3  
✅ OrderItem.quantity_remaining = 2  

---

## T4: משלוח ללא תמורה
**Setup**: type='no_charge'

**תוצאה**:
✅ אין linked_order  
✅ delivery_reason_text מוגדר  
✅ הפריטים נקלטים  

---

## T5: משלוח עם החלפות
**Setup**: 2 רגילים + 1 החלפה

**תוצאה**:
✅ has_replacements = true  
✅ DeliveryItem.is_replacement = true  
✅ replaced_item_id מוגדר  

---

## Checklist
- [ ] כל סוגי משלוחים
- [ ] status transitions
- [ ] processing logic
- [ ] Order updates
- [ ] Reagent updates
- [ ] edit history
- [ ] incomplete fields tracking