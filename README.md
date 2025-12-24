# Flow Control - Blood Bank Inventory Management System

מערכת ניהול מלאי למעבדת בנק דם

## Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 27 tables, 16 enums |
| Backend API | ✅ Complete | Express 5.1 + TypeScript |
| Services Layer | ✅ Complete | 6 services |
| API Routes | ✅ Complete | RESTful endpoints |
| Prisma ORM | ⚠️ Needs Setup | See "Local Setup" below |
| Frontend | ✅ 90% Complete | 52 pages, React + Vite |
| Mobile Support | ✅ Responsive | Android/iOS ready |

## Tech Stack

- **Frontend**: React 18, Vite 6.1, TailwindCSS, Radix UI
- **Backend**: Node.js 22, Express 5.1, TypeScript 5.9
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 6.x

## Quick Start

### Option 1: Android/Mobile Development
```bash
# הרצה על מכשיר Android (Xiaomi או אחר)
./run-android.sh
```

### Option 2: Standard Development
```bash
# 1. התקנת תלויות
npm install
cd server && npm install

# 2. הפעלת מסד נתונים
docker-compose up -d

# 3. הגדרת סביבה
cd server
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init

# 4. הרצה
npm run dev          # Frontend (port 5173)
cd server && npm run dev  # Backend (port 4000)
```

### Option 3: Production Deployment
```bash
# בנייה מקומית
./deploy.sh local

# Docker containers
./deploy.sh docker

# Fly.io
./deploy.sh fly

# Railway
./deploy.sh railway

# Render
./deploy.sh render
```

## Scripts

| Script | Description |
|--------|-------------|
| `./run-android.sh` | הרצה עם תמיכה בנייד Android |
| `./deploy.sh [mode]` | פריסה לסביבות שונות |
| `./stop-dev.sh` | עצירת שרתי פיתוח |

## API Endpoints

### Health
- `GET /health` - Server health check
- `GET /api/health` - API status

### Reagents (ריאגנטים)
- `GET /api/reagents` - List reagents
- `GET /api/reagents/:id` - Get reagent
- `POST /api/reagents` - Create reagent
- `PUT /api/reagents/:id` - Update reagent
- `DELETE /api/reagents/:id` - Soft delete

### Suppliers (ספקים)
- `GET /api/suppliers` - List suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier

### Orders (הזמנות)
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `POST /api/orders/:id/approve` - Approve order
- `POST /api/orders/:id/receive` - Receive items

### Batches (אצוות)
- `GET /api/batches` - List batches
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches` - Create batch
- `POST /api/batches/:id/withdraw` - Withdraw from batch

### Inventory (מלאי)
- `GET /api/inventory/drafts` - List inventory drafts
- `POST /api/inventory/drafts` - Create draft
- `POST /api/inventory/drafts/:id/complete` - Complete count

## Frontend Pages (52 screens)

### Core
- Dashboard - לוח בקרה
- InventoryCount - ספירת מלאי
- ManageReagents - ניהול ריאגנטים
- ManageSuppliers - ניהול ספקים
- Orders - הזמנות
- Deliveries - משלוחים
- WithdrawalRequests - בקשות משיכה
- BatchAndExpiryManagement - אצוות ותפוגות
- QualityAssurance - בקרת איכות

### More
- OutgoingShipments, NewShipment, EditShipment
- AlertsManagement, Reports, ActivityLog
- Contacts, SystemSettings, AdminPanel
- And 30+ more...

## Database Schema

### Main Entities (27 tables)
- **Supplier** - ספקים
- **SupplierContact** - אנשי קשר
- **Reagent** - ריאגנטים
- **ReagentBatch** - אצוות
- **Order** / **OrderItem** - הזמנות
- **WithdrawalRequest** - בקשות משיכה
- **Delivery** / **DeliveryItem** - משלוחים
- **Shipment** / **ShipmentItem** - משלוחים יוצאים
- **InventoryTransaction** - תנועות מלאי
- **InventoryCountDraft** - טיוטות ספירה
- **ActiveAlert** / **AlertRule** - התראות
- **User** - משתמשים
- **ActivityLog** - יומן פעילות

### Key Enums (16)
- Category: REAGENT, CELLS, CONSUMABLE
- StockStatus: NORMAL, LOW, CRITICAL, OUT_OF_STOCK
- BatchStatus: INCOMING, ACTIVE, EXPIRED, CONSUMED, ON_HOLD, DESTROYED
- OrderStatus: DRAFT, PENDING_SAP, APPROVED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CLOSED, CANCELLED

## Project Structure

```
Flow-Control/
├── DOCS/                    # Documentation (8+ files)
│   ├── complete-requirements-analysis.md
│   ├── data-dictionary.md
│   └── ...
├── server/                  # Backend
│   ├── prisma/schema.prisma # 27 models
│   ├── src/
│   │   ├── routes/         # 6 API route files
│   │   ├── services/       # 6 service files
│   │   └── ...
│   └── package.json
├── src/                     # Frontend
│   ├── pages/              # 52 page components
│   ├── components/         # 15 component folders
│   └── ...
├── docker-compose.yml       # PostgreSQL
├── run-android.sh          # Mobile dev script
├── deploy.sh               # Deployment script
├── PROJECT_STATUS.md       # Full status report
└── README.md
```

## Environment Variables

```env
# Server (.env)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control"
PORT=4000
NODE_ENV=development

# Frontend (.env)
VITE_API_URL=http://localhost:4000/api
```

## Documentation

- `PROJECT_STATUS.md` - Comprehensive status report
- `DOCS/complete-requirements-analysis.md` - Full requirements
- `DOCS/data-dictionary.md` - Data dictionary
- `DOCS/backend-work-plan.md` - Backend implementation plan

## What's Next

1. ✅ ~~Build React frontend~~ (Complete!)
2. ⚠️ Connect frontend to backend API
3. ⬜ Add authentication (JWT)
4. ⬜ Add file upload (COA documents)
5. ⬜ Deploy to production

## License

Private - Coriatel
