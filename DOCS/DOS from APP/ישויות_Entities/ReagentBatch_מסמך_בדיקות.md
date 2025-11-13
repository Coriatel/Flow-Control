# מסמך בדיקות - אצוות ריאגנטים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/ReagentBatch.json

---

# מסמך בדיקות - ReagentBatch

## T1: יצירת אצווה
**Setup**: Reagent קיים

**תוצאה**:
✅ Batch נוצר  
✅ current_quantity = initial_quantity  
✅ status = 'incoming' (default)  

---

## T2: העלאת COA
**Setup**: batch ב-qc_pending

**תוצאה**:
✅ coa_document_url מעודכן  
✅ coa_uploaded_by = user  
✅ status → 'active'  

---

## T3: משיכת כמות
**Setup**: batch עם 50 יח'

**צעדים**:
1. משוך 10 יח'

**תוצאה**:
✅ current_quantity = 40  
✅ usage_log[] += entry  
✅ last_use_date = today  

---

## T4: אצווה פגה
**Setup**: expiry_date < today

**תוצאה**:
✅ status = 'expired'  
✅ לא זמין למשיכה  

---

## T5: אצווה נצרכה
**Setup**: current_quantity = 0

**תוצאה**:
✅ status = 'consumed'  

---

## Checklist
- [ ] create
- [ ] update quantity
- [ ] COA upload
- [ ] QC flow
- [ ] usage log
- [ ] status transitions
- [ ] expiry detection