# Flow Control - Prompt for Sonnet (Claude Code / Web)

**תאריך יצירה:** 25 דצמבר 2025
**מסמך זה:** הוראות עבודה ל-Claude Sonnet בסביבת Claude Code (Web)
**קשור ל:** [WORK_PLAN.md](./WORK_PLAN.md)

---

## 🎯 מטרת הפרומפט

פרומפט זה מספק לך את כל ההקשר הדרוש להמשיך את פיתוח פרויקט Flow Control מהנקודה שבה הפסקנו.

---

## 📚 הקשר כללי - מה זה Flow Control?

**Flow Control** הוא מערכת ניהול מלאי למעבדת בנק דם, עם:
- **Frontend:** React 18 + Vite, 51 דפים, 35,256 שורות קוד
- **Backend:** Express 5.1 + TypeScript, 17 API routes, JWT auth
- **Database:** PostgreSQL + Prisma, 27 models, 16 enums
- **Status:** 70% מוכן לפרודקשן

---

## 📖 סיכום השיחה הקודמת (Context)

### מה בוצע עד כה:

#### 1. סקירת פרויקט מקיפה ✅
- ניתחתי את כל מבנה הפרויקט
- סקרתי 20 commits אחרונים
- בדקתי 2 שיחות קודמות
- זיהיתי מה עובד ומה חסר

#### 2. יצירת WORK_PLAN.md ✅
**קובץ מרכזי:** `/home/user/Flow-Control/WORK_PLAN.md` (565 שורות)

המסמך כולל:
- חלוקת משימות לפי סביבות (Claude Code / Cursor)
- תכנון לפי מודלים (Opus / Sonnet / Haiku)
- תוכניות עבודה שבועיות
- מדדי הצלחה
- בעיות ידועות ופתרונות

#### 3. עדכון README.md ✅
- הוספתי קישור בולט ל-WORK_PLAN.md
- הפך למסמך כניסה ראשי

#### 4. בדיקת Git & Branches ✅
- וידאתי שאין בעיות מיזוג
- אין conflicts
- אין duplicates בעייתיים
- הכל נדחף לענף: `claude/work-plan-PhINX`

---

## 🎯 מה נשאר לעשות - תוכנית מיידית

### 🔴 משימות קריטיות (Priority 1)

#### 1. Frontend Authentication UI
**זמן משוער:** 2-3 שעות
**קבצים ליצירה:**
```
src/contexts/AuthContext.jsx
src/pages/Login.jsx
src/pages/Register.jsx
src/components/ProtectedRoute.jsx
src/pages/Unauthorized.jsx
```

**דרישות:**
- AuthContext עם login(), logout(), register(), currentUser
- Login page עם form validation (React Hook Form + Zod)
- Register page עם password strength validation
- ProtectedRoute wrapper לroutes מוגנים
- Integration עם `/api/auth/*` endpoints קיימים

**חשוב:** Backend auth routes כבר מוכנים ב-`server/src/routes/auth.ts`!

#### 2. עדכון App.jsx
**זמן משוער:** 30 דקות
**שינויים נדרשים:**
```javascript
// Import AuthProvider
import { AuthProvider } from '@/contexts/AuthContext';

// Wrap app
<AuthProvider>
  <App />
</AuthProvider>

// Setup protected routes
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* כל שאר הroutes */}
  </Route>
</Routes>
```

#### 3. API Client Review & Enhancement
**זמן משוער:** 1 שעה
**קובץ:** `src/api/client.js`

**בדוק:**
- ✓ Token management (localStorage)
- ✓ Automatic token inclusion בheaders
- ✓ Token refresh logic
- ✓ Error handling (401, 403, 500)
- ✓ Request/Response interceptors

---

### 🟡 משימות חשובות (Priority 2)

#### 4. API Documentation
**זמן משוער:** 2-3 שעות
**קובץ חדש:** `docs/API_DOCUMENTATION.md`

**כולל:**
- רשימת כל 17 ה-routes
- Request/Response examples
- Error codes documentation
- Authentication flow
- File upload documentation

#### 5. Error Boundary Component
**זמן משוער:** 1 שעה
**קובץ חדש:** `src/components/ErrorBoundary.jsx`

```javascript
class ErrorBoundary extends React.Component {
  // Catch React errors
  // Display fallback UI
  // Log errors to console/service
}
```

#### 6. Security Audit
**זמן משוער:** 2 שעות

**בדוק:**
- כל ה-API routes מוגנים?
- Input validation בכל endpoint?
- XSS protection?
- CSRF protection?
- Rate limiting מוגדר?
- Secrets לא בקוד?

---

### 🟢 משימות משניות (Priority 3)

#### 7. Code Review
**בדוק:**
- 51 דפי Frontend - consistency
- Import statements - optimization
- Unused variables/imports
- Performance issues
- Best practices

