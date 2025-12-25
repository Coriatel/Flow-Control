# Flow Control - Prompt for Cursor IDE

**תאריך יצירה:** 25 דצמבר 2025
**מסמך זה:** הוראות עבודה ל-Cursor IDE (Local Development)
**קשור ל:** [WORK_PLAN.md](./WORK_PLAN.md)

---

## 🎯 מטרת הפרומפט

פרומפט זה מספק לך את כל ההקשר הדרוש לעבודה עם Flow Control ב-Cursor IDE, כולל setup, testing, ו-deployment.

---

## 📚 הקשר כללי - מה זה Flow Control?

**Flow Control** הוא מערכת ניהול מלאי למעבדת בנק דם:
- **Frontend:** React 18 + Vite (51 pages)
- **Backend:** Express 5.1 + TypeScript (17 routes)
- **Database:** PostgreSQL + Prisma (27 models)
- **Status:** 70% מוכן לפרודקשן

---

## 📖 סיכום מצב - What's Been Done

### ✅ מה כבר מוכן:
1. **Frontend** - 51 דפים, UI מלא, מיגרציה ל-API מקומי
2. **Backend** - API מלא עם JWT auth, security middleware
3. **Database Schema** - Prisma schema מושלם (27 models)
4. **Documentation** - WORK_PLAN.md, README.md, וכל התיעוד
5. **Git** - Branch `claude/work-plan-PhINX` מוכן

### 🔴 מה חסר (זה התפקיד שלך!):
1. **Database Setup** - Prisma generate + migrations + seed
2. **Development Testing** - הרצת servers ובדיקות
3. **Integration Testing** - בדיקת Frontend↔Backend
4. **Performance Testing** - benchmarks
5. **Production Deployment** - staging + production

---

## 💻 יכולות Cursor - מה אתה יכול לעשות

### ✅ מה שאתה יכול (ש-Claude Code לא יכול):
1. **npm install** - התקנת dependencies
2. **Prisma operations** - generate, migrate, seed
3. **הרצת servers** - Frontend (5173) + Backend (4000)
4. **Database access** - PostgreSQL connection
5. **Testing** - Jest, integration tests
6. **Build** - Production builds
7. **Debugging** - Full debugging capabilities
8. **File system** - מלא access

### ⚠️ דברים לשים לב:
- דרוש Node.js 22+
- דרוש PostgreSQL (Docker או local)
- דרוש internet access (לPrisma engines)

---

## 🚀 Quick Start - התחלה מהירה

### שלב 1: Setup סביבת עבודה (15 דקות)

```bash
# 1. Clone (אם טרם עשית)
git clone https://github.com/Coriatel/Flow-Control.git
cd Flow-Control

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Start PostgreSQL (Docker)
docker-compose up -d

# 4. Setup environment
cd server
cp .env.example .env
# ערוך .env - חשוב!
```

### שלב 2: Database Setup (10 דקות)

```bash
cd server

# 1. Generate Prisma Client
npm run prisma:generate

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Seed database
npm run prisma:seed

# 4. Verify
npx prisma studio  # Opens browser
```

### שלב 3: Development Servers (5 דקות)

```bash
# Terminal 1: Backend
cd server
npm run dev
# Should start on http://localhost:4000

# Terminal 2: Frontend
npm run dev
# Should start on http://localhost:5173
```

### שלב 4: Basic Testing (10 דקות)

```bash
# בדוק health endpoints
curl http://localhost:4000/health
curl http://localhost:4000/api/health

# בדוק authentication
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

---

## 📋 תוכנית עבודה ל-Cursor

### Sprint 1: MVP Critical (5-7 ימים) 🔴

#### Day 1: Database & Environment Setup
**זמן משוער:** 2-3 שעות

```bash
✓ Checklist:
- [ ] Clone repository
- [ ] npm install (root & server)
- [ ] Docker PostgreSQL running
- [ ] .env configured correctly
- [ ] Prisma generate success
- [ ] Migrations run successfully
- [ ] Seed data loaded
- [ ] Prisma Studio accessible
```

**Environment Variables (.env):**
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control"

# JWT (IMPORTANT!)
JWT_SECRET="your-super-secret-jwt-key-CHANGE-THIS"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:5173"

# File Upload
FILE_UPLOAD_PATH="./uploads"
MAX_FILE_SIZE="10485760"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
```

#### Day 2: Development Environment Testing
**זמן משוער:** 3-4 שעות

```bash
✓ Checklist:
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Frontend connects to Backend
- [ ] Health endpoints respond
- [ ] No console errors
- [ ] HMR (Hot Module Reload) works
```

