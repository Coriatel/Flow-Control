# אפיון תפקודי - ריאגנט - ישות ראשית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Reagent.json

---

# אפיון תפקודי - Reagent Entity

## מטרה
ישות מרכזית המייצגת ריאגנט בודד במערכת - מאגד את כל המידע על הריאגנט מכל האצוות.

## תיאור למשתמש
כל ריאגנט במערכת (Anti-A, Anti-B, Screening Cells וכו') מיוצג בישות Reagent:
- 🆔 מזהה ייחודי
- 🏷️ שם הריאגנט
- 🏢 ספק נוכחי
- 📦 קטגוריה (reagents/cells/controls/solutions/consumables)
- 🔗 קישור לקטלוג (catalog_item_id)
- 📊 **שדות מחושבים אוטומטית**:
  - total_quantity_all_batches - סך כל הכמות מכל האצוות הפעילות
  - active_batches_count - מספר אצוות פעילות
  - nearest_expiry_date - תאריך תפוגה קרוב ביותר
  - current_stock_status - סטטוס מלאי (in_stock/low_stock/out_of_stock)
  - months_of_stock - חודשי מלאי נותרים

## מקרי שימוש

### UC1: יצירת ריאגנט חדש
1. מנהל מוסיף ריאגנט חדש לקטלוג
2. בוחר קטגוריה + ספק
3. מקשר ל-catalog_item_id
4. הריאגנט נוצר עם total_quantity=0 (עדיין אין אצוות)

### UC2: עדכון אוטומטי אחרי קליטת משלוח
1. נקלט משלוח עם 50 יח' Anti-A, batch ABC123
2. המערכת יוצרת/מעדכנת ReagentBatch
3. **אוטומטית** מעדכנת Reagent:
   - total_quantity_all_batches += 50
   - active_batches_count++
   - nearest_expiry_date = min(כל האצוות)
4. מחשבת months_of_stock לפי average_monthly_usage

### UC3: עדכון אוטומטי אחרי ספירת מלאי
1. ספירה: Anti-A נספר ב-45 יח' (היה 50)
2. המערכת מעדכנת את ה-batch
3. **אוטומטית** מעדכנת Reagent.total_quantity_all_batches = 45

## כללי עסקיים

### שדות חובה:
- catalog_item_id (קישור לקטלוג)
- name (שם הריאגנט)
- category (קטגוריה)
- current_supplier_id (ספק נוכחי)
- catalog_number (מק"ט)

### שדות מחושבים (אוטומטיים):
- total_quantity_all_batches - מעודכן ע"י runSummaryUpdates
- active_batches_count - ספירת batches עם status='active'
- nearest_expiry_date - MIN(expiry_date) מכל ה-batches
- months_of_stock = total_quantity / average_monthly_usage
- current_stock_status:
  - out_of_stock: total_quantity = 0
  - low_stock: months_of_stock < 2
  - in_stock: months_of_stock >= 2

### ניהול צריכה:
- average_monthly_usage - מחושב מ-InventoryTransactions (12 חודשים אחרונים)
- manual_monthly_usage - ערך ידני (override)
- use_manual_usage - האם להשתמש בערך הידני

### היסטוריית ספקים:
- historical_suppliers[] - מעקב אחרי שינויי ספקים
- כל שינוי נרשם עם from_date + to_date