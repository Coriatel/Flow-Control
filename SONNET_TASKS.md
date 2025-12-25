# Flow Control - משימות להשלמה (Sonnet)

## מצב נוכחי

### Branch: `claude/backend-production-setup-b6Eh7`
**4 commits לפני main** - צריך למזג

### מה הושלם:
- ✅ כל ה-API endpoints
- ✅ Zod validation לכל routes
- ✅ Rate limiting + Helmet security
- ✅ Pino logging
- ✅ JWT authentication
- ✅ TypeScript build עובר (`npm run build`)

### מה לא עובד:
- ⚠️ `npx prisma generate` - בעיית רשת (403 Forbidden)
- ⚠️ Tests לא רצים בלי Prisma client

---

## משימות לביצוע (לפי סדר עדיפות)

### 1. מיזוג ל-main (קריטי)
```bash
# אפשרות א - יצירת PR בגיטהאב
# לך ל: https://github.com/Coriatel/Flow-Control
# צור PR מ-claude/backend-production-setup-b6Eh7 ל-main
# מזג את ה-PR

# אפשרות ב - מיזוג ישיר (אם יש הרשאות)
git checkout main
git pull origin main
git merge claude/backend-production-setup-b6Eh7
git push origin main
```

### 2. תיקון Prisma (אם יש רשת תקינה)
```bash
cd /home/user/Flow-Control/server
npx prisma generate
npm run build
npm test
```

### 3. הוספת E2E Tests (אופציונלי)
```bash
# התקנת Playwright
npm install -D @playwright/test
npx playwright install

# יצירת תיקיית tests
mkdir -p e2e
```

צור קובץ `e2e/api.spec.ts`:
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

test.describe('Auth API', () => {
  test('login with invalid credentials returns 401', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'invalid@test.com', password: 'wrong' }
    });
    expect(response.status()).toBe(401);
  });
});
```

### 4. הוספת File Upload (אופציונלי)
```bash
npm install multer @types/multer
```

צור `server/src/middleware/upload.ts`:
```typescript
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### 5. הוספת Email Notifications (אופציונלי)
```bash
npm install nodemailer @types/nodemailer
```

צור `server/src/utils/email.ts`:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@flowcontrol.com',
    to,
    subject,
    html
  });
};
```

---

## פקודות שימושיות

```bash
# בדיקת סטטוס
git status
git log --oneline -5

# בנייה
cd server && npm run build

# הרצת שרת (development)
npm run dev

# הרצת tests
npm test

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma studio  # GUI לצפייה ב-DB
```

---

## קבצים חשובים

| קובץ | תיאור |
|------|-------|
| `server/src/app.ts` | Express app configuration |
| `server/src/routes/index.ts` | All routes registration |
| `server/src/middleware/security.ts` | Rate limiting + Helmet |
| `server/src/middleware/validate.ts` | Zod validation |
| `server/src/validation/schemas.ts` | All Zod schemas |
| `server/prisma/schema.prisma` | Database schema |
| `server/.env.example` | Environment variables template |
| `server/ecosystem.config.js` | PM2 configuration |
| `HOSTINGER_DEPLOYMENT.md` | Deployment guide |

---

## Environment Variables לפרודקשן

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30&sslmode=require"
JWT_SECRET=<random-string-min-32-chars>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-domain.com
LOG_LEVEL=info
```

---

## הערות חשובות

1. **Build עובד** - `npm run build` מצליח
2. **Prisma** - צריך להריץ `npx prisma generate` לפני tests
3. **Branch** - כל השינויים ב-`claude/backend-production-setup-b6Eh7`
4. **Main** - צריך PR או merge ידני
