# Flow Control - Blood Bank Inventory Management System

מערכת ניהול מלאי למעבדת בנק דם

## Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 27 tables, 16 enums |
| Backend API | ✅ Complete | Express 5.1 + TypeScript |
| Services Layer | ✅ Complete | 6 services |
| API Routes | ✅ Complete | All CRUD + workflows |
| Zod Validation | ✅ Complete | All routes validated |
| Security | ✅ Complete | Rate limiting + Helmet |
| Logging | ✅ Complete | Pino structured logging |
| Authentication | ✅ Complete | JWT + Role-based |
| Prisma ORM | ⚠️ Needs Setup | Run `prisma generate` |
| Frontend | ✅ 90% Complete | 52 pages, React + Vite |
| Mobile Support | ✅ Responsive | Android/iOS ready |
| Tests | ⚠️ Infrastructure | Jest + Supertest ready |

## Tech Stack

- **Frontend**: React 18, Vite 6.1, TailwindCSS, Radix UI
- **Backend**: Node.js 22, Express 5.1, TypeScript 5.9
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 6.x
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit
- **Logging**: Pino
- **Testing**: Jest, Supertest

## Quick Start

### Development Setup
```bash
# 1. Install dependencies
npm install
cd server && npm install

# 2. Start database
docker-compose up -d

# 3. Setup environment
cd server
cp .env.example .env
# Edit .env with your settings

# 4. Generate Prisma client & migrate
npx prisma generate
npx prisma migrate dev --name init

# 5. Build & Run
npm run build
npm run dev          # Development with hot reload
# OR
npm start            # Production mode
```

### Production Deployment (Hostinger)
```bash
# 1. Clone and setup
git clone <repo>
cd Flow-Control/server
cp .env.example .env
# Edit .env with production values:
# - DATABASE_URL (with SSL)
# - JWT_SECRET (strong random string)
# - ALLOWED_ORIGINS (your domain)
# - NODE_ENV=production

# 2. Install and build
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# 3. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (rate limited: 5/15min)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `POST /api/users/:id/reset-password` - Reset password
- `PUT /api/users/:id/role` - Change role

### Reagents
- `GET /api/reagents` - List reagents
- `GET /api/reagents/:id` - Get reagent
- `POST /api/reagents` - Create reagent
- `PUT /api/reagents/:id` - Update reagent
- `DELETE /api/reagents/:id` - Soft delete

### Suppliers
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `POST /api/suppliers/:id/contacts` - Add contact
- `PUT /api/suppliers/:id/contacts/:contactId` - Update contact

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `POST /api/orders` - Create order
- `POST /api/orders/:id/items` - Add item
- `PUT /api/orders/:id/items/:itemId` - Update item
- `POST /api/orders/:id/receive` - Receive items

### Deliveries
- `GET /api/deliveries` - List deliveries
- `POST /api/deliveries` - Create delivery
- `PUT /api/deliveries/:id` - Update delivery
- `POST /api/deliveries/:id/receive` - Receive delivery
- `POST /api/deliveries/:id/items` - Add item

### Withdrawals
- `GET /api/withdrawals` - List withdrawal requests
- `POST /api/withdrawals` - Create request
- `POST /api/withdrawals/:id/submit` - Submit request
- `POST /api/withdrawals/:id/approve` - Approve (Manager+)
- `POST /api/withdrawals/:id/ship` - Mark shipped
- `POST /api/withdrawals/:id/complete` - Complete

### Shipments
- `GET /api/shipments` - List shipments
- `POST /api/shipments` - Create shipment
- `PUT /api/shipments/:id` - Update shipment
- `POST /api/shipments/:id/send` - Send shipment
- `POST /api/shipments/:id/confirm-received` - Confirm receipt
- `POST /api/shipments/:id/items` - Add item

### Alerts
- `GET /api/alerts` - List active alerts
- `GET /api/alerts/summary` - Alert counts by severity
- `POST /api/alerts/:id/acknowledge` - Acknowledge
- `POST /api/alerts/:id/resolve` - Resolve
- `GET /api/alerts/rules/list` - List alert rules
- `POST /api/alerts/rules` - Create rule (Admin)

### Activity Log
- `GET /api/activity` - List activities
- `GET /api/activity/user/:userId` - User activities
- `GET /api/activity/entity/:type/:id` - Entity activities

### Health
- `GET /health` - Server health check
- `GET /api/health` - API health with DB status

## Security Features

### Rate Limiting
| Limiter | Limit | Scope |
|---------|-------|-------|
| General | 100/15min | All API routes |
| Auth | 5/15min | Login/Register |
| Sensitive | 20/15min | Admin operations |
| Read | 200/15min | GET requests |

### Security Headers (Helmet)
- Content-Security-Policy
- HSTS (1 year)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Authentication
- JWT tokens with configurable expiry
- Role-based authorization (ADMIN, MANAGER, USER, READONLY)
- Password hashing with bcrypt

## Environment Variables

```env
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30"

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info  # silent, fatal, error, warn, info, debug, trace
```

## Project Structure

```
Flow-Control/
├── server/                  # Backend
│   ├── prisma/
│   │   └── schema.prisma   # 27 models, 16 enums
│   ├── src/
│   │   ├── routes/         # API routes
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── suppliers.ts
│   │   │   ├── reagents.ts
│   │   │   ├── orders.ts
│   │   │   ├── deliveries.ts
│   │   │   ├── withdrawals.ts
│   │   │   ├── shipments.ts
│   │   │   ├── alerts.ts
│   │   │   └── activity.ts
│   │   ├── services/       # Business logic
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT auth
│   │   │   ├── security.ts      # Rate limiting + Helmet
│   │   │   ├── validate.ts      # Zod validation
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── validation/
│   │   │   └── schemas.ts  # All Zod schemas
│   │   ├── utils/
│   │   │   ├── prisma.ts   # DB connection
│   │   │   └── logger.ts   # Pino logger
│   │   ├── types/
│   │   │   └── index.ts    # TypeScript types
│   │   ├── app.ts          # Express app
│   │   └── server.ts       # Entry point
│   ├── __tests__/          # Jest tests
│   ├── ecosystem.config.js # PM2 config
│   └── package.json
├── src/                     # Frontend (React)
│   ├── pages/              # 52 pages
│   └── components/
├── DOCS/                    # Documentation
├── HOSTINGER_DEPLOYMENT.md  # Deployment guide
└── README.md
```

## Testing

```bash
cd server

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --testPathPattern=auth
```

## Documentation

- `HOSTINGER_DEPLOYMENT.md` - Complete deployment guide
- `PROJECT_STATUS.md` - Detailed status report
- `DOCS/complete-requirements-analysis.md` - Requirements
- `DOCS/data-dictionary.md` - Data dictionary
- `DOCS/API_MIGRATION_SUMMARY.md` - API migration docs

## Recent Updates (December 2025)

- ✅ Complete API endpoints for all entities
- ✅ Zod validation on all routes
- ✅ Rate limiting and security headers
- ✅ Pino structured logging
- ✅ JWT authentication with roles
- ✅ TypeScript build passing

## What's Next

1. ⬜ Create PR and merge to main
2. ⬜ Deploy to Hostinger
3. ⬜ Add E2E tests (Playwright)
4. ⬜ Add file upload for COA documents
5. ⬜ Email notifications

## License

Private - Coriatel
