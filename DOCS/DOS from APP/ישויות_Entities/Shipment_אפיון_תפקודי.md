# אפיון תפקודי - משלוחים יוצאים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/Shipment.json

---

# אפיון תפקודי - Shipment

## מטרה
תיעוד משלוחים יוצאים - שליחת ריאגנטים לגורם חיצוני/פנימי או החזרה לספק.

## תיאור
- 📋 מספר משלוח (shipment_number)
- 🎯 סוג (standard_outbound/return_to_supplier/transfer_out)
- 👥 נמען (recipient_name + type)
- 📅 תאריך שליחה (shipment_date)
- ❄️ דרישות מיוחדות (cold_storage, special_handling)
- ✅ סטטוס (draft/prepared/sent/delivered/confirmed)

## סוגי משלוח

### standard_outbound
- שליחה רגילה לגורם חיצוני
- למעבדה אחרת, מוסד, וכו'

### return_to_supplier
- החזרת מוצר לספק
- פגום, פג תוקף מוקדם, החלפה

### transfer_out
- העברה לגוף אחר בארגון
- מעקב מלאי בין יחידות

## סטטוסים

### draft
- משלוח בהכנה
- ניתן לערוך

### prepared
- מוכן לשליחה
- כל הפריטים ארוזים

### sent
- נשלח
- בדרך

### delivered
- הגיע ליעד
- ממתינים לאישור

### confirmed
- הנמען אישר קבלה
- המשלוח הושלם

### cancelled
- בוטל
- הפריטים חוזרים למלאי