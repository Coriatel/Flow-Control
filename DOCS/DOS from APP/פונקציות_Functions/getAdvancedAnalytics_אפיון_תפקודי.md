# אפיון תפקודי - אנליטיקה מתקדמת

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/getAdvancedAnalytics.js

---

# אפיון תפקודי - getAdvancedAnalytics

## מטרה
אנליטיקה מתקדמת של המערכת - טרנדים, תחזיות, anomalies.

## תיאור למשתמש
בדף הדוחות, בלשונית "אנליטיקה מתקדמת":
- 📈 גרפים של צריכה לאורך זמן
- 🔮 תחזית צריכה ל-3 חודשים קדימה
- 🚨 Anomalies - צריכה חריגה
- 💰 ניתוח עלויות
- 🏆 Top 10 reagents by usage
- 📊 השוואת ספקים

## מקרי שימוש

### UC1: זיהוי חריגות
1. נכנס לדוחות
2. רואה שב-ספטמבר היה spike של 300% ב-Anti-A
3. בודק מה קרה
4. מגלה שהיה אירוע חריג במעבדה

### UC2: תחזית צריכה
1. רוצה לדעת כמה נצרוך ב-3 החודשים הבאים
2. המערכת מנתחת 12 חודשים אחרונים
3. מחשבת טרנד
4. מציגה תחזית
5. ממליצה כמה להזמין מראש

## ניתוחים

1. **Usage Trends**: צריכה לאורך זמן (monthly)
2. **Seasonality**: זיהוי עונתיות
3. **Anomalies**: ימים/חודשים חריגים
4. **Cost Analysis**: עלויות לאורך זמן
5. **Supplier Performance**: זמני אספקה, איכות
6. **Inventory Turnover**: כמה מהר נצרך
7. **Forecast**: תחזית ל-3 חודשים