#### 8. Documentation Updates
- עדכון PROJECT_STATUS.md
- עדכון PRODUCTION_READINESS_REPORT.md
- הוספת examples ל-README

---

## 💻 יכולות Claude Code (Web) - מה אתה יכול לעשות

### ✅ מה שאתה יכול:
1. **קריאת קבצים** - כל הפרויקט
2. **כתיבת קוד** - Components, utilities, types
3. **עריכת קבצים** - שיפורים, bug fixes
4. **יצירת תיעוד** - Markdown files
5. **Code Review** - ניתוח ושיפורים
6. **Git operations** - commit, branch (לא push ל-main)

### ❌ מה שאתה לא יכול:
1. **npm install** - אין גישה להתקנת packages
2. **Prisma generate** - דורש download של engines
3. **הרצת servers** - dev server או database
4. **Testing** - הרצת tests
5. **Build** - הרצת vite build

---

## 📋 הנחיות עבודה

### קבצים מרכזיים לקריאה:
1. **WORK_PLAN.md** - תוכנית מרכזית (חובה!)
2. **README.md** - מידע כללי
3. **PROJECT_STATUS.md** - מצב נוכחי
4. **docs/PRODUCTION_READINESS_REPORT.md** - מה חסר לפרודקשן
5. **docs/API_MIGRATION_SUMMARY.md** - מיגרציית API שבוצעה

### לפני שמתחיל משימה:
1. ✅ קרא את WORK_PLAN.md
2. ✅ בדוק שהמשימה מתאימה ל-Claude Code (לא דורשת הרצה)
3. ✅ השתמש ב-TodoWrite לניהול משימות
4. ✅ עדכן את הסטטוס ב-WORK_PLAN.md אחרי השלמה

### בזמן עבודה:
1. ✅ שמור על consistency עם הקוד הקיים
2. ✅ השתמש ב-TypeScript types כשאפשר
3. ✅ הוסף comments רק למקומות מורכבים
4. ✅ בדוק validation על כל input
5. ✅ טפל ב-errors בצורה נכונה

### אחרי השלמת משימה:
1. ✅ סמן ✓ ב-WORK_PLAN.md
2. ✅ עשה commit ברור עם הודעה תיאורית
3. ✅ עדכן PROJECT_STATUS.md אם נדרש
4. ✅ דווח למשתמש מה הושלם

---

## 🚀 איך להתחיל - Quick Start

### אופציה 1: Frontend Auth UI (מומלץ!)

```bash
# קרא קודם:
Read: src/api/client.js
Read: server/src/routes/auth.ts
Read: src/pages/Dashboard.jsx (לדוגמה)

# אז צור:
1. src/contexts/AuthContext.jsx
2. src/pages/Login.jsx
3. src/pages/Register.jsx
4. src/components/ProtectedRoute.jsx

# ואז עדכן:
5. src/App.jsx
```

**התחל עם:**
```
אני רוצה ליצור את ה-Frontend Authentication UI.
אנא התחל עם AuthContext.jsx.
```

### אופציה 2: API Documentation

```bash
# קרא:
Read: server/src/routes/*.ts (כל הroutes)
Read: server/src/middleware/auth.ts

# צור:
docs/API_DOCUMENTATION.md
```

**התחל עם:**
```
אני רוצה ליצור API Documentation מקיף.
אנא סקור את כל הroutes והתחל ליצור את המסמך.
```

### אופציה 3: Security Audit

```bash
# קרא:
Read: server/src/middleware/security.ts
Read: server/src/routes/*.ts
Read: server/src/app.ts

# צור:
docs/SECURITY_AUDIT_REPORT.md
```

**התחל עם:**
```
אני רוצה לבצע Security Audit.
אנא בדוק את כל הroutes והמידלוור.
```

---

## 📊 מדדי הצלחה

### MVP (Minimum Viable Product):
- ✅ Frontend Auth UI מלא
- ✅ כל 51 הדפים מוגנים
- ✅ API Documentation מלא
- ✅ Security audit passed
- ✅ Code review completed

### הגדרת "Done":
משימה נחשבת הושלמה רק כאשר:
1. ✅ הקוד נכתב ונבדק (קריאה)
2. ✅ עבר validation בסיסי (syntax)
3. ✅ תועד ב-WORK_PLAN.md
4. ✅ נעשה commit עם הודעה ברורה
5. ✅ נוסף ל-TODO list או סומן כהושלם

---

## 🎨 Code Style Guidelines

### React Components:
```javascript
// Good
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');

  // Component logic

  return (
    <div className="container mx-auto">
      {/* JSX */}
    </div>
  );
}
```

