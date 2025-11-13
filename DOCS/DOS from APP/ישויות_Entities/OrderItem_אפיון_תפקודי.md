# אפיון תפקודי - פריטי הזמנה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/OrderItem.json

---

# אפיון תפקודי - OrderItem Entity

## מטרה
פירוט של פריט בודד בהזמנה - מה הוזמן, כמה, מה התקבל, ומה נותר.

## תיאור למשתמש
כל פריט בהזמנה:
- 🧪 ריאגנט (reagent_name_snapshot)
- 📦 כמות שהוזמנה (quantity_ordered)
- ✅ כמות שהתקבלה (quantity_received)
- ⏳ יתרה פתוחה (quantity_remaining)
- 💰 מחיר ליחידה (unit_price_ordered)
- 🎯 סטטוס שורה (open/partially_received/fully_received/cancelled)

## שדות מרכזיים

### קישורים:
- **order_id**: לאיזו הזמנה שייך
- **reagent_id**: לאיזה ריאגנט

### סנפשוטים:
- **reagent_name_snapshot**: שם בזמן ההזמנה (לתיעוד)

### כמויות:
- **quantity_ordered**: כמות מקורית שהוזמנה
- **quantity_received**: כמה הגיע עד כה (מתעדכן)
- **quantity_remaining**: כמה עוד חסר (מחושב)

### מחיר:
- **unit_price_ordered**: מחיר ליחידה בהזמנה

### סטטוס:
- **line_status**: open/partially_received/fully_received/cancelled

### הערות:
- **notes**: הערות לשורת הפריט

## חישוב quantity_remaining

```
quantity_remaining = quantity_ordered - quantity_received
```

### דוגמאות:
- הוזמנו 100, הגיעו 0 → remaining=100
- הוזמנו 100, הגיעו 60 → remaining=40
- הוזמנו 100, הגיעו 100 → remaining=0
- הוזמנו 100, הגיעו 120 → remaining=-20 (עודף!)

## עדכון אחרי משלוח

כשמשלוח מתקבל:

```javascript
// DeliveryItem מקושר ל-OrderItem
const deliveryItem = { 
  order_item_id: oi.id, 
  quantity_received: 60 
};

// Update OrderItem
await OrderItem.update(oi.id, {
  quantity_received: oi.quantity_received + 60,
  quantity_remaining: oi.quantity_ordered - (oi.quantity_received + 60),
  line_status: 
    (oi.quantity_ordered === oi.quantity_received + 60) 
      ? 'fully_received' 
      : 'partially_received'
});
```

## Line Status Logic

### open:
- quantity_received = 0
- טרם הגיע דבר

### partially_received:
- 0 < quantity_received < quantity_ordered
- חלק הגיע, חלק לא

### fully_received:
- quantity_received >= quantity_ordered
- הכל הגיע (או יותר)

### cancelled:
- הפריט בוטל
- לא מצפים למשלוח

## מקרי שימוש

### UC1: יצירת פריט בהזמנה
1. בוחרים Anti-A
2. כמות: 100
3. מחיר: 50 ₪
4. OrderItem נוצר:
   - quantity_ordered = 100
   - quantity_received = 0
   - quantity_remaining = 100
   - line_status = 'open'

### UC2: קבלת משלוח ראשון
1. הגיעו 60 מתוך 100
2. quantity_received: 0→60
3. quantity_remaining: 100→40
4. line_status: open→partially_received

### UC3: השלמת קבלה
1. הגיעו עוד 40
2. quantity_received: 60→100
3. quantity_remaining: 40→0
4. line_status: partially_received→fully_received

### UC4: קבלת עודף
1. הוזמנו 100
2. הגיעו 120 (+20 עודף)
3. quantity_received = 120
4. quantity_remaining = -20
5. line_status = 'fully_received'
6. התראה: "עודף של 20 יח'"

### UC5: ביטול פריט
1. הפריט לא נדרש יותר
2. line_status → 'cancelled'
3. notes = סיבת הביטול
4. Order.total_value מתעדכן