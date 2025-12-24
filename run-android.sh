#!/bin/bash
# =============================================================================
# Flow Control - Android Development Script
# הרצת האפליקציה על מכשיר Android (Xiaomi/כל מכשיר אחר)
# =============================================================================

set -e

# צבעים לפלט
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# הגדרות
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PORT=5173
BACKEND_PORT=4000

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Flow Control - Android Development                   ║"
echo "║          מערכת ניהול מלאי לבנק דם                            ║"
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
}

print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

get_local_ip() {
    # קבלת כתובת IP מקומית
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
    else
        # Linux
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "")
    fi

    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="localhost"
    fi
    echo "$LOCAL_IP"
}

check_adb() {
    if command -v adb &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# בדיקות מקדימות
# =============================================================================

print_step "בדיקת דרישות מערכת..."

# בדיקת Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js לא מותקן!"
    echo "התקן מ: https://nodejs.org/"
    exit 1
fi
print_success "Node.js $(node -v)"

# בדיקת npm
if ! command -v npm &> /dev/null; then
    print_error "npm לא מותקן!"
    exit 1
fi
print_success "npm $(npm -v)"

# בדיקת Docker (אופציונלי)
if command -v docker &> /dev/null; then
    print_success "Docker מותקן"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker לא מותקן - תצטרך להריץ PostgreSQL ידנית"
    DOCKER_AVAILABLE=false
fi

# קבלת IP מקומי
LOCAL_IP=$(get_local_ip)
print_success "כתובת IP מקומית: $LOCAL_IP"

# =============================================================================
# הגדרת סביבה
# =============================================================================

print_step "הגדרת קבצי סביבה..."

# יצירת .env לפרונטנד אם לא קיים
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > "$PROJECT_DIR/.env" << EOF
VITE_API_URL=http://$LOCAL_IP:$BACKEND_PORT/api
VITE_WS_URL=ws://$LOCAL_IP:$BACKEND_PORT
EOF
    print_success "נוצר קובץ .env לפרונטנד"
fi

# יצירת .env לבקנד אם לא קיים
if [ ! -f "$PROJECT_DIR/server/.env" ]; then
    cat > "$PROJECT_DIR/server/.env" << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control"
PORT=$BACKEND_PORT
NODE_ENV=development
CORS_ORIGIN=http://$LOCAL_IP:$FRONTEND_PORT
EOF
    print_success "נוצר קובץ .env לבקנד"
fi

# =============================================================================
# התקנת תלויות
# =============================================================================

print_step "בדיקת והתקנת תלויות..."

# Frontend dependencies
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "מתקין תלויות פרונטנד..."
    cd "$PROJECT_DIR"
    npm install
fi

# Backend dependencies
if [ ! -d "$PROJECT_DIR/server/node_modules" ]; then
    echo "מתקין תלויות בקנד..."
    cd "$PROJECT_DIR/server"
    npm install
fi

print_success "כל התלויות מותקנות"

# =============================================================================
# הפעלת מסד נתונים
# =============================================================================

print_step "בדיקת מסד נתונים..."

if [ "$DOCKER_AVAILABLE" = true ]; then
    # בדיקה אם הקונטיינר כבר רץ
    if docker ps --format '{{.Names}}' | grep -q "flow-control-db"; then
        print_success "PostgreSQL כבר רץ"
    else
        # בדיקה אם הקונטיינר קיים אבל לא רץ
        if docker ps -a --format '{{.Names}}' | grep -q "flow-control-db"; then
            echo "מפעיל קונטיינר PostgreSQL קיים..."
            docker start flow-control-db
        else
            echo "מפעיל PostgreSQL חדש..."
            cd "$PROJECT_DIR"
            docker-compose up -d
        fi

        # המתנה שמסד הנתונים יהיה מוכן
        echo "ממתין למסד נתונים..."
        sleep 5
        print_success "PostgreSQL מופעל"
    fi
else
    print_warning "הפעל PostgreSQL ידנית על פורט 5432"
    echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flow_control"
fi

# =============================================================================
# ADB - חיבור למכשיר Android
# =============================================================================

print_step "בדיקת חיבור ADB..."

if check_adb; then
    # רשימת מכשירים מחוברים
    DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')

    if [ "$DEVICES" -gt 0 ]; then
        print_success "נמצאו $DEVICES מכשירים מחוברים"

        # הצגת פרטי המכשיר
        echo ""
        echo "מכשירים מחוברים:"
        adb devices -l

        # הפניית פורטים דרך ADB
        print_step "הגדרת port forwarding..."
        adb reverse tcp:$FRONTEND_PORT tcp:$FRONTEND_PORT 2>/dev/null || true
        adb reverse tcp:$BACKEND_PORT tcp:$BACKEND_PORT 2>/dev/null || true
        print_success "Port forwarding מוגדר"

    else
        print_warning "אין מכשירים מחוברים"
        echo ""
        echo "הוראות חיבור מכשיר Xiaomi:"
        echo "1. הפעל 'Developer Options' בהגדרות"
        echo "2. הפעל 'USB Debugging'"
        echo "3. חבר את המכשיר בכבל USB"
        echo "4. אשר את החיבור על המכשיר"
        echo ""
        echo "או השתמש בחיבור WiFi:"
        echo "גש לכתובת: http://$LOCAL_IP:$FRONTEND_PORT"
    fi
else
    print_warning "ADB לא מותקן"
    echo ""
    echo "להתקנת ADB:"
    echo "  macOS: brew install android-platform-tools"
    echo "  Linux: sudo apt install adb"
    echo "  Windows: הורד מ Android SDK"
    echo ""
    echo "או פשוט השתמש בדפדפן במכשיר:"
    echo "גש לכתובת: http://$LOCAL_IP:$FRONTEND_PORT"
fi

# =============================================================================
# הפעלת השרתים
# =============================================================================

print_step "מפעיל שרתים..."

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  כתובות גישה:${NC}"
echo ""
echo -e "  📱 ${YELLOW}מכשיר Android (WiFi):${NC}"
echo -e "     http://$LOCAL_IP:$FRONTEND_PORT"
echo ""
echo -e "  💻 ${YELLOW}מחשב מקומי:${NC}"
echo -e "     http://localhost:$FRONTEND_PORT"
echo ""
echo -e "  🔧 ${YELLOW}Backend API:${NC}"
echo -e "     http://$LOCAL_IP:$BACKEND_PORT/api"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# הפעלה במקביל
echo -e "${YELLOW}מפעיל Backend...${NC}"
cd "$PROJECT_DIR/server"
npm run dev &
BACKEND_PID=$!

sleep 2

echo -e "${YELLOW}מפעיל Frontend...${NC}"
cd "$PROJECT_DIR"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# שמירת PIDs לסגירה
echo "$BACKEND_PID $FRONTEND_PID" > /tmp/flow-control-pids

echo ""
echo -e "${GREEN}✔ שרתים פעילים!${NC}"
echo ""
echo "לעצירה: Ctrl+C או ./stop-dev.sh"
echo ""

# המתנה לסיום
wait
