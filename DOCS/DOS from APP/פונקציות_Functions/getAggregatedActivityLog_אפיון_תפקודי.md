# אפיון תפקודי - יומן פעילות מצטבר

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getAggregatedActivityLog.js

---

# אפיון תפקודי - getAggregatedActivityLog

## מטרה
יומן פעילות מצטבר - כל מה שקרה במערכת בציר זמן אחד.

## תיאור
- 📜 כל הפעולות (deliveries, transactions, orders, withdrawals)
- 👤 מי ביצע
- 📅 מתי
- 📝 מה קרה
- 🔍 סינון לפי סוג/משתמש/תאריך
- 📥 ייצוא לCSV

## מקרי שימוש

### UC1: צפייה בפעילות היומית
1. נכנס ליומן
2. רואה את כל הפעולות של היום
3. 23 פעולות: 5 משלוחים, 12 משיכות, 6 עדכוני מלאי

### UC2: מעקב אחר משתמש
1. סינון לפי משתמש
2. רואה כל מה שהוא עשה
3. ייצוא לCSV