# Flow Control – Backend Work Plan

מקורות עיקריים:  
- `DOCS/chat.txt` – תיעוד מפורט של הדרישות והלוגיקה העסקית.  
- `DOCS/system-and-backend-plan.md` – תמצית הדרישות ותובנות בקאנד.  
- `DOCS/DOS from APP/*` – מיפוי מסכים, פונקציות וישויות מתוך האפליקציה.  
- קובצי CSV (למשל `DOCS/Reagent_2025-10-30.csv`) – דוגמת נתונים לזריעה / בדיקות.

להלן 10 שלבים (פלוס שלב אפס) שמכסים את כל העבודה הדרושה כדי לבנות את הבקאנד, בסיס הנתונים והחיבור לפרונט. בכל שלב מפורטות המשימות, תוצרי הביניים והכישורים הנדרשים. אם אין ידע טכני – אפשר להעביר את המסמך למפתח/ת ולהצמד לסדר.

---

## שלב 0 – הכרות ותיעוד (2–3 ימים)
**מטרה:** ליצור מפה עסקית-טכנית מלאה לפני כתיבת קוד.
- לעבור על `DOCS/chat.txt` ולחלץ Use Cases: קליטת משלוח, ספירת מלאי, יצירת דרישת רכש, משיכות, התראות, ארכיון.
- להצליב עם `DOCS/DOS from APP/` (Pages + Functions + Entities) כדי להבין איזה מסך משתמש באילו פונקציות ובאילו ישויות.
- להפיק “מילון נתונים” – טבלה אחת שמרכזת ישות → שדות עיקריים → מקורות ב־CSV.
- לאשר עם בעל המוצר שהרשימה שלמה (מייל/פגישה קצרה).

**תוצר:** קובץ `DOCS/data-dictionary.xlsx` (או Google Sheet) שמכיל את כל הישויות והיחסים הבסיסיים.

---

## שלב 1 – תשתיות וסביבת פיתוח (1–2 ימים)
**מטרה:** ליצור פרויקט שרת מסודר שאפשר להריץ מקומית.
1. התקנת Node.js 20 ו־PostgreSQL 16 (אפשר גם Docker Desktop אם רוצים להריץ DB בקונטיינר).  
2. יצירת תיקייה `server/` במקביל ל־`src/`.  
3. הרצת הפקודות:
   ```bash
   cd server
   npm init -y
   npm install typescript ts-node-dev express cors dotenv zod prisma @prisma/client
   npx tsc --init
   npx prisma init
   ```
4. הגדרת קובץ `.env` עם מחרוזת חיבור ל־PostgreSQL (משתמש, סיסמה, שם DB flow_control).  
5. קביעת סקריפט `npm run dev:server` שמריץ `ts-node-dev src/app.ts`.

**תוצר:** פרויקט Node/TS רץ מקומית ב־`http://localhost:4000`.

**סטטוס 13.11.2025:** התקנתי את כל התלויות, יצרתי `server/` עם `tsconfig`, `prisma init`, סקריפטים (`npm run dev`, `npm run build`, `npm run start`) וקבצי `src/app.ts`, `src/server.ts`, וכן `.env.example`. `npm run build` עובר בהצלחה ומכין את `dist/`.

---

## שלב 2 – אפיון בסיס נתונים ו־ERD (3–4 ימים)
**מטרה:** לתרגם את הנתונים ל־schema מוגדר.
- פתיחת `prisma/schema.prisma` והגדרת מודלים לפי הישויות:  
  `Reagent`, `ReagentBatch`, `ReagentReceiptEvent`, `Shipment`, `ShipmentItem`, `Order`, `OrderItem`, `FrameworkOrder`, `WithdrawalRequest`, `InventoryTransaction`, `InventoryCountDraft`, `CompletedInventoryCount`, `Supplier`, `SupplierContact`, `DashboardNote`, `AlertRule`, `ActiveAlert`, `ArchivedData`, `SystemSettings` וכו’.  
- שימוש בקובצי ה־CSV כדי לאמת שמות שדות, סוגי נתונים ותאריכים.
- יצירת ERD (אפשר ב־draw.io או Prisma ERD Generator) שמציג קשרים (1:N, N:M).  
- קביעת אינדקסים: למשל אינדקס על `ReagentBatch(expiryDate)` כדי לאפשר התראות יעילות.
- קביעת enum לערכים חוזרים (קטגוריות פריטים, סוג הזמנה, סטטוס ספירת מלאי).

