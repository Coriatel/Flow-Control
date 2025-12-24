#!/bin/bash
# =============================================================================
# Flow Control - Stop Development Servers
# עצירת שרתי פיתוח
# =============================================================================

echo "עוצר שרתי פיתוח..."

# עצירת תהליכים שנשמרו
if [ -f /tmp/flow-control-pids ]; then
    read BACKEND_PID FRONTEND_PID < /tmp/flow-control-pids
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    rm /tmp/flow-control-pids
fi

# עצירת כל תהליכי vite ו-ts-node-dev
pkill -f "vite" 2>/dev/null
pkill -f "ts-node-dev" 2>/dev/null

# עצירת ADB reverse
if command -v adb &> /dev/null; then
    adb reverse --remove-all 2>/dev/null
fi

echo "✔ כל השרתים נעצרו"
