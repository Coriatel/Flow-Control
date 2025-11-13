# מסמך בדיקות - פעולות קריטיות

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/CriticalActions.jsx

---

# מסמך בדיקות - CriticalActions

## T1: Empty State
**Setup**: actions = []

**תוצאה**:
✅ "הכל מעודכן!"  
✅ רקע ירוק  
✅ אייקון Lightbulb  

---

## T2: Critical Action
**Setup**: 1 action, priority='critical'

**תוצאה**:
✅ רקע אדום  
✅ border אדום  
✅ אייקון אזהרה  
✅ טקסט בולט  

---

## T3: Mixed Priorities
**Setup**: 2 critical, 3 high, 2 medium

**תוצאה**:
✅ רק 5 הראשונות  
✅ סדר: critical → high → medium  
✅ צבעים שונים  

---

## T4: Click Navigation
**Setup**: action.link = 'InventoryCount'

**צעדים**:
1. לחץ על action

**תוצאה**:
✅ ניווט ל-InventoryCount  
✅ URL משתנה  

---

## T5: Hover Effects
**תוצאה**:
✅ background darker  
✅ font-semibold  
✅ chevron darker  

---

## Checklist
- [ ] empty state
- [ ] all priorities
- [ ] sorting
- [ ] max 5 items
- [ ] navigation
- [ ] hover effects
- [ ] responsive