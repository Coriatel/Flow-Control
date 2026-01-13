# Flow Control - Cursor IDE Work Plan

**Date:** December 25, 2025
**Version:** 1.0
**Status:** Active - Tasks for Local Development Only

---

## Purpose

This document lists tasks that **can ONLY be done in Cursor/Local IDE**, not in Claude Code (cloud). These tasks require:
- Running servers
- Database access
- npm install/build
- Testing
- Debugging

---

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend npm install | ✅ Done | 568 packages |
| Backend npm install | ✅ Done | 552 packages |
| Frontend build | ✅ Done | dist/ created |
| Backend build | ✅ Done | TypeScript compiled |
| PostgreSQL | ❌ Not running | Needs Docker/local |
| Prisma | ❌ Not generated | Needs DB first |

---

## Priority 1: Database Setup (Blocks Everything)

### Step 1.1: Start PostgreSQL

**Option A: Docker (Recommended)**
```bash
cd "Flow-Control-Clean"
docker-compose up -d
```

**Option B: Local PostgreSQL**
- Install PostgreSQL 15+
- Create database: `flow_control`
- User: `postgres` / Password: `postgres`

**Verify:**
```bash
docker ps  # Should show postgres container
```

### Step 1.2: Configure Environment

```bash
cd "Flow-Control-Clean/server"
cp .env.example .env
```

**Edit `.env`:**
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control"
JWT_SECRET="CHANGE-THIS-TO-RANDOM-32-CHAR-STRING"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
```

### Step 1.3: Prisma Setup

```bash
cd "Flow-Control-Clean/server"
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

**Verify:**
```bash
npx prisma studio  # Opens database GUI
```

---

## Priority 2: Development Servers

### Step 2.1: Start Backend

**Terminal 1:**
```bash
cd "Flow-Control-Clean/server"
npm run dev
```

**Expected output:**
```
Server running on port 4000
Database connected successfully
```

### Step 2.2: Start Frontend

**Terminal 2:**
```bash
cd "Flow-Control-Clean"
npm run dev
```

**Expected output:**
```
VITE v6.4.1 ready in XXX ms
Local: http://localhost:5173/
```

### Step 2.3: Basic Verification

```bash
# Health check
curl /health
curl /api/health

# Expected: {"status":"ok"} or similar
```

---

## Priority 3: Authentication Testing

### Step 3.1: Register Test User

```bash
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flowcontrol.local",
    "password": "Admin123!",
    "name": "Admin User"
  }'
```

### Step 3.2: Login

```bash
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flowcontrol.local",
    "password": "Admin123!"
  }'
```

**Save the returned token!**

### Step 3.3: Test Protected Route

```bash
TOKEN="your-token-here"
curl /api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Priority 4: Frontend-Backend Integration

### Step 4.1: Browser Testing

1. Open http://localhost:5173
2. Should redirect to /login (or show login form)
3. Enter test credentials
4. Should redirect to dashboard
5. Check browser console (no errors)
6. Check Network tab (API calls to )

### Step 4.2: Test Each Major Page

| Page | URL | Test |
|------|-----|------|
| Dashboard | /dashboard | Loads with data |
| Reagents | /reagents | List displays |
| Orders | /orders | List displays |
| Suppliers | /suppliers | List displays |
| Inventory | /inventory | Functions work |

### Step 4.3: Test CRUD Operations

For each entity, verify:
- [ ] Create (POST)
- [ ] Read (GET list & single)
- [ ] Update (PUT)
- [ ] Delete (DELETE)

---

## Priority 5: Testing Suite

### Step 5.1: Run Existing Tests

```bash
cd "Flow-Control-Clean/server"
npm test
```

### Step 5.2: Test Coverage

```bash
npm run test:coverage
```

**Target: 70%+ coverage**

### Step 5.3: Fix Failing Tests

Review and fix any failing tests before proceeding.

---

## Priority 6: Performance Testing

### Step 6.1: Frontend Build Size

```bash
cd "Flow-Control-Clean"
npm run build
```

**Check:**
- dist/assets/index-*.js should be < 2MB
- CSS should be < 200KB

### Step 6.2: API Response Times

```bash
# Install if needed
npm install -g autocannon

# Test endpoint
autocannon -d 10 -c 10 /api/health
```

**Target:**
- Health: < 10ms avg
- API: < 100ms avg

---

## Priority 7: Production Build Test

### Step 7.1: Build Both

```bash
# Frontend
cd "Flow-Control-Clean"
npm run build

# Backend
cd server
npm run build
```

### Step 7.2: Test Production Mode

```bash
cd "Flow-Control-Clean/server"
NODE_ENV=production node dist/server.js
```

---

## Quick Reference - Commands

### Development
```bash
# Start PostgreSQL
docker-compose up -d

# Start Backend
cd server && npm run dev

# Start Frontend
npm run dev

# Stop PostgreSQL
docker-compose down
```

### Database
```bash
# Generate client
npm run prisma:generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open GUI
npx prisma studio

# Seed data
npm run prisma:seed
```

### Testing
```bash
# Run tests
npm test

# Coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Build
```bash
# Frontend
npm run build

# Backend
cd server && npm run build
```

---

## Troubleshooting

### Docker Not Working
```bash
# Check Docker is running
docker info

# Manual PostgreSQL start
docker run --name flow-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flow_control \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :4000
kill -9 <PID>
```

### Prisma Issues
```bash
# Regenerate
rm -rf node_modules/.prisma
npm run prisma:generate

# Full reset
npx prisma migrate reset --force
```

### Node Version
```bash
# Check version
node -v
# Should be 18+ (preferably 22)

# If too old, use nvm
nvm install 22
nvm use 22
```

---

## Files Reference

### Environment
- `server/.env` - Backend config
- `server/.env.example` - Template

### Database
- `server/prisma/schema.prisma` - Schema
- `server/prisma/migrations/` - Migrations
- `server/prisma/seed.ts` - Seed data

### Build Output
- `dist/` - Frontend build
- `server/dist/` - Backend build

---

## What Cloud Claude Cannot Do

These tasks REQUIRE local environment:

| Task | Why Local Only |
|------|---------------|
| Database setup | Needs PostgreSQL access |
| Prisma generate | Downloads binaries |
| npm install | Network/disk access |
| Run servers | Port binding |
| Integration tests | Needs running services |
| Performance tests | Real measurements |
| Debug | Interactive debugging |
| Docker operations | Container runtime |

---

## Checklist

### Phase 1: Setup
- [ ] Docker running
- [ ] PostgreSQL accessible
- [ ] .env configured
- [ ] Prisma generated
- [ ] Migrations run
- [ ] Seed data loaded

### Phase 2: Development
- [ ] Backend starts
- [ ] Frontend starts
- [ ] Health check works
- [ ] Auth flow works
- [ ] Dashboard loads

### Phase 3: Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Coverage > 70%
- [ ] No console errors

### Phase 4: Build
- [ ] Frontend builds
- [ ] Backend builds
- [ ] Production mode works
- [ ] Bundle size acceptable

---

**Next Action:** Start PostgreSQL, then run Prisma setup!

---

*Last Updated: December 25, 2025*
*Status: Ready for Cursor execution*
