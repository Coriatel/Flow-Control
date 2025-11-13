# אפיון תפקודי - פעילות אחרונה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/RecentActivity.jsx

---

# אפיון תפקודי - RecentActivity

## מטרה
הצגת 20 הפעולות האחרונות במערכת - יומן פעילות מקוצר במרכז הבקרה.

## תיאור למשתמש
במרכז הבקרה, "פעילות אחרונה":
- 📜 20 פעולות אחרונות
- ⏰ זמן מדויק (HH:mm + dd/MM)
- 🎨 אייקון וצבע לפי סוג
- 🔗 "הצג הכל" → יומן פעילות מלא
- 📊 ScrollArea (גלילה)

## סוגי פעילות

### 🚚 delivery (ירוק)
- "קליטת משלוח D-2024-001"
- "עדכון מלאי: +50 יח' ל-Anti-A"

### 📝 count_update (כחול)
- "ספירת מלאי: Anti-B עודכן ל-25 יח'"

### 📦 withdrawal (סגול)
- "משיכת ריאגנטים: W-2024-005"

### 📄 order_created (כתום)
- "יצירת דרישת רכש O-2024-123"

## UI Elements

### Activity Item:
```
[Icon] [Description]           [Time]
 🚚    קליטת משלוח D-001      14:30
                               10/11
```

### Layout:
- **Icon**: צבע לפי סוג, background light
- **Description**: text-sm, font-medium
- **Time**: text-xs, right-aligned, 2 שורות (שעה + תאריך)
- **Container**: bg-slate-50, rounded-lg, p-3

### ScrollArea:
- Height: 256px (h-64)
- Smooth scrolling
- Custom scrollbar (thin, modern)

## מקרי שימוש

### UC1: צפייה בפעילות
1. נכנס לדשבורד
2. רואה 20 פעולות אחרונות
3. גולל למטה
4. רואה מה קרה היום
5. מזהה תבניות

### UC2: מעבר ליומן מלא
1. לוחץ "הצג הכל"
2. עובר לדף ActivityLog
3. רואה פעילות מלאה עם סינונים

## Data Structure

```typescript
interface Activity {
  id: string;
  icon: string;           // שם האייקון מ-Lucide
  color: string;          // bg-green-100 text-green-700
  description: string;    // תיאור הפעולה
  date: Date;            // זמן הפעולה
}
```