### API Calls:
```javascript
// Good - using api/entities
import { User } from '@/api/entities';

const handleLogin = async () => {
  try {
    const response = await User.login(email, password);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### Error Handling:
```javascript
// Good
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Error fetching data:', error);
  toast.error('Failed to fetch data');
  throw error; // Re-throw if needed
}
```

---

## 🔐 Security Considerations

### Important Rules:
1. ✅ Never hardcode secrets
2. ✅ Always validate user input
3. ✅ Use prepared statements (Prisma does this)
4. ✅ Sanitize HTML output
5. ✅ Check authentication before protected operations
6. ✅ Use HTTPS in production
7. ✅ Implement rate limiting
8. ✅ Hash passwords (bcrypt)
9. ✅ Use secure cookies for tokens
10. ✅ Validate file uploads

---

## 📁 מבנה פרויקט - Quick Reference

```
Flow-Control/
├── src/                          # Frontend
│   ├── pages/                    # 51 דפים
│   ├── components/               # Components
│   ├── contexts/                 # Context providers
│   ├── api/                      # API client
│   │   ├── client.js            # HTTP client
│   │   ├── entities.js          # Entity operations
│   │   └── functions.js         # Server functions
│   ├── hooks/                    # Custom hooks
│   └── utils/                    # Utilities
│
├── server/                       # Backend
│   ├── src/
│   │   ├── routes/              # 17 API routes
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth, validation, etc.
│   │   └── types/               # TypeScript types
│   └── prisma/
│       └── schema.prisma        # Database schema
│
├── docs/                         # Documentation
│   ├── API_MIGRATION_SUMMARY.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   └── PRODUCTION_READINESS_REPORT.md
│
├── WORK_PLAN.md                 # תוכנית מרכזית ⭐
├── README.md                     # מידע כללי
├── PROJECT_STATUS.md             # מצב נוכחי
└── PROMPT_FOR_SONNET.md         # המסמך הזה
```

---

## 🤝 עבודה עם Git

### Branch Naming:
```bash
claude/feature-name-SessionID
```

### Commit Messages:
```bash
feat: add authentication context
fix: resolve login validation issue
docs: update API documentation
refactor: improve error handling
style: format code with prettier
```

### Workflow:
```bash
# 1. בדוק מצב
git status

# 2. הוסף קבצים
git add [files]

# 3. Commit
git commit -m "feat: descriptive message"

# 4. Push לענף
git push -u origin claude/feature-name-SessionID
```

**חשוב:** לא ניתן לדחוף ישירות ל-main (protected). תמיד עבוד על ענף ו-PR.

---

## 📞 תקשורת עם המשתמש

### דיווח על התקדמות:
```markdown
## התקדמות - [שם משימה]

✅ הושלם:
- [X] משימה 1
- [X] משימה 2

🔄 בביצוע:
- [ ] משימה 3 (50%)

📝 הבא:
- [ ] משימה 4
- [ ] משימה 5
```

### שאלות למשתמש:
אם משהו לא ברור, שאל:
```
יש לי שאלת הבהרה לגבי [נושא]:
1. האם [אופציה 1]?
2. או שמא [אופציה 2]?

מה עדיף לדעתך?
```

---

## 🎯 משימות ספציפיות לסונט

### משימות מתאימות ל-Sonnet (200K tokens):

#### 1. Frontend Features (טוב ל-Sonnet)
- ✅ יצירת components בודדים
- ✅ עריכת pages קיימים
- ✅ הוספת validation
- ✅ שיפור error handling

#### 2. Refactoring (טוב ל-Sonnet)
- ✅ שיפור structure של modules
- ✅ Code cleanup
- ✅ Performance improvements (code level)
- ✅ Import optimization

#### 3. Documentation (מצוין ל-Sonnet)
- ✅ API documentation
- ✅ Component documentation
- ✅ Usage examples
- ✅ Troubleshooting guides

#### 4. Code Review (טוב ל-Sonnet)
- ✅ Review של קבצים ספציפיים
- ✅ Security review
- ✅ Best practices check
- ✅ Performance review

### משימות פחות מתאימות (השאר ל-Opus):
- ❌ תכנון ארכיטקטורה מורכב
- ❌ סקירה של כל הפרויקט
- ❌ החלטות אסטרטגיות

---

## 📚 קבצים חשובים לקריאה לפני התחלה

### חובה (Must Read):
1. **WORK_PLAN.md** - תוכנית מרכזית
2. **README.md** - סקירה כללית
3. **src/api/client.js** - API client implementation
4. **src/api/entities.js** - Entity operations

### מומלץ:
5. **PROJECT_STATUS.md** - מצב נוכחי
6. **docs/PRODUCTION_READINESS_REPORT.md** - מה חסר
7. **server/src/routes/auth.ts** - Auth endpoints
8. **server/src/middleware/auth.ts** - Auth middleware

### לפי צורך:
9. **docs/API_MIGRATION_SUMMARY.md** - מיגרציה שבוצעה
10. **docs/IMPLEMENTATION_SUMMARY.md** - סיכום יישום

---

## 🎓 למידה מהפרויקט

### דפוסים בשימוש:

#### React Patterns:
```javascript
// Custom hooks
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Protected routes
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