**תוצר:**  
1. ERD בקובץ `DOCS/erd.png`.  
2. `prisma/schema.prisma` שלם.  
3. `npx prisma migrate dev --name init`.

---

## שלב 3 – זריעת נתונים (2 ימים)
**מטרה:** להעמיס נתוני דמה מה־CSV לצורך בדיקות.
- יצירת תיקייה `server/scripts`.  
- כתיבת `scripts/seed.ts` שקורא את קובצי ה־CSV (ספריות מומלצות: `csv-parse`, `fs/promises`) וממפה אותם לישויות.  
- טיפול בתווים מיוחדים/קידוד (אם צריך להשתמש ב־`iconv-lite`).  
- הרצת `npx ts-node scripts/seed.ts`.  
- אימות ידני: `SELECT count(*) FROM "Reagent";` וכו’.

**תוצר:** בסיס נתונים עם נתונים ריאליים שממנו אפשר להדגים את המסכים.

---

## שלב 4 – שכבת שירותים (Service Layer) (5–7 ימים)
**מטרה:** לכתוב לוגיקה עסקית נקייה לפני חשיפת API.

הצעה למבנה תיקיות:
```
server/src/
  app.ts
  routes/
  controllers/
  services/
  repositories/
  jobs/
  middleware/
```

שירותים קריטיים:
1. **InventoryService** – חישוב מלאי נוכחי, יצירת `InventoryTransaction`, ניהול ספירות מלאי (draft/completed).  
2. **ShipmentService** – קליטת משלוחים, קישור להזמנות, יצירת אספקה מחזורית, תמיכה בצילום תעודות (שימור URL של קובץ).  
3. **OrderService** – דרישות רכש פתוחות/מסגרת, ניהול יתרות זמינות, משיכות, יצירת מסמכי הזמנה.  
4. **AlertService** – חישוב פגי תוקף (שבועיים קדימה), מלאי נמוך, אספקות קרובות, ספירות נדרשות.  
5. **ArchiveService** – העברת נתונים מעל שנתיים ל־`ArchivedData` ושחזור לפי צורך.  
6. **COAService** – ניהול מסמכי איכות (upload/download).

לכל שירות – כתיבת בדיקות יחידה עם Jest/Vitest.

---

## שלב 5 – משימות רקע והתראות (2–3 ימים)
**מטרה:** ליישם Jobs שמריצים אוטומטית את הלוגיקה.
- התקנת `node-cron` או שימוש ב־BullMQ (אם נדרש תור).  
- Job חצי-שעה: `alertsEngine` – מאתר ריאגנטים מתקרבים לתוקף, מלאי נמוך, אספקות בקרוב, ספירת מלאי חודשית.  
- Job יומי: `archiveOldData` – מעביר נתונים ל־Archive.  
- Job שבועי: `createAnnualReminders` / `summaryUpdates`.  
- כל Job יוצר רשומות ב־`ActiveAlert`/`DashboardNote` ומדווח ל־Activity Log.

---

## שלב 6 – שכבת API ו־Auth (4–5 ימים)
**מטרה:** לחשוף REST/GraphQL מאובטח.
- שימוש ב־Express + Zod ל־validation.  
- מסלולים לדוגמה:  
  - `GET /api/dashboard` – נתוני דשבורד מרוכזים.  
  - `POST /api/shipments` – קליטת משלוח.  
  - `POST /api/orders` + `POST /api/orders/:id/close`.  
  - `GET /api/reagents`, `PATCH /api/reagents/:id`.  
  - `POST /api/inventory-counts/draft`, `POST /api/inventory-counts/complete`.  
  - `POST /api/withdrawals`.  
  - `GET /api/alerts`, `POST /api/alerts/:id/resolve`.  
- הוספת Auth:  
  - JWT עם תפקידי משתמש (מנהלי מלאי, QA, קוראים בלבד).  
  - Middleware שמוודא הרשאות לפני פעולות מסוכנות (מחיקה, הזמנה).  
- לוג Audit – כל פעולה שנשלחת ב־API נרשמת בטבלת `ActivityLog`.

---

