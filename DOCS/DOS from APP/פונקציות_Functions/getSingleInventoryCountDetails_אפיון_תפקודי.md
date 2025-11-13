# אפיון תפקודי - פרטי ספירה בודדת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getSingleInventoryCountDetails.js

---

# אפיון תפקודי - getSingleInventoryCountDetails

## מטרה
טעינת פירוט מלא של ספירת מלאי ספציפית - כל האצוות שנספרו, ההפרשים, וההערות.

## תיאור
- 🔍 ספירה ספציפית לפי ID
- 📊 כל האצוות שנספרו
- ↕️ הפרש לכל אצווה (נספר vs היה במערכת)
- 📝 הערות לכל פריט
- 📥 ייצוא לExcel

## מקרי שימוש

### UC1: צפייה בספירה קודמת
1. בוחר ספירה מההיסטוריה
2. רואה פירוט מלא
3. רואה הפרשים

### UC2: ביקורת
1. ביקורת רוצה לראות ספירה ספציפית
2. מייצא לExcel
3. מדפיס