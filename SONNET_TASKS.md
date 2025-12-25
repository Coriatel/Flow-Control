# Flow Control - משימות להשלמה (Sonnet)

## ✅ מצב עדכני (דצמבר 2024)

### מה מוזג ל-main:
- ✅ **PR #12** - תיקון TypeScript build ותיעוד Prisma
- ✅ **PR #11** - Backend production setup מלא
- ✅ **PR #9** - Backend API, validation, security, logging
- ✅ כל ה-API endpoints (CRUD + workflows)
- ✅ Zod validation לכל routes
- ✅ Rate limiting + Helmet security
- ✅ Pino structured logging
- ✅ JWT authentication + Role-based access
- ✅ TypeScript build עובר (`npm run build`)

### ⚠️ מה לא עובד ב-Claude Code:
- ❌ `npx prisma generate` - בעיית רשת (403 Forbidden)
- ❌ Tests לא רצים בלי Prisma engines
- ℹ️ **למה?** Claude Code רץ ב-sandbox מוגבל שחוסם הורדת binaries חיצוניים

---

## 🌐 איך להריץ Prisma? (סביבות שעובדות)

### אופציה 1: GitHub Codespaces ⭐ (מומלץ)
```bash
# 1. פתח את הrepo ב-GitHub
# 2. לחץ "Code" → "Codespaces" → "Create codespace"
# 3. בטרמינל:
cd server
npm install
npx prisma generate  # ✅ יעבוד!
npm run build
npm test
```

### אופציה 2: GitHub Actions (CI/CD)
צור `.github/workflows/test.yml`:
```yaml
name: Backend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: flow_control_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Generate Prisma Client
        working-directory: ./server
        run: npx prisma generate

      - name: Run migrations
        working-directory: ./server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/flow_control_test
        run: npx prisma migrate deploy

      - name: Build
        working-directory: ./server
        run: npm run build

      - name: Run tests
        working-directory: ./server
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/flow_control_test
          JWT_SECRET: test-secret-key-min-32-chars
        run: npm test
```

### אופציה 3: מחשב מקומי
```bash
# מערכת שלך עם אינטרנט רגיל
cd server
npm install
npx prisma generate  # ✅ יעבוד!
npm run build
npm test
```

### אופציה 4: Docker
```bash
# התקנת Docker ב-Hostinger/VPS
docker-compose up -d
docker exec -it flow-control-server npm run prisma:generate
```

---

## 📋 משימות הבאות (לפי עדיפות)

### 1️⃣ הרצת Tests (בסביבה תקינה)
**איפה:** GitHub Codespaces / מקומי / GitHub Actions

```bash
cd server
npx prisma generate
npm run build
npm test
```

**מטרה:** לוודא שכל הtests עוברים ✅

---

### 2️⃣ הוספת E2E Tests עם Playwright (אופציונלי)

**התקנה:**
```bash
npm install -D @playwright/test
npx playwright install
mkdir -p e2e
```

**צור `e2e/api.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:4000/api';

test.describe('API Health', () => {
  test('health check returns ok', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('Reagents API', () => {
  test('GET /reagents returns list', async ({ request }) => {
    const response = await request.get(`${API_URL}/reagents`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

test.describe('Auth API', () => {
  test('login with invalid credentials returns 401', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'invalid@test.com', password: 'wrong' }
    });
    expect(response.status()).toBe(401);
  });
});
```

**הוסף ל-`package.json`:**
```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

---

### 3️⃣ הוספת File Upload עם Multer (קבצי COA)

**התקנה:**
```bash
npm install multer @types/multer
```

**צור `server/src/middleware/upload.ts`:**
```typescript
import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

// הגדרת אחסון
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/coa');  // תיקיית COA documents
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  }
});

// פילטר קבצים
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF and images allowed', 400));
  }
};

// יצירת middleware
export const uploadCOA = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB
  },
  fileFilter
});

// Single file upload
export const uploadSingle = uploadCOA.single('file');

// Multiple files upload
export const uploadMultiple = uploadCOA.array('files', 5);
```

**הוסף route ל-`server/src/routes/batches.ts`:**
```typescript
import { uploadSingle } from '../middleware/upload';

// Upload COA for batch
router.post('/:id/coa', uploadSingle, async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    // עדכן batch עם נתיב הקובץ
    await prisma.reagentBatch.update({
      where: { id },
      data: {
        coaDocumentPath: file.path,
        coaDocumentName: file.originalname
      }
    });

    res.json({
      success: true,
      data: {
        filename: file.filename,
        path: file.path,
        size: file.size
      }
    });
  } catch (error) {
    next(error);
  }
});
```

**צור תיקייה:**
```bash
mkdir -p uploads/coa
```

**הוסף ל-`.gitignore`:**
```
uploads/
!uploads/.gitkeep
```

---

### 4️⃣ הוספת Email Notifications (אופציונלי)

**התקנה:**
```bash
npm install nodemailer @types/nodemailer
```

**צור `server/src/utils/email.ts`:**
```typescript
import nodemailer from 'nodemailer';
import { logger } from './logger';

// יצירת transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// שליחת מייל
export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string
) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Flow Control <noreply@flowcontrol.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    });

    logger.info({ messageId: info.messageId }, `Email sent to ${to}`);
    return info;
  } catch (error) {
    logger.error({ error }, 'Failed to send email');
    throw error;
  }
};

