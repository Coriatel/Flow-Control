# אפיון תפקודי - כרטיס סיכום

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/SummaryCard.jsx

---

# אפיון תפקודי - SummaryCard

## מטרה
כרטיס סיכום ויזואלי להצגת מספר/סטטיסטיקה חשובה במרכז הבקרה.

## תיאור למשתמש
כל מספר חשוב במרכז הבקרה מוצג בכרטיס:
- 🔢 מספר גדול ובולט
- 🏷️ תיאור ברור
- 🎨 צבע לפי דחיפות (אדום/צהוב/כחול/סגול)
- 🖱️ לחיצה → ניווט לדף המתאים
- 💡 Popover עם רשימת פריטים (אופציונלי)

## מקרי שימוש

### UC1: כרטיס פשוט (ניווט)
1. רואה "5 ריאגנטים קרובים לפג תוקף"
2. לוחץ על הכרטיס
3. עובר לדף ניהול פגי תוקף
4. רואה את 5 הריאגנטים

### UC2: כרטיס עם Popover
1. רואה "3 משיכות ממתינות"
2. מרחף מעל הכרטיס
3. Popover נפתח עם רשימת 3 המשיכות
4. לוחץ על אחת → עובר לעריכה
5. או לוחץ על הכרטיס → כל המשיכות

### UC3: צבע דחיפות
- 🔴 אדום (critical): פג תוקף היום, אזל מלאי
- 🟡 צהוב (warning): קרוב לפג, מלאי נמוך
- 🔵 כחול (info): מידע כללי
- 🟣 סגול (neutral): סטטיסטיקה

## Visual Design

### Layout:
```
┌─────────────────────┐
│  [Icon]        [42] │  ← מספר גדול
│                     │
│  תיאור הכרטיס      │  ← טקסט מרכזי
└─────────────────────┘
```

### States:
- **Default**: רקע צבעוני בהיר
- **Hover**: shadow + lift (-translate-y-1)
- **Active**: darker background

### Colors:
- red: bg-red-50, border-red-200, text-red-700
- orange: bg-amber-50, border-amber-200, text-amber-700
- blue: bg-blue-50, border-blue-200, text-blue-700
- purple: bg-purple-50, border-purple-200, text-purple-700

## Props

```typescript
interface SummaryCardProps {
  icon: ReactNode;          // Lucide icon
  title: string;            // תיאור
  count: number;            // המספר המרכזי
  linkTo?: string;          // דף ליעד (אם לוחצים)
  color: 'red' | 'orange' | 'blue' | 'purple';
  popoverItems?: Array;     // פריטים לפופאובר (אופציונלי)
  popoverType?: string;     // סוג הפופאובר
}
```