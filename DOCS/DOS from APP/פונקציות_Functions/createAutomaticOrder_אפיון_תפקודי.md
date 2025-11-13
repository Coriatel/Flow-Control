# אפיון תפקודי - יצירת הזמנה אוטומטית

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/createAutomaticOrder.js

---

# אפיון תפקודי - createAutomaticOrder

## מטרה
יצירת הזמנה אוטומטית מהמלצות השלמה - בלחיצת כפתור.

## תהליך
1. מקבל recommendations[]
2. מקבץ לפי ספק
3. יוצר Order לכל ספק
4. יוצר OrderItems
5. מחזיר את ההזמנות שנוצרו

## דוגמה
```
המלצות:
- BIORAD: Anti-A (20), Anti-B (15)
- ELDAN: Cells (5)

תוצאה:
- Order 1 (BIORAD) עם 2 פריטים
- Order 2 (ELDAN) עם פריט 1
```