// תבניות מייל
export const emailTemplates = {
  expiryWarning: (reagentName: string, batchNumber: string, daysLeft: number) => ({
    subject: `⚠️ התראת תפוגה - ${reagentName}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>התראת תפוגה קרובה</h2>
        <p><strong>ריאגנט:</strong> ${reagentName}</p>
        <p><strong>אצווה:</strong> ${batchNumber}</p>
        <p><strong>זמן לתפוגה:</strong> ${daysLeft} ימים</p>
        <p>יש לבדוק את המלאי ולהזמין תחליף במידת הצורך.</p>
      </div>
    `
  }),

  lowStock: (reagentName: string, currentQuantity: number, minQuantity: number) => ({
    subject: `📉 מלאי נמוך - ${reagentName}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>התראת מלאי נמוך</h2>
        <p><strong>ריאגנט:</strong> ${reagentName}</p>
        <p><strong>כמות נוכחית:</strong> ${currentQuantity}</p>
        <p><strong>כמות מינימלית:</strong> ${minQuantity}</p>
        <p>יש להזמין מלאי נוסף בהקדם.</p>
      </div>
    `
  })
};
```

**דוגמה לשימוש ב-alert service:**
```typescript
import { sendEmail, emailTemplates } from '../utils/email';

// כשיוצרים התראת תפוגה
const template = emailTemplates.expiryWarning(
  reagent.name,
  batch.batchNumber,
  daysUntilExpiry
);

await sendEmail(
  'lab-manager@example.com',
  template.subject,
  template.html
);
```

**הוסף ל-`.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Flow Control <noreply@flowcontrol.com>"
```

---

### 5️⃣ פריסה לפרודקשן

ראה `HOSTINGER_DEPLOYMENT.md` להוראות מפורטות.

**תהליך מהיר:**
```bash
# 1. Push ל-GitHub
git push origin main

# 2. Connect SSH לHostinger
ssh user@your-server.com

# 3. Clone + Setup
git clone https://github.com/Coriatel/Flow-Control.git
cd Flow-Control/server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# 4. הרצה עם PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## 📚 פקודות שימושיות

```bash
# Git
git status
git log --oneline -5
git branch -a

# Build & Development
cd server
npm run build              # TypeScript compilation
npm run dev               # Development server (port 4000)
npm test                  # Run Jest tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Prisma
npx prisma generate       # Generate client
npx prisma migrate dev    # Create migration
npx prisma migrate deploy # Apply migrations (prod)
npx prisma studio        # GUI database browser
npx prisma db seed       # Seed database

# Production
pm2 start ecosystem.config.js
pm2 logs                  # View logs
pm2 restart all          # Restart
pm2 stop all             # Stop
```

---

## 📂 קבצים חשובים

| קובץ | תיאור |
|------|-------|
| `server/src/app.ts` | Express app configuration |
| `server/src/server.ts` | Server entry point |
| `server/src/routes/index.ts` | All routes registration |
| `server/src/middleware/security.ts` | Rate limiting + Helmet |
| `server/src/middleware/validate.ts` | Zod validation middleware |
| `server/src/middleware/errorHandler.ts` | Error handling |
| `server/src/validation/schemas.ts` | All Zod schemas |
| `server/src/types/index.ts` | TypeScript type definitions |
| `server/prisma/schema.prisma` | Database schema (27 models) |
| `server/.env.example` | Environment variables template |
| `server/ecosystem.config.js` | PM2 configuration |
| `README.md` | Project documentation |
| `HOSTINGER_DEPLOYMENT.md` | Deployment guide |

---

## 🌍 Environment Variables

### Development (`.env`)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control"
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173
LOG_LEVEL=debug
```

### Production
```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30&sslmode=require"
JWT_SECRET=<random-string-min-32-chars>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-domain.com
LOG_LEVEL=info

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Flow Control <noreply@flowcontrol.com>"
```

---

## ⚠️ הערות חשובות

### בנייה ו-TypeScript
- ✅ `npm run build` עובר בכל סביבה
- ✅ Types מוגדרים ידנית ב-`server/src/types/index.ts`
- ✅ Build לא תלוי ב-Prisma client generation

### Prisma בסביבות שונות
| סביבה | `prisma generate` | הערות |
|-------|-------------------|-------|
| Claude Code | ❌ 403 Forbidden | Sandbox מוגבל |
| GitHub Codespaces | ✅ עובד | אינטרנט מלא |
| GitHub Actions | ✅ עובד | CI/CD |
| מחשב מקומי | ✅ עובד | אינטרנט רגיל |
| VPS/Cloud | ✅ עובד | פרודקשן |
| Docker | ✅ עובד | Container |

### Git Branches
- `main` - ייצוב, מוכן לפרודקשן
- `claude/*` - branches עבודה (merge אחרי הושלמה)

### Tests
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e` (אחרי התקנת Playwright)
- Coverage: `npm run test:coverage`

---

## 🎯 Next Steps Summary

1. **הרץ tests** - GitHub Codespaces או מקומי
2. **הוסף E2E tests** - Playwright (אופציונלי)
3. **הוסף file upload** - Multer לCOA documents (אופציונלי)
4. **הוסף emails** - Nodemailer להתראות (אופציונלי)
5. **Deploy** - Hostinger/Railway/Render לפרודקשן

---

**עודכן:** דצמבר 2024
**סטטוס:** Backend production-ready, Frontend 90% complete
