# מסמך בדיקות - ריאגנט - ישות ראשית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Reagent.json

---

# מסמך בדיקות - Reagent Entity

## T1: יצירת ריאגנט חדש
**Setup**: קטלוג קיים + ספק קיים

**צעדים**:
1. Create Reagent: { catalog_item_id, name: "Anti-A", category: "reagents", current_supplier_id, catalog_number: "12345" }

**תוצאה**:
✅ Reagent נוצר  
✅ total_quantity_all_batches = 0 (default)  
✅ active_batches_count = 0  
✅ current_stock_status = 'out_of_stock'  

---

## T2: עדכון אחרי קליטת אצווה
**Setup**: Reagent קיים + batch חדש (50 יח')

**צעדים**:
1. Create ReagentBatch: { reagent_id, current_quantity: 50, status: 'active' }
2. Run: runSummaryUpdates(reagent_id)

**תוצאה**:
✅ total_quantity_all_batches = 50  
✅ active_batches_count = 1  
✅ current_stock_status ≠ 'out_of_stock'  

---

## T3: חישוב חודשי מלאי
**Setup**: 
- total_quantity = 100
- average_monthly_usage = 25

**צעדים**:
1. Run: runSummaryUpdates(reagent_id)

**תוצאה**:
✅ months_of_stock = 4 (100/25)  
✅ current_stock_status = 'in_stock' (>2 months)  

---

## T4: מלאי נמוך
**Setup**:
- total_quantity = 30
- average_monthly_usage = 20

**צעדים**:
1. Run: runSummaryUpdates(reagent_id)

**תוצאה**:
✅ months_of_stock = 1.5  
✅ current_stock_status = 'low_stock' (<2 months)  

---

## T5: שימוש בצריכה ידנית
**Setup**:
- average_monthly_usage = 10 (מחושב)
- manual_monthly_usage = 25
- use_manual_usage = true

**תוצאה**:
✅ months_of_stock מחושב לפי 25 (ידני)  
✅ לא לפי 10 (אוטומטי)  

---

## T6: תאריך תפוגה קרוב
**Setup**: 3 batches עם תפוגות: 01/01/2025, 15/01/2025, 30/01/2025

**תוצאה**:
✅ nearest_expiry_date = 01/01/2025  

---

## T7: שינוי ספק
**Setup**: supplier_id משתנה מ-ELDAN ל-BIORAD

**צעדים**:
1. Update Reagent: { current_supplier_id: biorad_id }
2. Add to historical_suppliers

**תוצאה**:
✅ current_supplier_id = biorad_id  
✅ historical_suppliers[] מכיל ELDAN + תאריכים  

---

## Checklist
- [ ] יצירה
- [ ] עדכון summaries
- [ ] חישוב months_of_stock
- [ ] stock_status logic
- [ ] nearest_expiry
- [ ] צריכה ידנית vs אוטומטית
- [ ] historical suppliers