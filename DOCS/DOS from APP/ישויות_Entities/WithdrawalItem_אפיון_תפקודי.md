# אפיון תפקודי - פריטי משיכה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** entities/WithdrawalItem.json

---

# אפיון תפקודי - WithdrawalItem

## מטרה
פירוט של פריט בודד בבקשת משיכה - מה מבוקש, כמה, ומה אושר.

## תיאור
- 🧪 ריאגנט (reagent_name_snapshot)
- 📦 כמות מבוקשת (quantity_requested)
- ✅ כמות מאושרת (quantity_approved)
- 💰 מחיר יחידה במסגרת (unit_price_framework)
- 📊 נימוק (justification)
- 🎯 סטטוס (pending/approved/rejected/delivered/cancelled)

## שדות

### קישורים:
- **withdrawal_request_id**: לאיזו משיכה
- **reagent_id**: לאיזה ריאגנט
- **reagent_name_snapshot**: שם (צילום)

### כמויות:
- **quantity_requested**: מה ביקשתי
- **quantity_approved**: מה אושר (יכול להיות שונה)

### נימוק:
- **justification**: למה צריך
- **current_stock_level**: מלאי נוכחי
- **minimum_required_level**: מינימום נדרש
- **expected_consumption_period**: תקופת צריכה

### מחיר:
- **unit_price_framework**: מחיר יחידה במסגרת
- **total_line_value**: quantity * price

### אופציות:
- **substitution_allowed**: אם מותר תחליף
- **partial_delivery_allowed**: אם מותרת אספקה חלקית
- **priority**: low/medium/high/critical
- **notes**: הערות

### סטטוס:
- **line_status**: pending/approved/rejected/delivered/cancelled