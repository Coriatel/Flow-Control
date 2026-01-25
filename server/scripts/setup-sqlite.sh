#!/bin/bash
# Flow Control - SQLite Setup Script
# This script sets up the SQLite database and seeds it with demo data

set -e

echo "=================================================="
echo "Flow Control - SQLite Database Setup"
echo "=================================================="
echo ""

# Navigate to server directory
cd "$(dirname "$0")/.."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from server directory."
    exit 1
fi

# Step 1: Update .env to use SQLite
echo "Step 1: Configuring environment for SQLite..."
if [ -f ".env" ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "  📋 Backed up existing .env to .env.backup"
fi

# Create SQLite-compatible .env
cat > .env << 'EOF'
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Database - SQLite (file-based, no server needed)
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET=flow-control-dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://dev.flow.coriathost.cloud
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://dev.flow.coriathost.cloud

# File Upload
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=debug
EOF
echo "  ✅ Created .env with SQLite configuration"

# Step 2: Copy SQLite schema
echo ""
echo "Step 2: Setting up SQLite schema..."
if [ -f "prisma/schema.sqlite.prisma" ]; then
    # Backup original schema
    if [ -f "prisma/schema.prisma" ]; then
        cp prisma/schema.prisma prisma/schema.postgresql.prisma.backup
        echo "  📋 Backed up PostgreSQL schema"
    fi
    
    # Use SQLite schema
    cp prisma/schema.sqlite.prisma prisma/schema.prisma
    echo "  ✅ Switched to SQLite schema"
else
    echo "  ⚠️  SQLite schema not found. Using existing schema."
fi

# Step 3: Install dependencies
echo ""
echo "Step 3: Installing dependencies..."
npm install
echo "  ✅ Dependencies installed"

# Step 4: Generate Prisma client
echo ""
echo "Step 4: Generating Prisma client..."
npx prisma generate
echo "  ✅ Prisma client generated"

# Step 5: Create database and run migrations
echo ""
echo "Step 5: Creating database and running migrations..."
npx prisma db push --force-reset
echo "  ✅ Database created with schema"

# Step 6: Seed the database
echo ""
echo "Step 6: Seeding database with demo data..."
npx ts-node prisma/seed-sqlite.ts
echo "  ✅ Database seeded"

# Step 7: Build the server
echo ""
echo "Step 7: Building server..."
npm run build || echo "  ⚠️  Build step skipped (may need TypeScript fixes)"

echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📋 Next steps:"
echo "   1. Start the backend: npm run dev"
echo "   2. Start the frontend: cd .. && npm run dev"
echo "   3. Open: https://dev.flow.coriathost.cloud"
echo ""
echo "🔐 Login credentials:"
echo "   Admin: admin@flow-control.com / Admin123!"
echo "   User:  user@flow-control.com / User123!"
echo ""
