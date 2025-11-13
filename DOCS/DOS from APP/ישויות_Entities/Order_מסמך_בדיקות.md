# מסמך בדיקות - הזמנות/דרישות רכש

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Order.json

---

# מסמך בדיקות - Order Entity

## T1: יצירת הזמנה
**תוצאה**:
✅ order_number_temp אוטומטי  
✅ status = 'pending_sap_details'  
✅ supplier_name_snapshot מצילום  

---

## T2: מעבר בסטטוסים
**צעדים**:
1. Add permanent → pending_sap_po_number
2. Add PO → approved
3. Receive delivery → partially_received
4. All received → fully_received
5. Close → closed

**תוצאה**: ✅ כל המעברים

---

## T3: הזמנת מסגרת
**Setup**: type='framework'

**תוצאה**:
✅ withdrawals מקושרים  
✅ deliveries מקושרים  
✅ מעקב נפרד  

---

## T4: Soft delete
**צעדים**:
1. Delete order

**תוצאה**:
✅ is_deleted = true  
✅ הרשומה קיימת  
✅ לא מוצגת ברשימות  

---

## Checklist
- [ ] auto-numbering
- [ ] status flow
- [ ] SAP integration
- [ ] order types
- [ ] linkages
- [ ] soft delete
- [ ] edit history