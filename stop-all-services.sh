#!/bin/bash

# Pleasant Cove Design - Stop All Services
# This script stops all running services

echo "🛑 Stopping Pleasant Cove Design Services..."
echo "==========================================="

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    echo -n "Stopping $name (port $port)... "
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo "✅ Stopped"
    else
        echo "⚠️  Not running"
    fi
}

# Kill services by port
kill_port 3000 "Backend API"
kill_port 5173 "Admin UI"
kill_port 8080 "Widget Server"
kill_port 5000 "API Gateway"

# Kill any node processes
echo ""
echo "Cleaning up Node processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Kill Python services
echo "Cleaning up Python processes..."
pkill -f "python3 -m http.server" 2>/dev/null || true
pkill -f "api_gateway" 2>/dev/null || true

# Clean up PID files
if [ -d "logs" ]; then
    rm -f logs/*.pid 2>/dev/null
fi

echo ""
echo "✅ All services stopped"
echo ""
echo "To restart, run: ./start-all-services.sh"
