# מסמך בדיקות - כרטיס סיכום

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/SummaryCard.jsx

---

# מסמך בדיקות - SummaryCard

## T1: כרטיס פשוט
**Setup**: בלי popover

**תוצאה**:
✅ כרטיס מוצג  
✅ לחיצה → ניווט  
✅ צבע נכון  

---

## T2: כרטיס עם Popover
**Setup**: popoverItems מלא

**תוצאה**:
✅ hover → popover נפתח  
✅ רשימת פריטים מוצגת  
✅ לחיצה על פריט → action  

---

## T3: כל הצבעים
**Setup**: 4 כרטיסים - red/orange/blue/purple

**תוצאה**:
✅ כל צבע שונה  
✅ עקבי ויפה  

---

## T4: Hover Effect
**תוצאה**:
✅ shadow גדל  
✅ -translate-y-1  
✅ smooth transition  

---

## Responsive Tests

### R1: Desktop
✅ 4 כרטיסים בשורה

### R2: Tablet
✅ 2 כרטיסים בשורה

### R3: Mobile
✅ כרטיס אחד בשורה
✅ מספרים גדולים וברורים

---

## Checklist
- [ ] כל הצבעים
- [ ] popover option
- [ ] navigation
- [ ] hover effects
- [ ] responsive
- [ ] RTL