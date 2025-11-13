# אפיון תפקודי - הזמנות/דרישות רכש

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Order.json

---

# אפיון תפקודי - Order Entity

## מטרה
ניהול הזמנות ודרישות רכש - מעקב אחר מה הוזמן, מה התקבל, ומה נותר.

## תיאור למשתמש
כל הזמנה/דרישת רכש:
- 📋 מספר דרישה זמני (order_number_temp) - מהמערכת
- 🏢 מספר דרישה קבוע (order_number_permanent) - מ-SAP
- 🛒 מספר הזמנה סופי (purchase_order_number_sap) - מ-SAP
- 📅 תאריך יצירה (order_date)
- 🏭 ספק (supplier_name_snapshot)
- ✅ סטטוס (pending_sap_details/approved/partially_received/fully_received)
- 📦 סוג (immediate_delivery/framework)

## מספור הזמנות (3 שלבים)

### שלב 1: order_number_temp
- נוצר אוטומטית במערכת: O-YYYY-XXX
- משמש מיד ליצירת ההזמנה
- קבוע ולא משתנה

### שלב 2: order_number_permanent
- מתקבל מ-SAP אחרי אישור
- מספר הדרישה הרשמי
- status: pending_sap_details → pending_sap_po_number

### שלב 3: purchase_order_number_sap
- מספר ההזמנה הסופי מ-SAP
- מגיע כשהדרישה הופכת להזמנה
- status: pending_sap_po_number → approved

## סוגי הזמנות

### immediate_delivery (אספקה מיידית)
- הזמנה חד-פעמית
- כל הפריטים צריכים להגיע יחד
- כשהכל מגיע → fully_received

### framework (מסגרת)
- הזמנת מסגרת לשנה
- משיכות חלקיות לפי צורך (WithdrawalRequest)
- עוקבים אחרי מה נמשך ומה נשאר
- סוגרים רק כשהמסגרת נגמרת או מבוטלת

## סטטוסים

### pending_sap_details
- נוצרה במערכת
- ממתינה לפרטי SAP (permanent + PO)
- ניתן לערוך פריטים

### pending_sap_permanent_id
- יש רק מספר קבוע
- ממתינה למספר PO
- ניתן לערוך פרטים

### pending_sap_po_number
- יש permanent, חסר PO
- ממתינה להזמנה סופית

### approved
- כל הפרטים הושלמו
- ההזמנה אושרה
- ממתינה למשלוח

### partially_received
- חלק מהפריטים הגיעו
- עדיין מחכים לשאר

### fully_received
- כל הפריטים הגיעו
- ניתן לסגור

### closed
- ההזמנה סגורה
- לא ניתן לערוך
- נשארת לתיעוד

### cancelled
- ההזמנה בוטלה
- לא מצפים למשלוחים

## שדות מרכזיים

### מספור:
- **order_number_temp**: O-YYYY-XXX (אוטומטי)
- **order_number_permanent**: מ-SAP
- **purchase_order_number_sap**: PO מ-SAP

### פרטים:
- **supplier_name_snapshot**: שם ספק (צילום)
- **order_date**: תאריך יצירה
- **order_type**: immediate_delivery/framework
- **expected_delivery_start_date**: אספקה צפויה (תחילת טווח)
- **expected_delivery_end_date**: אספקה צפויה (סוף טווח)

### מעקב:
- **total_value**: שווי כולל
- **notes**: הערות
- **is_deleted**: מחיקה רכה
- **edit_history**: היסטוריית עריכות

### קישורים:
- **linked_withdrawal_request_ids**: משיכות ממסגרת זו
- **linked_delivery_ids**: משלוחים שהתקבלו

## מקרי שימוש

### UC1: יצירת דרישת רכש
1. בוחרים ספק: BIORAD
2. מוסיפים 5 פריטים
3. Order נוצר: status='pending_sap_details'
4. order_number_temp = O-2024-123
5. שולחים ל-SAP

### UC2: קבלת פרטי SAP
1. SAP מחזיר: permanent=45678, PO=PO-91011
2. מעדכנים את ההזמנה
3. status → 'approved'
4. ממתינים למשלוח

### UC3: קבלת משלוח חלקי
1. הוזמנו 5 פריטים
2. הגיעו 3
3. Delivery נוצר ומקושר
4. OrderItems של 3 הפריטים מתעדכנים
5. Order.status → 'partially_received'
6. linked_delivery_ids += delivery.id

### UC4: השלמת הזמנה
1. הגיע המשלוח האחרון
2. כל OrderItems: quantity_remaining=0
3. Order.status → 'fully_received'
4. ניתן לסגור

### UC5: הזמנת מסגרת + משיכות
1. Order: type='framework'
2. יוצרים WithdrawalRequest
3. withdrawal מאושר
4. Delivery מגיע
5. Order.linked_withdrawal_request_ids += withdrawal.id
6. Order.linked_delivery_ids += delivery.id
7. מעקב: כמה נמשך מתוך המסגרת