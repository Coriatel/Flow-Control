# Flow Control - מדריך פרומפטים להמשך הפרויקט

## אסטרטגיית שימוש במודלים

| משימה | מודל מומלץ | סיבה |
|-------|------------|------|
| תכנון ארכיטקטורה | **Opus** | דורש הבנה עמוקה |
| כתיבת קוד מורכב | **Opus** / **Sonnet** | איזון איכות/עלות |
| תיקוני באגים פשוטים | **Sonnet** | מהיר ויעיל |
| Refactoring | **Sonnet** | משימות טכניות |
| בדיקות ודוקומנטציה | **Haiku** | חסכוני למשימות פשוטות |
| שאלות מהירות | **Haiku** | תשובות מיידיות |

---

## שלב 1: חיבור Frontend ל-Backend (Sonnet)

### פרומפט 1.1 - ניתוח התלות ב-Base44
```
Model: Sonnet

בדוק את הקוד בתיקיית src/ ומצא את כל המקומות שמשתמשים ב-@base44/sdk.
צור רשימה מסודרת של:
1. כל הקבצים שמייבאים את ה-SDK
2. אילו פונקציות/hooks משמשים מה-SDK
3. מה הפונקציונליות שכל אחד מספק

אל תשנה קוד, רק תעד.
```

### פרומפט 1.2 - יצירת API Client
```
Model: Sonnet

צור קובץ src/api/client.ts שיחליף את @base44/sdk.
הקובץ צריך לכלול:
1. Axios instance עם base URL מ-VITE_API_URL
2. Interceptors לטיפול בשגיאות
3. פונקציות עזר: get, post, put, delete
4. TypeScript types מלאים

השתמש בתבנית:
- src/api/client.ts - הליבה
- src/api/types.ts - טיפוסים
- src/api/index.ts - export
```

### פרומפט 1.3 - המרת מסך אחד (Pilot)
```
Model: Sonnet

המר את src/pages/ManageSuppliers.jsx לעבוד עם ה-API החדש במקום Base44.
1. החלף את ה-imports מ-@base44/sdk ל-src/api
2. עדכן את ה-hooks לקרוא ל-API שלנו
3. וודא שהטיפול בשגיאות עובד
4. שמור על כל הפונקציונליות הקיימת

זה מסך פיילוט - תעד את התהליך לשימוש חוזר.
```

### פרומפט 1.4 - המרה המונית (Haiku + Sonnet)
```
Model: Haiku (לסקריפט), Sonnet (לביצוע)

Haiku prompt:
צור רשימה של כל 52 קבצי pages שצריכים המרה, מסודרים לפי עדיפות:
1. עדיפות גבוהה - מסכים תפעוליים יומיומיים
2. עדיפות בינונית - מסכי ניהול
3. עדיפות נמוכה - הגדרות ודוחות

Sonnet prompt (לכל קבוצה):
המר את הקבצים הבאים מ-Base44 ל-API מקומי:
[רשימת קבצים]
השתמש באותה תבנית שנוצרה ב-ManageSuppliers.
```

---

## שלב 2: Authentication (Opus לתכנון, Sonnet לביצוע)

### פרומפט 2.1 - תכנון מערכת הרשאות
```
Model: Opus

תכנן מערכת Authentication ו-Authorization עבור Flow Control:

דרישות:
- JWT tokens עם refresh
- 4 רמות הרשאה: ADMIN, MANAGER, USER, READONLY
- Session management
- Remember me

ספק:
1. ארכיטקטורה מלאה
2. Flow diagrams (בטקסט)
3. רשימת endpoints
4. Database changes needed
5. Frontend integration plan

זה תכנון בלבד - אל תכתוב קוד.
```

### פרומפט 2.2 - Backend Auth Implementation
```
Model: Sonnet

מימוש Authentication בצד שרת:

1. צור middleware/auth.ts עם:
   - verifyToken
   - requireRole(roles[])
   - refreshToken logic

2. צור routes/auth.ts עם:
   - POST /auth/login
   - POST /auth/logout
   - POST /auth/refresh
   - GET /auth/me

3. עדכן את User model ב-Prisma עם:
   - passwordHash
   - refreshToken
   - lastLoginAt

4. הוסף bcrypt ו-jsonwebtoken

השתמש בתבניות הקיימות בפרויקט.
```

### פרומפט 2.3 - Frontend Auth
```
Model: Sonnet

מימוש Authentication בצד לקוח:

1. צור src/contexts/AuthContext.tsx:
   - login, logout, refreshToken
   - user state
   - isAuthenticated, hasRole

2. צור src/components/auth/:
   - LoginForm.tsx
   - ProtectedRoute.tsx
   - RoleGuard.tsx

3. עדכן App.jsx לעטוף ב-AuthProvider
4. הוסף login page
5. הגן על כל ה-routes

בדוק עם ManageSuppliers כ-pilot.
```

---

## שלב 3: File Upload - COA Documents (Sonnet)

### פרומפט 3.1 - Backend File Upload
```
Model: Sonnet

הוסף תמיכה בהעלאת קבצים:

1. התקן multer
2. צור routes/files.ts:
   - POST /files/upload
   - GET /files/:id
   - DELETE /files/:id

3. צור services/fileService.ts:
   - saveFile (local storage לפיתוח)
   - getFile
   - deleteFile

4. עדכן ReagentBatch model להכיל coaFileId

הגבלות: PDF בלבד, עד 10MB
```

