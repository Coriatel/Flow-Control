# אפיון תפקודי - טבלה מתכווננת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/ui/ResizableTable.jsx

---

# אפיון תפקודי - ResizableTable

## מטרה
טבלה חכמה שמתכווננת לתוכן - עמודות בגודל אוטומטי, responsive, sortable, filterable.

## תיאור למשתמש

כל הטבלאות במערכת משתמשות ברכיב הזה:
- 📊 עמודות מתכווננות אוטומטית
- ↕️ מיון בלחיצה על כותרת
- 🔍 חיפוש גלובלי
- 📱 Responsive - בנייד עובר ל-cards
- 📄 Pagination (50/100/200 שורות)
- 📥 ייצוא ל-Excel/CSV
- 🎨 Striped rows לקריאות

## Features

### Desktop View:
- טבלה מלאה עם כל העמודות
- Header sticky (נשאר למעלה בגלילה)
- Sortable columns
- Hover highlight
- Row selection (optional)

### Mobile View (< 768px):
- עובר אוטומטית ל-cards
- כל שורה = card
- חיפוש למעלה
- Pagination למטה

## מקרי שימוש

### UC1: צפייה בטבלת הזמנות
1. נכנס לעמוד הזמנות
2. רואה טבלה עם 50 הזמנות
3. לוחץ על "מספר הזמנה" → מיון
4. מחפש "BIORAD" → סינון
5. לוחץ על שורה → פרטים

### UC2: שימוש בנייד
1. נכנס מהנייד
2. רואה cards במקום טבלה
3. גולל בנוחות
4. לוחץ על card → פרטים

### UC3: ייצוא נתונים
1. לוחץ "ייצוא Excel"
2. מוריד קובץ עם כל השורות
3. פותח ב-Excel
4. כל הנתונים שם

## Configuration

```jsx
<ResizableTable
  columns={[
    { key: 'order_number', label: 'מספר הזמנה', sortable: true },
    { key: 'supplier', label: 'ספק', sortable: true },
    { key: 'status', label: 'סטטוס', render: (row) => <Badge>{row.status}</Badge> }
  ]}
  data={orders}
  onRowClick={(row) => navigate(`/order/${row.id}`)}
  searchable={true}
  exportable={true}
  pageSize={50}
/>
```