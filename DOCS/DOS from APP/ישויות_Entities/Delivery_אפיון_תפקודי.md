# אפיון תפקודי - משלוחים (תעודות קבלה)

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Delivery.json

---

# אפיון תפקודי - Delivery Entity

## מטרה
תיעוד תעודת משלוח שהתקבלה מספק - כולל פרטי המשלוח, הקשר להזמנה, וסטטוס עיבוד.

## תיאור למשתמש
כל משלוח שמגיע מספק מתועד:
- 📋 מספר תעודת משלוח (delivery_number)
- 🏢 ספק (supplier)
- 📅 תאריך קבלה (delivery_date)
- 🔗 קישור להזמנה (linked_order_id)
- 📦 סוג משלוח (with_order/no_charge/replacement)
- ✅ סטטוס עיבוד (open/processing/processed/closed)

## סוגי משלוחים

### 1. with_order (עם הזמנה)
- המשלוח קשור להזמנה ספציפית
- linked_order_id מוגדר
- הפריטים משוייכים ל-OrderItems
- quantity_remaining מתעדכן

### 2. no_charge (ללא תמורה)
- מתנה/דוגמה מהספק
- אין order_number
- delivery_reason_text מסביר למה
- הפריטים נוספים למלאי

### 3. replacement (החלפה)
- החלפת מוצר פגום/לא תקין
- הקישור למשלוח המקורי
- הפריטים מתועדים כהחלפות

### 4. other (אחר)
- סיבות אחרות
- delivery_reason_text מסביר

## תהליך עיבוד

### Status: open
- משלוח חדש שהתקבל
- טרם התחלנו לעבד
- נתונים ראשוניים בלבד

### Status: processing
- בתהליך קליטה
- מזינים פריטים
- יוצרים DeliveryItems

### Status: processed
- כל הפריטים נקלטו
- ReagentBatches נוצרו
- Reagents עודכנו
- OrderItems עודכנו (אם רלוונטי)

### Status: closed
- עיבוד הושלם
- נסגר לעריכה
- נשאר לתיעוד בלבד

## שדות מרכזיים

### פרטי משלוח:
- **delivery_number**: מספר תעודה ייחודי
- **supplier**: ELDAN/BIORAD/DYN/OTHER
- **delivery_date**: תאריך קבלה
- **order_number**: מספר הזמנה (אם רלוונטי)
- **linked_order_id**: מזהה ההזמנה

### סוג וסיבה:
- **delivery_type**: with_order/no_charge/replacement/other
- **delivery_reason_text**: הסבר טקסטואלי

### מעקב עיבוד:
- **status**: open/processing/processed/closed
- **completion_type**: full/partial
- **total_items_expected**: כמה פריטים צפויים
- **total_items_received**: כמה התקבלו בפועל

### דגלים:
- **has_non_order_items**: יש פריטים שלא קשורים להזמנה
- **has_replacements**: יש החלפות במשלוח

### מסמכים:
- **document_url**: תמונת/סריקת תעודת משלוח
- **notes**: הערות נוספות

### שדות חסרים:
- **incomplete_fields**: רשימת שדות שלא הושלמו
- **completion_notes**: הערות על השלמה

### היסטוריה:
- **edit_history**: מעקב אחר כל עריכה

### קישורים:
- **linked_withdrawal_request_ids**: בקשות משיכה שהמשלוח מילא

## מקרי שימוש

### UC1: קליטת משלוח רגיל
1. משלוח מגיע מ-BIORAD
2. יוצרים Delivery: type='with_order'
3. linked_order_id = O-2024-123
4. status = 'open'
5. מתחילים להזין פריטים → 'processing'
6. סיימנו → 'processed'
7. בדיקה סופית → 'closed'

### UC2: משלוח ללא תמורה
1. ELDAN שלח דוגמאות
2. Delivery: type='no_charge'
3. delivery_reason_text = "דוגמאות מוצר חדש"
4. הפריטים נקלטים ישירות למלאי
5. אין עדכון של Order

### UC3: משלוח עם החלפה
1. משלוח מגיע
2. 3 פריטים רגילים + 1 החלפה
3. has_replacements = true
4. DeliveryItem של ההחלפה:
   - is_replacement = true
   - replaced_item_id מוגדר