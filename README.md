# Flow Control - Blood Bank Inventory Management System

מערכת ניהול מלאי למעבדת בנק דם

## Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 27 tables, 16 enums |
| SQL Migration | ✅ Complete | PostgreSQL 16 |
| Backend API | ✅ Complete | Express 5.1 + TypeScript |
| Services Layer | ✅ Complete | 6 services |
| API Routes | ✅ Complete | RESTful endpoints |
| Prisma ORM | ⚠️ Needs Setup | See "Local Setup" below |
| Frontend | ❌ Not Started | React + Vite planned |

## Tech Stack

- **Backend**: Node.js 22, Express 5.1, TypeScript 5.9
- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.x
- **Frontend** (planned): React 18, Vite, TailwindCSS

## Local Setup (IMPORTANT!)

The development environment had network restrictions that blocked Prisma binary downloads. A workaround was used. **On your local machine, you need to set up Prisma properly:**

```bash
# 1. Clone and enter the project
git clone https://github.com/Coriatel/Flow-Control.git
cd Flow-Control/server

# 2. Install dependencies
npm install

# 3. Install Prisma (if not already)
npm install @prisma/client prisma

# 4. Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/flow_control"

# 5. Generate Prisma client
npx prisma generate

# 6. Create database and run migrations
npx prisma migrate dev --name init

# 7. (Optional) Delete the workaround file
rm -rf generated/prisma/index.ts

# 8. Start the server
npm run dev
```

## API Endpoints

### Health
- `GET /api/health` - Server status

### Dashboard
- `GET /api/dashboard` - Dashboard with statistics

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

## Database Schema

### Main Entities
- **Supplier** - ספקים
- **SupplierContact** - אנשי קשר
- **Reagent** - ריאגנטים/מוצרים
- **ReagentBatch** - אצוות
- **Order** - הזמנות
- **OrderItem** - פריטי הזמנה
- **InventoryTransaction** - תנועות מלאי
- **InventoryDraft** - טיוטות ספירה
- **WithdrawalRequest** - בקשות משיכה
- **ActivityLog** - יומן פעילות

### Key Enums
- **Category**: REAGENT, KIT, CONTROL, CALIBRATOR, CONSUMABLE, OTHER
- **StockStatus**: NORMAL, LOW, CRITICAL, OUT_OF_STOCK
- **BatchStatus**: ACTIVE, EXPIRED, CONSUMED, DESTROYED
- **OrderStatus**: DRAFT, PENDING_APPROVAL, APPROVED, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED

## Project Structure

```
Flow-Control/
├── docs/
│   └── requirements-analysis.md    # מסמך דרישות (64K שורות צ'אט)
├── server/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma schema (27 models)
│   ├── sql/
│   │   └── migration.sql           # SQL migration (backup)
│   ├── src/
│   │   ├── routes/                 # API routes
│   │   ├── services/               # Business logic
│   │   ├── middleware/             # Error handling, auth
│   │   ├── types/                  # TypeScript types
│   │   └── server.ts               # Entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flow_control"
PORT=4000
NODE_ENV=development
```

## Development Scripts

```bash
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm run start    # Run compiled version
npm run lint     # Run ESLint
```

## What's Next

1. **Set up Prisma properly** (see Local Setup above)
2. **Add seed data** for testing
3. **Build the React frontend**
4. **Add authentication** (JWT)
5. **Deploy** to production

## Documentation

- `docs/requirements-analysis.md` - Full requirements from original chat
- `DOCS/` folder - Original Base44 documentation

## License

Private - Coriatel
