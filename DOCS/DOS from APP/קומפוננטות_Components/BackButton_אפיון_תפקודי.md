# אפיון תפקודי - כפתור חזרה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/ui/BackButton.jsx

---

# אפיון תפקודי - BackButton

## מטרה
כפתור חזרה אוניברסלי שמופיע בכל הדפים ומאפשר חזרה לדף הקודם.

## תיאור למשתמש
כפתור "חזור" בפינה השמאלית העליונה:
- ◀ חץ + "חזור" (desktop)
- ◀ רק חץ (mobile)
- חזרה לדף הקודם
- אם אין היסטוריה → Dashboard

## התנהגות

### במצב רגיל:
1. יש היסטוריית ניווט
2. לחיצה → חוזר צעד אחורה
3. URL מתעדכן

### אם אין היסטוריה:
1. נכנס ישירות לדף (deep link)
2. לחיצה → Dashboard
3. מונע תקיעות

## מקרי שימוש

### UC1: ניווט רגיל
1. Dashboard → Orders → EditOrder
2. בעמוד EditOrder לוחץ "חזור"
3. חוזר ל-Orders
4. לוחץ שוב → Dashboard

### UC2: Deep Link
1. נכנס ישירות ל-/EditOrder/123 (מאימייל)
2. אין היסטוריה
3. לוחץ "חזור"
4. עובר ל-Dashboard (fallback)

### UC3: Mobile
1. גלילה בנייד
2. הכפתור תמיד נגיש
3. רק אייקון (חסכון במקום)
4. עדיין ברור

## Visual Design

### Desktop:
```
[ ◀ חזור ]
```

### Mobile:
```
[ ◀ ]
```

### States:
- **Default**: ghost variant
- **Hover**: bg-slate-100
- **Active**: bg-slate-200
- **Size**: sm (קומפקטי)

## Integration

כל דף (חוץ מ-Dashboard) מתחיל ב:

```jsx
import BackButton from '@/components/ui/BackButton';

<div className="flex items-center gap-3 mb-6">
  <BackButton />
  <h1>כותרת הדף</h1>
</div>
```