**בדוק:**
```bash
# Backend logs
cd server && npm run dev
# אמור לראות: "Server running on port 4000"

# Frontend logs
npm run dev
# אמור לראות: "Local: http://localhost:5173"
```

#### Day 3: Authentication Flow Testing
**זמן משוער:** 4-5 שעות

```bash
✓ Checklist:
- [ ] Register endpoint works
- [ ] Login endpoint works
- [ ] JWT token generated correctly
- [ ] Protected routes return 401 without token
- [ ] Protected routes work with valid token
- [ ] Token refresh works
- [ ] Logout clears token
```

**Testing Script:**
```bash
# 1. Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@test.com",
    "password":"Admin123!",
    "name":"Admin User",
    "role":"ADMIN"
  }'

# 2. Login (save token)
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.token')

# 3. Test protected route
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Test without token (should fail)
curl http://localhost:4000/api/reagents
```

#### Day 4-5: Frontend Integration Testing
**זמן משוער:** 8-10 שעות

```bash
✓ Checklist:
- [ ] Login page works in browser
- [ ] Registration works
- [ ] Token stored in localStorage
- [ ] Dashboard loads after login
- [ ] All 51 pages accessible
- [ ] API calls go to localhost:4000
- [ ] Error handling works
- [ ] Loading states work
```

**Manual Testing:**
1. Open http://localhost:5173
2. Try to access /dashboard (should redirect to /login)
3. Login with test user
4. Should redirect to /dashboard
5. Navigate through all major pages
6. Check browser console (no errors)
7. Check Network tab (all requests to localhost:4000)

#### Day 6-7: API Endpoints Testing
**זמן משוער:** 8-10 שעות

**בדוק כל endpoint:**
```bash
# Reagents
- [ ] GET /api/reagents
- [ ] GET /api/reagents/:id
- [ ] POST /api/reagents
- [ ] PUT /api/reagents/:id
- [ ] DELETE /api/reagents/:id

# Suppliers
- [ ] GET /api/suppliers
- [ ] GET /api/suppliers/:id
- [ ] POST /api/suppliers
- [ ] PUT /api/suppliers/:id

# Orders
- [ ] GET /api/orders
- [ ] GET /api/orders/:id
- [ ] POST /api/orders
- [ ] POST /api/orders/:id/approve
- [ ] POST /api/orders/:id/receive

# ... (כל שאר הroutes)
```

**Postman/Thunder Client Collection:**
צור collection עם כל הrequests לבדיקה מהירה.

---

### Sprint 2: Production Preparation (5-7 ימים) 🟡

#### Day 1-2: Testing Suite
**זמן משוער:** 10-12 שעות

```bash
✓ Checklist:
- [ ] Jest configured
- [ ] Unit tests for services (70%+ coverage)
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows (optional)
- [ ] All tests passing
```

**Example Tests:**
```javascript
// server/src/__tests__/auth.test.ts
describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });

  it('should login existing user', async () => {
    // Test login
  });

  it('should reject invalid credentials', async () => {
    // Test failure
  });
});
```

**Run Tests:**
```bash
cd server
npm test
npm run test:coverage
```

#### Day 3-4: Performance Optimization
**זמן משוער:** 8-10 שעות

```bash
✓ Checklist:
- [ ] Query optimization (no N+1 queries)
- [ ] Pagination implemented
- [ ] Index verification
- [ ] Bundle size optimization
- [ ] Lazy loading implemented
- [ ] Performance benchmarks met
```

**Performance Checks:**
```bash
# Frontend bundle size
npm run build
# Should be < 500KB gzipped

# Backend response time
ab -n 1000 -c 10 http://localhost:4000/api/health
# Should be < 50ms average

# Database query time
# Check Prisma logs (set DEBUG=prisma:query)
```

#### Day 5-7: Deployment Preparation
**זמן משוער:** 10-15 שעות

```bash
✓ Checklist:
- [ ] Production .env configured
- [ ] Build scripts working
- [ ] Docker images building
- [ ] SSL certificates ready
- [ ] Backup strategy defined
- [ ] Monitoring setup
- [ ] Error tracking (Sentry optional)
```

**Build for Production:**
```bash
# Frontend
npm run build
# Output: dist/

# Backend
cd server
npm run build
# Output: dist/

# Test production build locally
NODE_ENV=production npm start
```

---

## 🧪 Testing Checklist מפורט

