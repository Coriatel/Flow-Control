# אפיון תפקודי - בקשות משיכה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/WithdrawalRequest.json

---

# אפיון תפקודי - WithdrawalRequest

## מטרה
בקשת משיכה מהזמנת מסגרת - מאפשרת למשוך פריטים בכמויות חלקיות ממסגרת שנתית.

## תיאור
כשיש הזמנת מסגרת עם BIORAD:
- 📋 מספר משיכה (withdrawal_number)
- 🛒 מספר מסגרת (framework_order_number_snapshot)
- 🏢 ספק (supplier_snapshot)
- 📅 תאריך בקשה (request_date)
- 🛑 תאריך אספקה מבוקש (requested_delivery_date)
- ⚡ דחיפות (routine/urgent/emergency)
- ✅ סטטוס (draft/submitted/approved/in_delivery/completed)

## תהליך משיכה

### 1. draft
- בקשה חדשה בהכנה
- ניתן לערוך הכל
- טרם הוגשה

### 2. submitted
- הוגשה לאישור
- ממתינה למנהל
- לא ניתן לערוך

### 3. approved
- אושרה על ידי מנהל
- נשלחת לספק
- ממתינים למשלוח

### 4. rejected
- נדחתה
- rejection_reason מוגדר
- ניתן לערוך ולהגיש שוב

### 5. in_delivery
- הספק שלח
- בדרך
- ממתינים לקבלה

### 6. completed
- המשלוח התקבל
- Delivery נוצר ומקושר
- המשיכה מולאה
- Order.linked_withdrawal_request_ids += withdrawal.id
- Order.linked_delivery_ids += delivery.id

### 7. cancelled
- בוטלה
- deletion_reason מוגדר

## שדות מרכזיים

### זיהוי:
- **withdrawal_number**: W-YYYY-XXX (אוטומטי)
- **framework_order_id**: מזהה המסגרת
- **framework_order_number_snapshot**: מספר המסגרת (צילום)
- **supplier_snapshot**: שם הספק (צילום)

### תאריכים:
- **request_date**: מתי הוגשה
- **requested_delivery_date**: אספקה מבוקשת
- **expected_completion_date**: השלמה צפויה
- **actual_completion_date**: השלמה בפועל

### דחיפות:
- **urgency_level**: routine/urgent/emergency
- routine: 7-14 ימים
- urgent: 3-5 ימים
- emergency: 1-2 ימים

### שווי:
- **total_requested_value**: שווי מבוקש
- **approved_value**: שווי מאושר (יכול להיות שונה)

### אישור:
- **approval_required**: האם נדרש אישור
- **auto_approved**: האם אושר אוטומטית
- **rejection_reason**: סיבת דחייה
- **approval_notes**: הערות המאשר

### מחיקה:
- **is_deleted**: soft delete
- **deleted_date**: מתי
- **deleted_by**: מי
- **deletion_reason**: למה

### קישורים:
- **linked_delivery_ids**: משלוחים שמילאו את המשיכה