## שלב 7 – חיבור הפרונט (4–6 ימים)
**מטרה:** להחליף את הקריאות ל־`@base44/sdk` בקריאות לשרת החדש.
- כתיבת Wrapper ב־`src/api` עם `axios` או `fetch`.  
- לכל פונקציה קיימת (למשל `getDashboardData`, `calculateReplenishment`) למפות ל־endpoint המתאים.  
- בדיקה ידנית של כל מסך (Dashboard, InventoryCount, Orders, Shipments וכו’) לוודא שהנתונים מוצגים נכון ואין שגיאות קונסול.  
- הוספת Loader/Errors אחידים במידה והשרת לא זמין.  
- עדכון `.env` בפרונט עם `VITE_API_URL`.

---

## שלב 8 – בדיקות איכות ונתונים (5 ימים)
**מטרה:** להבטיח יציבות לפני חשיפה למשתמשים.
- **בדיקות יחידה** – services ו־repositories.  
- **בדיקות אינטגרציה** – להריץ `supertest` על endpoints העיקריים.  
- **בדיקות ידניות** – תסריטים מתוך `DOCS/chat.txt` (למשל “משיכת פריט עם יתרה מסגרת”).  
- **בדיקות נתונים** – להשוות ספירת מלאי/התראות מול Excel מקוריים.  
- יצירת GitHub Actions להרצת בדיקות אוטומטיות על כל Pull Request.

---

## שלב 9 – פריסה ותפעול (3–4 ימים)
**מטרה:** לעבור מסביבת פיתוח לסביבת בדיקות/ייצור.
- בחירת ענן (Render, Railway, Azure, AWS).  
- הגדרת שתי סביבות DB: Staging + Production.  
- שימוש ב־Prisma Migrate לפריסה.  
- הקמת תהליכי גיבוי יומיים ל־PostgreSQL + שמירת קבצים (COA, מסמכים) ב־S3/Blob Storage.  
- ניטור:  
  - אפליקציה: Grafana/Prometheus או APM (Datadog/NewRelic).  
  - לוגים: שימוש ב־Winston + שילוח ל־Logtail/CloudWatch.  
  - התראות תפעול: Slack/Email.

---

## שלב 10 – תיעוד והעברה ללקוח (2–3 ימים)
**מטרה:** לוודא שהצוות יודע לתחזק ולהרחיב.
- עדכון `DOCS/backend-work-plan.md` עם סטטוס התקדמות.  
- כתיבת מדריך `backend-setup.md` הכולל פקודות הרצה, קבצי env ודוגמאות curl.  
- יצירת “Runbook” לאירועים קריטיים (איך מוסיפים הזמנה ידנית, איך משחזרים נתונים מהארכיון).  
- הדרכה קצרה (וידאו/מפגש) למנהלי מערכת על מסכי התפעול החדשים.  
- תכנון Roadmap להמשך (לדוגמה תמיכה בשני בנקי דם במקביל).

---

## לוח זמנים משוער (אבן דרך כל שבוע)
| שבוע | אבני דרך מרכזיות |
|------|------------------|
| 1    | שלבים 0–1 הושלמו, סביבת פיתוח רצה. |
| 2    | סכמה ו־ERD מוכנים (שלב 2). |
| 3    | זרעים ו־Services בסיסיים (שלבים 3–4). |
| 4    | Jobs ו־API ראשוני (שלבים 5–6). |
| 5    | חיבור פרונט ו־בדיקות אינטגרציה (שלבים 7–8). |
| 6    | פריסה, תיעוד והדרכה (שלבים 9–10). |

*הזמנים תלויים בכוח אדם; אם יש יותר ממפתח/ת אחד/ת אפשר להקביל בין שלבים 4–6.*

---

## מה הלאה?
1. לאשר את התוכנית מול בעלי העניין.  
2. למנות אחראי/ת לכל שלב ולקבוע תאריכי יעד.  
3. להתחיל בשלב 0 ולסמן התקדמות בתוך הקובץ הזה או בכלי ניהול משימות (Jira, Linear, Monday).  
4. לעדכן את `DOCS/system-and-backend-plan.md` עם החלטות חדשות (שינויים בישויות, לוגיקות).

---

## עדכון מקור מרכזי
הקובץ `DOCS/התכתבות Flow Control  10.11.25.txt` הוא גרסת הצ'אט המעודכנת ונחשב לעכשיו למקור הסופי של כל הלוגיקה, הדרישות והדיאגרמות שצריך לתרגם לבקאנד.  

בהצלחה! אם צריך פירוק נוסף של אחד השלבים (למשל כתיבת schema או דוגמת קוד לשירות), ציין זאת ואכין מסמך ייעודי.
