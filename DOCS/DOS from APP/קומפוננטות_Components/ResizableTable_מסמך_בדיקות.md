# מסמך בדיקות - טבלה מתכווננת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/ui/ResizableTable.jsx

---

# מסמך בדיקות - ResizableTable

## Desktop Tests

### T1: תצוגה רגילה
**Setup**: 50 שורות, 5 עמודות

**תוצאה**:
✅ טבלה מלאה  
✅ כל העמודות מוצגות  
✅ Header sticky  

---

### T2: מיון
**צעדים**:
1. לחץ על כותרת "ספק"
2. לחץ שוב

**תוצאה**:
✅ מיון עולה  
✅ מיון יורד  
✅ חץ משתנה  

---

### T3: חיפוש
**צעדים**:
1. הקלד "BIORAD" בחיפוש

**תוצאה**:
✅ רק שורות עם BIORAD  
✅ 15/50 שורות  

---

### T4: ייצוא
**תוצאה**:
✅ קובץ CSV מורד  
✅ כל הנתונים בקובץ  

---

## Mobile Tests

### M1: Card view
**Setup**: iPhone (375px)

**תוצאה**:
✅ לא טבלה - cards  
✅ כל card עם כל הפרטים  
✅ ניתן לגלול  

---

### M2: חיפוש בנייד
**תוצאה**:
✅ שדה חיפוש למעלה  
✅ cards מסוננים  

---

## Performance Tests

### P1: 1000 שורות
**תוצאה**:
✅ Pagination עובד  
✅ רק 50 בכל פעם  
✅ חלק  

---

## Checklist
- [ ] desktop table
- [ ] mobile cards
- [ ] sorting
- [ ] searching
- [ ] pagination
- [ ] export
- [ ] row click
- [ ] responsive breakpoint
- [ ] performance OK