#### API Patterns:
```javascript
// Entity operations
import { Reagent } from '@/api/entities';

// List all
const reagents = await Reagent.list();

// Get by ID
const reagent = await Reagent.get(id);

// Create
await Reagent.create(data);

// Update
await Reagent.update(id, data);

// Delete
await Reagent.delete(id);
```

#### Error Handling Patterns:
```javascript
// Frontend
try {
  const data = await fetchData();
  toast.success('Success!');
} catch (error) {
  console.error(error);
  toast.error(error.message || 'Something went wrong');
}

// Backend (already implemented)
throw new AppError('Error message', 400);
```

---

## 🚨 בעיות ידועות

### 1. Prisma Engine Download
**בעיה:** Claude Code לא יכול להוריד Prisma engines
**פתרון:** יש enum fallbacks ב-`server/src/types/index.ts`
**Impact:** רק על compilation, לא על code writing

### 2. Base44 SDK Dependency
**בעיה:** Frontend עדיין משתמש ב-@base44/sdk בחלקים
**סטטוס:** רוב המיגרציה הושלמה (25 קבצים)
**TODO:** וידוא שכל הקריאות עוברות לbackend מקומי

### 3. No Tests
**בעיה:** 0% test coverage
**סטטוס:** Jest מוגדר אבל אין tests
**TODO:** כתיבת tests (לא ב-Claude Code, רק תכנון)

---

## 💡 טיפים לעבודה יעילה

### 1. השתמש ב-TodoWrite
```javascript
// תמיד עדכן את ה-TODO list
TodoWrite({
  todos: [
    {content: "Create AuthContext", status: "in_progress", activeForm: "Creating AuthContext"},
    {content: "Create Login page", status: "pending", activeForm: "Creating Login page"}
  ]
})
```

### 2. קרא קבצים דומים
לפני שיוצר component חדש, קרא component דומה קיים:
```bash
Read: src/pages/Dashboard.jsx  # לדוגמה של page
Read: src/components/ui/button.jsx  # לדוגמה של component
```

### 3. שמור consistency
השתמש באותם:
- Import statements
- Naming conventions
- File structure
- Error handling patterns

### 4. בדוק validation
כל input מהמשתמש צריך:
- Validation (Zod)
- Sanitization
- Error handling

---

## ✅ Checklist לכל משימה

לפני שמתחיל:
- [ ] קראתי את WORK_PLAN.md
- [ ] הבנתי את המשימה
- [ ] המשימה מתאימה ל-Claude Code
- [ ] יצרתי TODO list

בזמן עבודה:
- [ ] קראתי קבצים רלוונטיים
- [ ] שומר על consistency
- [ ] מוסיף validation
- [ ] מטפל ב-errors
- [ ] מעדכן TODO list

אחרי סיום:
- [ ] הקוד עובד (בדיקה ויזואלית)
- [ ] אין syntax errors
- [ ] עשיתי commit
- [ ] עדכנתי WORK_PLAN.md
- [ ] דיווחתי למשתמש

---

## 🎯 סיכום - התחל כאן!

### הפעולה הראשונה שלך צריכה להיות:

1. **קרא:** `WORK_PLAN.md` (חובה!)
2. **בחר:** משימה מרשימת Priority 1
3. **יצור:** TODO list עם TodoWrite
4. **התחל:** כתיבת קוד!

### המשימה המומלצת ביותר:
**Frontend Authentication UI** - קריטי, מתאים ל-Sonnet, יש impact גבוה

### איך להתחיל:
```
אני רוצה להתחיל עם Frontend Authentication UI.
קראתי את WORK_PLAN.md והבנתי את המשימה.
אתחיל עם יצירת AuthContext.jsx - תקרא לי קודם את:
1. src/api/client.js
2. server/src/routes/auth.ts
3. src/pages/Dashboard.jsx (לדוגמה)

ואז אצור את AuthContext עם כל הפונקציות הנדרשות.
```

---

**בהצלחה! אתה מוכן להתחיל! 🚀**

**זכור:** WORK_PLAN.md הוא מקור האמת. כל פעם שיש ספק - תחזור אליו.

---

**עדכון אחרון:** 25 דצמבר 2025
**גרסה:** 1.0
**נכתב על ידי:** Claude Opus 4.5
**מיועד ל:** Claude Sonnet בסביבת Claude Code (Web)
