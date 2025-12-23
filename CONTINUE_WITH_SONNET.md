# 🤖 פרומפט להמשך עבודה עם Claude Sonnet

## העתק את הפרומפט הבא ל-Claude Sonnet:

---

## פרומפט התחלתי

```
אתה עובד על פרויקט Flow Control - מערכת ניהול מלאי לבנק דם.

## מצב נוכחי
- **Backend:** Express + Prisma + PostgreSQL - מוכן ועובד בתיקיית /server
- **Frontend:** React + Vite עם 51 דפים - מחובר כרגע ל-Base44 SDK
- **מטרה:** להחליף את Base44 SDK בחיבור ל-Backend המקומי

## קובץ תוכנית המיגרציה
קרא את הקובץ `/home/user/Flow-Control/MIGRATION_PLAN.md` - הוא מכיל תוכנית מפורטת עם 12 שלבים.

## התחל לעבוד
1. קרא את MIGRATION_PLAN.md
2. התחל משלב 1 (Proxy Configuration)
3. עבוד שלב אחר שלב
4. בצע commit אחרי כל שלב
5. דווח על התקדמות

## כללים חשובים
- עבוד בשלבים קטנים
- בדוק אחרי כל שינוי
- אל תדלג על בדיקות
- תעד שגיאות ופתרונות

התחל עכשיו בשלב 1!
```

---

## מבנה הפרויקט

```
/home/user/Flow-Control/
├── MIGRATION_PLAN.md          ← תוכנית המיגרציה המלאה
├── CONTINUE_WITH_SONNET.md    ← קובץ זה
├── README.md                  ← תיעוד הפרויקט
├── package.json               ← Frontend dependencies
├── vite.config.js             ← Vite configuration
├── src/
│   ├── api/
│   │   ├── base44Client.js    ← להחליף/למחוק
│   │   ├── entities.js        ← לשכתב
│   │   ├── functions.js       ← לשכתב
│   │   └── apiClient.js       ← ליצור חדש
│   ├── pages/                 ← 51 דפים לעדכון
│   └── components/            ← קומפוננטות UI
├── server/
│   ├── src/
│   │   ├── routes/            ← API routes
│   │   ├── services/          ← Business logic
│   │   └── server.ts          ← Entry point
│   ├── prisma/
│   │   └── schema.prisma      ← Database schema
│   └── package.json
└── docker-compose.yml         ← PostgreSQL
```

---

## פקודות שימושיות

```bash
# הפעלת Backend
cd /home/user/Flow-Control/server && npm run dev

# הפעלת Frontend
cd /home/user/Flow-Control && npm run dev

# הפעלת Database
docker-compose up -d

# בדיקת API
curl http://localhost:4000/api/health

# חיפוש שימושים ב-base44
grep -r "base44" src/ --include="*.jsx" --include="*.js"
```

---

## רשימת שלבים (מ-MIGRATION_PLAN.md)

1. ⬜ **שלב 1:** הכנת Proxy Configuration (vite.config.js)
2. ⬜ **שלב 2:** יצירת apiClient.js חדש
3. ⬜ **שלב 3:** עדכון entities.js
4. ⬜ **שלב 4:** עדכון functions.js
5. ⬜ **שלב 5:** מחיקת/שינוי base44Client.js
6. ⬜ **שלב 6:** עדכון imports בדפי React (51 קבצים)
7. ⬜ **שלב 7:** הסרת @base44/sdk מ-package.json
8. ⬜ **שלב 8:** הוספת endpoints חסרים ל-Backend
9. ⬜ **שלב 9:** בדיקות מקיפות
10. ⬜ **שלב 10:** טיפול בשגיאות
11. ⬜ **שלב 11:** עדכון README
12. ⬜ **שלב 12:** הכנה ל-Production

---

## טיפים ל-Sonnet

### ✅ עשה
- קרא את MIGRATION_PLAN.md בהתחלה
- עבוד שלב אחר שלב
- בדוק אחרי כל שינוי קטן
- בצע commit אחרי כל שלב שהושלם
- השתמש ב-TodoWrite לעקוב אחר התקדמות

### ❌ אל תעשה
- אל תדלג על שלבים
- אל תשנה קבצים רבים בבת אחת
- אל תמחק קבצים לפני שיש גיבוי
- אל תתעלם משגיאות

---

## הערות נוספות

1. **Backend כבר עובד** - אין צורך לשנות את קוד ה-Backend, רק להוסיף endpoints חסרים

2. **51 דפים לעדכון** - זה הקטע הכי ארוך, צריך סבלנות

3. **Base44 SDK** - צריך להסיר לגמרי בסוף

4. **בדיקות** - חשוב לבדוק כל שלב לפני שממשיכים

---

**בהצלחה!** 🚀
