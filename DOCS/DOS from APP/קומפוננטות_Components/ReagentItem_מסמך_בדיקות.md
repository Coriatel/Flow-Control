# מסמך בדיקות - כרטיס ריאגנט

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/inventory/ReagentItem.jsx

---

# מסמך בדיקות - ReagentItem

## T1: תצוגה רגילה - ריאגנט תקין
**Setup**: ריאגנט עם מלאי תקין (4 חודשים)

**תוצאה**:
✅ רקע ירוק  
✅ כל הפרטים מוצגים  
✅ לא badge אזהרה  
✅ Actions: ערוך, אצוות (ללא הזמן)  

---

## T2: ריאגנט במלאי נמוך
**Setup**: months_of_stock = 0.8

**תוצאה**:
✅ רקע כתום  
✅ Badge: "מלאי נמוך"  
✅ כפתור "הזמן" מופיע  

---

## T3: פג תוקף קרוב
**Setup**: nearest_expiry = בעוד 10 ימים

**תוצאה**:
✅ Badge אדום: "פג בעוד 10 ימים"  
✅ אייקון אזהרה  

---

## T4: Compact Mode
**Setup**: compact={true}

**תוצאה**:
✅ רק שם + סטטוס  
✅ פרטים מלאים מוסתרים  

---

## T5: Click Interaction
**Setup**: onClick handler

**תוצאה**:
✅ לחיצה קוראת ל-onClick  
✅ reagent מועבר כפרמטר  

---

## Responsive Tests

### R1: Desktop (1920x1080)
✅ כרטיס מלא עם כל הפרטים  
✅ Actions בשורה אחת  

### R2: Tablet (768px)
✅ כרטיס מתכווץ  
✅ Actions עדיין בשורה  

### R3: Mobile (375px)
✅ Layout אנכי  
✅ Actions בעמודה  
✅ טקסט readable  

---

## Checklist
- [ ] רינדור נכון
- [ ] צבעים לפי status
- [ ] expiry badges
- [ ] responsive
- [ ] interactions
- [ ] compact mode
- [ ] accessibility