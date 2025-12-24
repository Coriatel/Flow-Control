#!/bin/bash
# =============================================================================
# Flow Control - Production Deployment Script
# סקריפט פריסה לסביבת ייצור
# =============================================================================

set -e

# צבעים
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# הגדרות ברירת מחדל
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_DIR/dist"
DEPLOY_MODE="${1:-local}"  # local, docker, fly, railway, render

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Flow Control - Production Deployment                 ║"
echo "║          פריסת מערכת לסביבת ייצור                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# פונקציות עזר
# =============================================================================

print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✖ $1${NC}"
    exit 1
}

print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

usage() {
    echo "שימוש: $0 [MODE]"
    echo ""
    echo "מצבי פריסה:"
    echo "  local    - בנייה מקומית בלבד (ברירת מחדל)"
    echo "  docker   - בנייה והפעלת Docker containers"
    echo "  fly      - פריסה ל-Fly.io"
    echo "  railway  - פריסה ל-Railway"
    echo "  render   - פריסה ל-Render"
    echo ""
    echo "דוגמאות:"
    echo "  $0 local"
    echo "  $0 docker"
    echo "  $0 fly"
}

# =============================================================================
# בדיקות מקדימות
# =============================================================================

check_requirements() {
    print_step "בודק דרישות מערכת..."

    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js לא מותקן!"
    fi
    print_success "Node.js $(node -v)"

    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm לא מותקן!"
    fi
    print_success "npm $(npm -v)"

    # Git
    if ! command -v git &> /dev/null; then
        print_warning "Git לא מותקן"
    else
        print_success "Git $(git --version | cut -d' ' -f3)"
    fi
}

# =============================================================================
# בנייה מקומית
# =============================================================================

build_frontend() {
    print_step "בונה Frontend..."

    cd "$PROJECT_DIR"

    # התקנת תלויות אם צריך
    if [ ! -d "node_modules" ]; then
        echo "מתקין תלויות..."
        npm install
    fi

    # בנייה
    echo "בונה אפליקציה..."
    npm run build

    if [ -d "$BUILD_DIR" ]; then
        print_success "Frontend נבנה ב: $BUILD_DIR"
        echo "גודל: $(du -sh $BUILD_DIR | cut -f1)"
    else
        print_error "בניית Frontend נכשלה!"
    fi
}

build_backend() {
    print_step "בונה Backend..."

    cd "$PROJECT_DIR/server"

    # התקנת תלויות
    if [ ! -d "node_modules" ]; then
        echo "מתקין תלויות..."
        npm install
    fi

    # Generate Prisma client
    echo "מייצר Prisma client..."
    npx prisma generate 2>/dev/null || print_warning "Prisma generate נכשל - יש להריץ מקומית"

    # בנייה TypeScript
    echo "מקמפל TypeScript..."
    npm run build

    if [ -d "dist" ]; then
        print_success "Backend נבנה ב: server/dist"
    else
        print_error "בניית Backend נכשלה!"
    fi
}

# =============================================================================
# Docker Deployment
# =============================================================================

deploy_docker() {
    print_step "פריסת Docker..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker לא מותקן!"
    fi

    # יצירת Dockerfile לפרונטנד
    cat > "$PROJECT_DIR/Dockerfile.frontend" << 'EOF'
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # יצירת Dockerfile לבקנד
    cat > "$PROJECT_DIR/server/Dockerfile" << 'EOF'
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]
EOF

    # יצירת nginx config
    cat > "$PROJECT_DIR/nginx.conf" << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # יצירת docker-compose מלא
    cat > "$PROJECT_DIR/docker-compose.prod.yml" << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: flow-control-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: flow_control
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - flow-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: flow-control-backend
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-postgres}@postgres:5432/flow_control
      PORT: 4000
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - flow-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: flow-control-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - flow-network

volumes:
  postgres_data:

networks:
  flow-network:
    driver: bridge