### Unit Tests (Backend)
```bash
✓ Services:
- [ ] reagentService - CRUD operations
- [ ] supplierService - CRUD operations
- [ ] orderService - Complex workflows
- [ ] batchService - Inventory logic
- [ ] dashboardService - Aggregations

✓ Middleware:
- [ ] auth - JWT verification
- [ ] validate - Zod schemas
- [ ] errorHandler - Error responses

✓ Utils:
- [ ] logger - Logging functions
- [ ] prisma - Database client
```

### Integration Tests (API)
```bash
✓ Auth Routes:
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] GET /api/auth/me
- [ ] PUT /api/auth/change-password

✓ Reagent Routes:
- [ ] GET /api/reagents (with pagination)
- [ ] GET /api/reagents/:id
- [ ] POST /api/reagents (with validation)
- [ ] PUT /api/reagents/:id
- [ ] DELETE /api/reagents/:id (soft delete)

✓ Protected Routes:
- [ ] All routes reject without auth
- [ ] All routes accept with valid token
- [ ] Rate limiting works
```

### E2E Tests (Optional - Playwright)
```bash
✓ Critical Flows:
- [ ] User registration → Login → Dashboard
- [ ] Create reagent → View list → Edit → Delete
- [ ] Create order → Approve → Receive items
- [ ] File upload → Download
- [ ] Error scenarios
```

---

## 🐛 Debugging Guide

### Common Issues & Solutions

#### 1. Prisma Generate Fails
```bash
# Error: Cannot download engines
# Solution: Check internet connection
npm config set strict-ssl false  # If behind proxy
npm run prisma:generate

# Or use custom binary
export PRISMA_ENGINES_MIRROR=https://custom-mirror.com
```

#### 2. Database Connection Fails
```bash
# Error: Can't reach database server
# Check:
- [ ] PostgreSQL running (docker ps)
- [ ] DATABASE_URL correct in .env
- [ ] Port 5432 not blocked
- [ ] User/password correct

# Test connection:
docker exec -it flow-control-postgres psql -U postgres
```

#### 3. Port Already in Use
```bash
# Error: EADDRINUSE
# Solution:
lsof -i :4000  # Find process
kill -9 <PID>  # Kill it
# Or change PORT in .env
```

#### 4. CORS Errors
```bash
# Error: CORS policy blocked
# Check:
- [ ] CORS_ORIGIN in server/.env matches frontend URL
- [ ] Frontend calling correct backend URL
- [ ] Credentials: true set in both places
```

#### 5. JWT Token Issues
```bash
# Error: Invalid token / Token expired
# Check:
- [ ] JWT_SECRET same in server/.env
- [ ] Token stored in localStorage
- [ ] Token included in Authorization header
- [ ] Token not expired (check JWT_EXPIRES_IN)
```

---

## 📊 Performance Benchmarks

### Target Metrics:

#### Backend:
```bash
Health endpoint: < 10ms
API endpoints: < 100ms
Database queries: < 50ms
File upload: < 2s (10MB)
```

#### Frontend:
```bash
Initial load: < 3s
Route change: < 500ms
Bundle size: < 500KB gzipped
Lighthouse score: > 90
```

#### Database:
```bash
Query time: < 50ms
Connection pool: 10-20
Indexes: All foreign keys
```

---

## 🚀 Deployment Options

### Option 1: Docker (מומלץ)

**Build:**
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run
docker-compose -f docker-compose.prod.yml up -d

# Check
docker-compose ps
docker-compose logs -f
```

**docker-compose.prod.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: flow_control
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./server
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/flow_control
      NODE_ENV: production
    depends_on:
      - postgres

  frontend:
    build: .
    environment:
      VITE_API_URL: https://api.yourdomain.com
```

### Option 2: Hostinger VPS

קרא את: **HOSTINGER_DEPLOYMENT.md** - מדריך מפורט!

**Quick Steps:**
```bash
# SSH to server
ssh user@your-server-ip

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql nginx

# Clone & setup
git clone https://github.com/Coriatel/Flow-Control.git
cd Flow-Control
npm ci
cd server && npm ci

# Configure
cp server/.env.example server/.env
# Edit .env with production values

# Database
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed

# Build
npm run build
cd server && npm run build

# PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add

# Deploy
railway up

# Set environment variables
railway variables set JWT_SECRET=your-secret
railway variables set NODE_ENV=production
```

### Option 4: Render.com

1. Connect GitHub repo
2. Create Web Service (Backend)
3. Create Static Site (Frontend)
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

---

## 🔐 Security Checklist Pre-Production

```bash
✓ Before Deploy:
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS_ORIGIN
- [ ] Enable rate limiting
- [ ] Add helmet security headers
- [ ] Validate all user inputs
- [ ] Sanitize outputs (XSS protection)
- [ ] Use prepared statements (Prisma ✓)
- [ ] Hash passwords (bcrypt ✓)
- [ ] No secrets in code
- [ ] Environment variables secure
- [ ] Database backups configured
- [ ] Error logging (no stack traces to users)
- [ ] API keys rotated
- [ ] Dependencies updated
```

