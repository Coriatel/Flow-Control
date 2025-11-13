# מסמך בדיקות - פעילות אחרונה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/dashboard/RecentActivity.jsx

---

# מסמך בדיקות - RecentActivity

## T1: הצגת פעילות
**Setup**: 20 activities

**תוצאה**:
✅ 20 items  
✅ sorted by date (newest first)  
✅ icons + colors נכונים  

---

## T2: Empty State
**Setup**: activities = []

**תוצאה**:
✅ "אין פעילות אחרונה"  
✅ centered  

---

## T3: Scroll
**Setup**: 20 activities (גובה > h-64)

**תוצאה**:
✅ scrollbar מופיע  
✅ גלילה חלקה  

---

## T4: "הצג הכל"
**צעדים**:
1. לחץ "הצג הכל"

**תוצאה**:
✅ ניווט ל-ActivityLog  

---

## T5: Date Formatting
**Setup**: activity מהיום 14:30

**תוצאה**:
✅ "14:30" בשורה ראשונה  
✅ "10/11" בשורה שנייה  
✅ עברית (he locale)  

---

## Checklist
- [ ] 20 items max
- [ ] sorted by date
- [ ] icons mapping
- [ ] colors per type
- [ ] scrollable
- [ ] empty state
- [ ] "הצג הכל" link
- [ ] date formatting (he)