EOF

    # בנייה והפעלה
    echo "בונה ומפעיל containers..."
    docker-compose -f docker-compose.prod.yml up --build -d

    print_success "Docker containers פועלים!"
    echo ""
    echo "גישה לאפליקציה: http://localhost"
    echo ""
    echo "פקודות שימושיות:"
    echo "  docker-compose -f docker-compose.prod.yml logs -f  # צפייה בלוגים"
    echo "  docker-compose -f docker-compose.prod.yml down     # עצירה"
}

# =============================================================================
# Fly.io Deployment
# =============================================================================

deploy_fly() {
    print_step "פריסה ל-Fly.io..."

    if ! command -v flyctl &> /dev/null; then
        print_error "flyctl לא מותקן! התקן מ: https://fly.io/docs/hands-on/install-flyctl/"
    fi

    # בדיקת התחברות
    if ! flyctl auth whoami &> /dev/null; then
        echo "מתחבר ל-Fly.io..."
        flyctl auth login
    fi

    # יצירת fly.toml
    cat > "$PROJECT_DIR/fly.toml" << 'EOF'
app = "flow-control"
primary_region = "fra"

[build]
  dockerfile = "Dockerfile.fly"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
EOF

    # יצירת Dockerfile משולב
    cat > "$PROJECT_DIR/Dockerfile.fly" << 'EOF'
# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Build backend
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ .
RUN npm run build

# Production image
FROM node:22-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# Copy frontend build to be served
COPY --from=frontend-builder /app/dist ./public

EXPOSE 8080
CMD ["node", "dist/server.js"]
EOF

    # פריסה
    echo "מפרוס ל-Fly.io..."
    flyctl deploy

    print_success "הפריסה הושלמה!"
    echo ""
    echo "גישה לאפליקציה:"
    flyctl status
}

# =============================================================================
# Railway Deployment
# =============================================================================

deploy_railway() {
    print_step "פריסה ל-Railway..."

    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI לא מותקן! התקן מ: https://docs.railway.app/develop/cli"
    fi

    # יצירת railway.json
    cat > "$PROJECT_DIR/railway.json" << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

    # יצירת nixpacks.toml
    cat > "$PROJECT_DIR/nixpacks.toml" << 'EOF'
[phases.setup]
nixPkgs = ["nodejs-22_x", "npm"]

[phases.install]
cmds = ["npm install", "cd server && npm install"]

[phases.build]
cmds = ["npm run build", "cd server && npm run build"]

[start]
cmd = "cd server && npm start"
EOF

    echo "מפרוס ל-Railway..."
    railway up

    print_success "הפריסה הושלמה!"
}

# =============================================================================
# Render Deployment
# =============================================================================

deploy_render() {
    print_step "הכנה לפריסה ל-Render..."

    # יצירת render.yaml
    cat > "$PROJECT_DIR/render.yaml" << 'EOF'
services:
  # Backend API
  - type: web
    name: flow-control-api
    env: node
    region: frankfurt
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: flow-control-db
          property: connectionString

  # Frontend
  - type: web
    name: flow-control-web
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  - name: flow-control-db
    databaseName: flow_control
    user: flow_control
    region: frankfurt
EOF

    print_success "קובץ render.yaml נוצר"
    echo ""
    echo "צעדים הבאים:"
    echo "1. התחבר ל-Render: https://dashboard.render.com"
    echo "2. צור 'New Blueprint' והעלה את הריפו"
    echo "3. Render יקרא את render.yaml ויפרוס אוטומטית"
}

# =============================================================================
# Main
# =============================================================================

case "$DEPLOY_MODE" in
    local)
        check_requirements
        build_frontend
        build_backend
        echo ""
        print_success "הבנייה הושלמה!"
        echo ""
        echo "להרצה מקומית:"
        echo "  cd server && npm start    # Backend"
        echo "  npx serve dist            # Frontend (static)"
        ;;
    docker)
        check_requirements
        deploy_docker
        ;;
    fly)
        check_requirements
        build_frontend
        build_backend
        deploy_fly
        ;;
    railway)
        check_requirements
        deploy_railway
        ;;
    render)
        check_requirements
        deploy_render
        ;;
    -h|--help|help)
        usage
        ;;
    *)
        print_error "מצב לא מוכר: $DEPLOY_MODE"
        usage
        ;;
esac

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  פריסה הושלמה בהצלחה! ✔${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
