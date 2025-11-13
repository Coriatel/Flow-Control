# מסמך בדיקות - מרכז הבקרה

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** pages/Dashboard.js

---

# מסמך בדיקות - Dashboard

## 1. תרחישי בדיקה עיקריים

### TC-001: טעינה ראשונית
**Severity**: Critical  
**Steps**:
1. נווט ל-`/Dashboard`
2. המתן לטעינה

**Expected**:
- [ ] Spinner מוצג
- [ ] 4 כרטיסי סיכום עם מספרים
- [ ] פעולות קריטיות מוצגות
- [ ] זמן טעינה < 2 שניות

---

### TC-002: רענון ידני
**Severity**: High  
**Steps**:
1. לחץ "רענון"
2. המתן

**Expected**:
- [ ] כפתור הופך ל-spinner
- [ ] נתונים מתעדכנים
- [ ] זמן < 1 שנייה

---

### TC-003: Popover (Desktop)
**Severity**: High  
**Steps**:
1. הובר מעל כרטיס
2. לחץ "הצג הכל"

**Expected**:
- [ ] Popover נפתח עם 5 פריטים
- [ ] מעבר לדף מפורט

---

### TC-004: פעולה קריטית
**Severity**: Critical  
**Steps**:
1. לחץ על התראה

**Expected**:
- [ ] מעבר לדף הנכון
- [ ] סינון מוחל

---

### TC-005: ניווט מהיר
**Severity**: Medium  
**Steps**:
1. פתח קטגוריה
2. לחץ על פעולה

**Expected**:
- [ ] Accordion נפתח
- [ ] מעבר לדף

---

## 2. בדיקות רספונסיביות

### RES-001: Mobile (375x667)
**Expected**:
- [ ] Grid 2x2 לכרטיסים
- [ ] אין Popover
- [ ] ניווט מהיר למטה
- [ ] אין overflow אופקי

### RES-002: Desktop (1920x1080)
**Expected**:
- [ ] Grid 5 עמודות (3+2)
- [ ] Popover פעיל
- [ ] Sidebar קבוע

---

## 3. בדיקות ביצועים

### PERF-001: זמן טעינה
**Baseline**: < 2 seconds
**Metric**: Time to Interactive

### PERF-002: גודל API
**Baseline**: < 100KB

---

## 4. מקרי קצה

### EDGE-001: אין נתונים
**Expected**:
- [ ] כרטיסים עם 0
- [ ] "הכל מעודכן!"
- [ ] אין שגיאות

### EDGE-002: 100+ פריטים
**Expected**:
- [ ] Popover מציג 5
- [ ] "הצג את כל 100"

### EDGE-003: Unauthorized
**Expected**:
- [ ] מעבר להתחברות

---

## 5. בדיקות אבטחה

### SEC-001: הרשאות
**Steps**:
1. התחבר כ-User רגיל

**Expected**:
- [ ] אין "ניהול מתקדם"
- [ ] חסימה ב-AdminPanel

### SEC-002: XSS
**Steps**:
1. הערה עם `<script>`

**Expected**:
- [ ] טקסט מוצג, לא מבוצע

---

## 6. Regression Tests

לפני Production:
- [ ] TC-001 עד TC-005
- [ ] RES-001, RES-002
- [ ] PERF-001
- [ ] SEC-001

---

## Sign-Off

- [ ] כל הבדיקות עברו
- [ ] אין באגים Critical
- [ ] Code Review הושלם
- [ ] תיעוד עודכן

**Approved**: ___________  
**Date**: ___________