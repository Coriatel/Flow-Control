# אפיון תפקודי - רכיב הזנת אצווה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/inventory/BatchEntry.jsx

---

# אפיון תפקודי - BatchEntry

## מטרה
רכיב להזנת/עריכת נתוני אצווה - batch number, expiry date, quantity, notes.

## תיאור למשתמש

כשצריך להזין אצווה חדשה או לספור אצווה קיימת:
- 🏷️ מספר אצווה (batch number)
- 📅 תאריך תפוגה (expiry date)
- 🔢 כמות (quantity)
- 📝 הערות (notes)
- ✅ שמירה אוטומטית או כפתור שמירה

## שימושים

### 1. ספירת מלאי:
- מציג אצווה קיימת
- מאפשר הזנת כמות נספרת
- שומר ל-draft אוטומטית

### 2. קליטת משלוח:
- שדות ריקים
- מאפשר הזנה מלאה
- Validation: batch number required, expiry required

### 3. עריכת אצווה:
- טעינת נתונים קיימים
- עריכה מוגבלת (לא ניתן לשנות batch number)
- שמירה עם history

## UI Elements

### Inputs:
- **Batch Number**: text input, auto-uppercase
- **Expiry Date**: date picker עברי
- **Quantity**: number input, min=0, step=1
- **Notes**: textarea, optional

### Validation:
- ✅ Batch number: required, pattern check
- ✅ Expiry: required, future date
- ✅ Quantity: required, >= 0
- ⚠️ Error messages בעברית ברורה

## מקרי שימוש

### UC1: הזנת אצווה בספירה
1. רואה אצווה ABC123 עם 15 יח' במערכת
2. סופר ומוצא 12
3. מקליד 12 בשדה
4. מוסיף הערה "חסר 3"
5. הנתונים נשמרים ל-draft

### UC2: קליטת אצווה חדשה
1. שדות ריקים
2. מזין: DEF456, 31/12/2025, 25 יח'
3. לוחץ "הוסף"
4. האצווה נוספת לרשימה

### UC3: Validation Error
1. מנסה להזין תאריך תפוגה בעבר
2. מקבל שגיאה: "תאריך תפוגה חייב להיות עתידי"
3. מתקן
4. עובר

## Auto-save

- בספירת מלאי: auto-save כל 2 שניות
- בקליטת משלוח: save on click
- Visual indicator: "נשמר..." / "שומר..."