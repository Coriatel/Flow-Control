# אפיון תפקודי - פריטי משלוח

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/DeliveryItem.json

---

# אפיון תפקודי - DeliveryItem Entity

## מטרה
פירוט של פריט בודד במשלוח - מה התקבל בפועל, באיזו כמות, ואיזו אצווה.

## תיאור למשתמש
כל פריט במשלוח מתועד בנפרד:
- 🧪 ריאגנט (reagent_name_snapshot)
- 🏷️ מספר אצווה (batch_number)
- 📅 תאריך תפוגה (expiry_date)
- 📦 כמות שהתקבלה (quantity_received)
- 💰 עלות ליחידה (unit_cost)
- 📝 הערות (notes)

## קישורים וסנפשוטים

### קישורים לישויות:
- **delivery_id**: לאיזה משלוח שייך
- **order_item_id**: לאיזה פריט הזמנה (אם רלוונטי)
- **reagent_id**: לאיזה ריאגנט
- **reagent_batch_id**: לאיזו אצווה נוצר/עודכן

### סנפשוטים (לתיעוד):
- **reagent_name_snapshot**: שם הריאגנט בזמן הקליטה
- **quantity_ordered_snapshot**: כמות שהוזמנה (מה-OrderItem)
- **quantity_remaining_snapshot**: יתרה לפני קליטה זו

## טיפול בחריגות מהזמנה

כשמשלוח לא תואם הזמנה בדיוק:

### discrepancy_resolution:
1. **receive_negative_balance**: קלוט גם אם חורג (יתרה שלילית בהזמנה)
2. **receive_remaining_only**: קלוט רק את היתרה
3. **reject_item**: דחה את הפריט

## החלפות

### is_replacement = true:
- **replaced_item_id**: מזהה הפריט המוחזר
- **replaced_item_name**: שם (לתיעוד)
- **replaced_batch_number**: אצווה מוחזרת
- **replaced_quantity**: כמות מוחזרת
- **replaced_expiry_date**: תפוגה של המוחזר

## פריטים לא מוזמנים

### delivery_reason (אם אין order_item_id):
- **no_charge**: מתנה/דוגמה
- **replacement**: החלפה
- **other**: אחר
- **delivery_reason_text**: הסבר טקסטואלי

## מקרי שימוש

### UC1: פריט רגיל מהזמנה
1. הוזמנו 50 Anti-A
2. הגיעו 50
3. DeliveryItem:
   - reagent_id = Anti-A
   - order_item_id = OI-123
   - quantity_received = 50
   - batch_number = ABC123
   - expiry_date = 2025-06-30
4. OrderItem.quantity_received += 50
5. OrderItem.quantity_remaining -= 50

### UC2: משלוח חלקי
1. הוזמנו 100
2. הגיעו 60
3. quantity_ordered_snapshot = 100
4. quantity_remaining_snapshot = 100
5. quantity_received = 60
6. discrepancy_resolution = 'receive_remaining_only'
7. OrderItem: received=60, remaining=40

### UC3: משלוח עודף
1. הוזמנו 50
2. הגיעו 70 (+20)
3. discrepancy_resolution = 'receive_negative_balance'
4. OrderItem: received=70, remaining=-20
5. יצירת alert למנהל

### UC4: החלפת פריט פגום
1. batch DEF456 היה פגום
2. הספק שלח החלפה
3. DeliveryItem:
   - is_replacement = true
   - replaced_item_id = old_item_id
   - replaced_batch_number = DEF456
   - quantity_received = 10 (החדש)
   - replaced_quantity = 10 (הישן)
4. ReagentBatch הישן → status='returned'
5. ReagentBatch חדש נוצר

### UC5: פריט ללא תמורה
1. BIORAD שלח דוגמאות
2. DeliveryItem:
   - delivery_reason = 'no_charge'
   - delivery_reason_text = "דוגמאות מוצר חדש XYZ"
   - אין order_item_id
3. נקלט ישירות למלאי