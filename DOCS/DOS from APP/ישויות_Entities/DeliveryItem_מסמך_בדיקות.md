# מסמך בדיקות - פריטי משלוח

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/DeliveryItem.json

---

# מסמך בדיקות - DeliveryItem Entity

## T1: פריט רגיל
**צעדים**:
1. Create DeliveryItem מלא

**תוצאה**:
✅ נוצר  
✅ כל השדות הנדרשים  
✅ קישורים תקפים  

---

## T2: עדכון OrderItem
**Setup**: פריט עם order_item_id

**תוצאה**:
✅ OrderItem.quantity_received מעודכן  
✅ quantity_remaining מעודכן  
✅ line_status מעודכן  

---

## T3: יצירת ReagentBatch
**צעדים**:
1. processDelivery()

**תוצאה**:
✅ ReagentBatch נוצר  
✅ reagent_batch_id מעודכן  
✅ Reagent.total מעודכן  

---

## T4: discrepancy handling
**Setup**: הוזמנו 50, הגיעו 70

**תוצאה**:
✅ אם receive_negative_balance → remaining=-20  
✅ אם receive_remaining_only → reject 20  
✅ אם reject_item → לא נקלט  

---

## T5: החלפה
**Setup**: is_replacement=true

**תוצאה**:
✅ replaced_* fields מוגדרים  
✅ batch ישן marked 'returned'  
✅ batch חדש 'incoming'  

---

## Checklist
- [ ] linkages
- [ ] snapshots
- [ ] discrepancy resolution
- [ ] replacements
- [ ] no_charge items
- [ ] batch creation
- [ ] order updates