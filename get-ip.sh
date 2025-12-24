#!/bin/bash
# =============================================================================
# Flow Control - Get IP for Mobile Access
# קבלת כתובת IP לגישה מהנייד
# =============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          כתובות גישה לאפליקציה מהנייד                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# קבלת IP לפי מערכת הפעלה
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    WIFI_IP=$(ipconfig getifaddr en0 2>/dev/null)
    ETH_IP=$(ipconfig getifaddr en1 2>/dev/null)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    WIFI_IP=$(ip addr show wlan0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    ETH_IP=$(ip addr show eth0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    # אם לא נמצא, נסה דרך אחרת
    if [ -z "$WIFI_IP" ] && [ -z "$ETH_IP" ]; then
        WIFI_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    WIFI_IP=$(ipconfig | grep -A 4 "Wireless" | grep "IPv4" | awk '{print $NF}')
    ETH_IP=$(ipconfig | grep -A 4 "Ethernet" | grep "IPv4" | awk '{print $NF}')
fi

echo "📱 הכנס בדפדפן בנייד (Xiaomi):"
echo ""

if [ -n "$WIFI_IP" ]; then
    echo "   WiFi:     http://$WIFI_IP:5173"
fi

if [ -n "$ETH_IP" ]; then
    echo "   Ethernet: http://$ETH_IP:5173"
fi

# הצגת כל ה-IPs האפשריים
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "כל כתובות ה-IP במחשב:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "   " $2}'
else
    hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$' | awk '{print "   " $1}'
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  חשוב:"
echo "   1. המחשב והנייד חייבים להיות על אותה רשת WiFi"
echo "   2. וודא שהשרת רץ (./run-android.sh)"
echo "   3. אם לא עובד, בדוק Firewall"
echo ""