---

## 📁 Important Files Reference

### Environment Files:
```bash
server/.env              # Backend configuration
.env (root - optional)   # Frontend configuration
```

### Configuration Files:
```bash
server/tsconfig.json     # TypeScript config
vite.config.js          # Vite config
server/prisma/schema.prisma  # Database schema
docker-compose.yml      # Docker setup
ecosystem.config.js     # PM2 config (create if needed)
```

### Scripts:
```bash
package.json            # Frontend scripts
server/package.json     # Backend scripts
deploy.sh              # Deployment script
run-android.sh         # Mobile dev script
```

---

## 🎯 Recommended Workflow

### Daily Development:
```bash
# Morning
1. git pull origin main
2. npm install (if package.json changed)
3. docker-compose up -d (PostgreSQL)
4. npm run dev (Frontend)
5. cd server && npm run dev (Backend)

# During work
- Save often
- Check console for errors
- Test in browser frequently
- Commit small changes often

# Evening
- Run tests: npm test
- Commit: git commit -m "feat: what you did"
- Push: git push origin your-branch
```

### Testing Workflow:
```bash
# Before commit
1. npm run build (check build works)
2. npm test (run tests)
3. npm run lint (check code style)
4. Manual testing in browser

# Before PR
1. Full regression testing
2. Check all features work
3. No console errors
4. Performance check
```

### Deployment Workflow:
```bash
# Staging
1. Deploy to staging environment
2. Full testing on staging
3. Performance benchmarks
4. Security scan

# Production
1. Create backup
2. Deploy during low traffic
3. Monitor logs
4. Rollback plan ready
5. Verify all services up
```

---

## 💡 Pro Tips

### VS Code / Cursor Extensions:
```
- ESLint
- Prettier
- Prisma
- GitLens
- Thunder Client (API testing)
- Error Lens
- Auto Rename Tag
- Path Intellisense
```

### Debugging:
```bash
# Backend debugging
DEBUG=* npm run dev  # All debug logs
DEBUG=prisma:query npm run dev  # SQL queries
NODE_ENV=development npm run dev  # Development mode

# Frontend debugging
VITE_DEBUG=true npm run dev
```

### Database:
```bash
# Prisma Studio (GUI)
npx prisma studio

# SQL query direct
psql -U postgres -d flow_control

# Reset database
npm run prisma:reset  # WARNING: deletes all data!
```

---

## 📞 Get Help

### Issues:
1. Check logs (backend, frontend, database)
2. Check WORK_PLAN.md for known issues
3. Search GitHub issues
4. Ask in team chat

### Resources:
- WORK_PLAN.md - תוכנית מרכזית
- HOSTINGER_DEPLOYMENT.md - Deployment guide
- docs/PRODUCTION_READINESS_REPORT.md - Production checklist
- README.md - General info

---

## ✅ Final Checklist Before Going Live

### MVP Ready:
- [ ] All tests passing (70%+ coverage)
- [ ] No console errors
- [ ] All 51 pages work
- [ ] Authentication flow complete
- [ ] API endpoints tested
- [ ] Database migrations successful
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Deployment tested on staging

### Production Ready:
- [ ] All MVP items ✓
- [ ] HTTPS/SSL enabled
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Error tracking setup
- [ ] Load testing passed
- [ ] Disaster recovery plan
- [ ] Team trained
- [ ] User documentation ready
- [ ] Support process defined

---

## 🎯 Next Steps - Start Here!

### Step 1: Setup (Day 1)
```bash
# Clone and install
git clone https://github.com/Coriatel/Flow-Control.git
cd Flow-Control
npm install
cd server && npm install && cd ..

# Database
docker-compose up -d
cd server
cp .env.example .env
# EDIT .env with your values!
npm run db:setup
```

### Step 2: Test (Day 1-2)
```bash
# Start servers
npm run dev &
cd server && npm run dev &

# Test
curl http://localhost:4000/health
open http://localhost:5173
```

### Step 3: Develop (Day 2-7)
- Follow Sprint 1 checklist
- Test each feature
- Document issues
- Commit often

---

**מוכן להתחיל? בוא נבנה משהו מדהים! 🚀**

---

**עדכון אחרון:** 25 דצמבר 2025
**גרסה:** 1.0
**נכתב על ידי:** Claude Opus 4.5
**מיועד ל:** Cursor IDE / Local Development
