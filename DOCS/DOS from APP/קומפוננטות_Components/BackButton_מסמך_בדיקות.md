# מסמך בדיקות - כפתור חזרה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** components/ui/BackButton.jsx

---

# מסמך בדיקות - BackButton

## T1: חזרה רגילה
**Setup**: Dashboard → Orders → EditOrder

**צעדים**:
1. לחץ BackButton ב-EditOrder

**תוצאה**:
✅ חזרה ל-Orders  
✅ URL: /Orders  

---

## T2: חזרה פעמיים
**Setup**: Dashboard → Orders → EditOrder

**צעדים**:
1. לחץ BackButton
2. לחץ BackButton שוב

**תוצאה**:
✅ Orders  
✅ Dashboard  

---

## T3: Deep Link (אין היסטוריה)
**Setup**: נכנס ישירות ל-/EditOrder/123

**צעדים**:
1. לחץ BackButton

**תוצאה**:
✅ עובר ל-Dashboard  
✅ לא error  

---

## T4: Mobile View
**Setup**: iPhone (375px)

**תוצאה**:
✅ רק אייקון ◀  
✅ ללא טקסט "חזור"  
✅ עדיין לחיץ  

---

## T5: Desktop View
**Setup**: Desktop (1920px)

**תוצאה**:
✅ אייקון + "חזור"  
✅ gap-2 ביניהם  

---

## Checklist
- [ ] navigate(-1) works
- [ ] fallback to Dashboard
- [ ] responsive text
- [ ] hover effect
- [ ] accepts props