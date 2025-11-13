# מסמך בדיקות - רכיב הזנת אצווה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/inventory/BatchEntry.jsx

---

# מסמך בדיקות - BatchEntry

## T1: הזנה תקינה
**צעדים**:
1. מלא כל השדות
2. לחץ שמור

**תוצאה**:
✅ Validation עובר  
✅ onSave נקרא עם הנתונים  
✅ אין שגיאות  

---

## T2: שדות חסרים
**צעדים**:
1. השאר batch_number ריק
2. לחץ שמור

**תוצאה**:
✅ שגיאה: "מספר אצווה חובה"  
✅ onSave לא נקרא  
✅ focus על השדה  

---

## T3: תאריך תפוגה בעבר
**תוצאה**:
✅ שגיאה: "תאריך חייב להיות עתידי"  

---

## T4: Auto-save
**Setup**: autoSave={true}

**תוצאה**:
✅ שמירה אחרי 2 שניות  
✅ indicator "שומר..."  
✅ לא כפתורים  

---

## T5: Read-only mode
**Setup**: readOnly={true}

**תוצאה**:
✅ כל השדות disabled  
✅ לא ניתן לערוך  

---

## T6: Edit existing
**Setup**: initialData עם batch קיים

**תוצאה**:
✅ batch_number disabled (לא ניתן לשנות)  
✅ שאר השדות ניתנים לעריכה  

---

## Checklist
- [ ] כל השדות עובדים
- [ ] Validation נכונה
- [ ] Auto-save
- [ ] Read-only
- [ ] Error messages
- [ ] Hebrew RTL