### פרומפט 3.2 - Frontend File Upload
```
Model: Sonnet

עדכן את UploadCOA.jsx:
1. הוסף drag & drop
2. הצג preview של PDF
3. שמור דרך ה-API החדש
4. הצג סטטוס העלאה
5. קשר ל-batch הנכון

השתמש ב-react-dropzone.
```

---

## שלב 4: Testing (Haiku לפשוטים, Sonnet למורכבים)

### פרומפט 4.1 - הגדרת סביבת בדיקות
```
Model: Haiku

הגדר Jest + React Testing Library:
1. התקן dependencies
2. צור jest.config.js
3. צור setupTests.ts
4. הוסף scripts ל-package.json
5. צור תבנית בסיסית לבדיקה
```

### פרומפט 4.2 - בדיקות API
```
Model: Sonnet

כתוב בדיקות ל-server/src/routes:
1. בדיקות לכל endpoint
2. בדיקות הרשאות
3. בדיקות validation
4. Mock database

השתמש ב-supertest.
תיקייה: server/tests/
```

### פרומפט 4.3 - בדיקות Frontend
```
Model: Sonnet

כתוב בדיקות ל-3 קומפוננטות מרכזיות:
1. Dashboard - בדיקת הצגת נתונים
2. ManageSuppliers - בדיקת CRUD
3. LoginForm - בדיקת טופס

תיקייה: src/__tests__/
```

---

## שלב 5: Deployment (Sonnet)

### פרומפט 5.1 - Docker Production
```
Model: Sonnet

עדכן את docker-compose.prod.yml:
1. הוסף nginx כ-reverse proxy
2. הגדר SSL עם Let's Encrypt
3. הוסף health checks
4. הגדר logging
5. הוסף backup automation

צור גם:
- .dockerignore
- nginx/nginx.conf
- scripts/backup.sh
```

### פרומפט 5.2 - CI/CD Pipeline
```
Model: Sonnet

צור .github/workflows/deploy.yml:
1. בדיקות על PR
2. Build על push to main
3. Deploy אוטומטי ל-production
4. Notifications על כשלון

Secrets needed:
- DOCKER_HUB_TOKEN
- SERVER_SSH_KEY
- SLACK_WEBHOOK
```

---

## שלב 6: אופטימיזציות (Haiku לבדיקה, Sonnet לתיקון)

### פרומפט 6.1 - Performance Audit
```
Model: Haiku

בדוק ביצועים:
1. הרץ npm run build ותעד את הגדלים
2. זהה קבצים גדולים ב-bundle
3. בדוק lazy loading
4. רשום המלצות לשיפור

אל תשנה קוד, רק דווח.
```

### פרומפט 6.2 - Performance Fixes
```
Model: Sonnet

מימוש אופטימיזציות:
1. הוסף React.lazy לכל הדפים
2. הוסף Suspense עם loading states
3. פצל vendor chunks ב-vite.config
4. הוסף caching headers בשרת
```

---

## טיפים לשימוש יעיל

### מתי להשתמש ב-Opus
- תכנון ארכיטקטורה מורכבת
- החלטות עיצוב קריטיות
- Debug של בעיות מסובכות
- Code review מקיף

### מתי להשתמש ב-Sonnet
- כתיבת קוד חדש
- Refactoring
- תיקון באגים
- המרות והתאמות

### מתי להשתמש ב-Haiku
- שאלות מהירות
- יצירת רשימות
- בדיקות פשוטות
- תיעוד בסיסי
- scaffolding

### טיפ כללי
```
כשמתחילים משימה גדולה:
1. Haiku - לפרק למשימות קטנות
2. Opus - לתכנן את הארכיטקטורה
3. Sonnet - לביצוע בפועל
4. Haiku - לבדיקה ותיעוד
```

---

## סדר עדיפויות מומלץ

| # | משימה | מודל | זמן משוער |
|---|--------|------|-----------|
| 1 | חיבור API (pilot) | Sonnet | 1 שעה |
| 2 | חיבור API (כל המסכים) | Sonnet | 4-6 שעות |
| 3 | Authentication | Opus+Sonnet | 3-4 שעות |
| 4 | File Upload | Sonnet | 2 שעות |
| 5 | Testing | Haiku+Sonnet | 3-4 שעות |
| 6 | Deployment | Sonnet | 2 שעות |
| 7 | Performance | Haiku+Sonnet | 1-2 שעות |

**סה"כ משוער: 16-21 שעות עבודה**

---

## דוגמה לשיחה יעילה

```
Session 1 (Sonnet, 1 hour):
"נתח את התלות ב-Base44 וצור API client חדש"

Session 2 (Sonnet, 2 hours):
"המר את 10 המסכים הראשונים ברשימה ל-API החדש"

Session 3 (Sonnet, 2 hours):
"המר את שאר המסכים"

Session 4 (Opus, 30 min):
"תכנן את מערכת ה-Authentication"

Session 5 (Sonnet, 2 hours):
"ממש את ה-Authentication לפי התוכנית"

...וכן הלאה
```

---

*נוצר: דצמבר 2025*
