# מסמך בדיקות - אנליטיקה מתקדמת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getAdvancedAnalytics.js

---

# מסמך בדיקות - getAdvancedAnalytics

## T1: Usage trends
**Setup**: 12 חודשים של transactions

**תוצאה**:
✅ מוצג גרף לפי חודש  
✅ טרנד מזוהה  

---

## T2: Anomaly detection
**Setup**: spike של 300% בחודש אחד

**תוצאה**:
✅ החודש מסומן כחריג  
✅ הודעה: "צריכה חריגה"  

---

## T3: Forecast
**Setup**: טרנד עולה

**תוצאה**:
✅ תחזית גבוהה יותר  
✅ המלצה להזמין מראש  

---

## Checklist
- [ ] trends calculation
- [ ] anomaly detection
- [ ] forecast accuracy
- [ ] cost analysis
- [ ] supplier comparison