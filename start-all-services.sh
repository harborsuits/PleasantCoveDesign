#!/bin/bash

# Pleasant Cove Design - Start All Services
# This script starts all necessary services for the complete system

echo "🚀 Starting Pleasant Cove Design Services..."
echo "=========================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo "Killing process on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Check and prepare ports
echo ""
echo "Checking ports..."
echo "-----------------"

# Check main ports
PORTS=(3000 5173 8080)
for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        read -p "Kill process on port $port? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port $port
            sleep 1
        else
            echo "❌ Cannot proceed with port $port in use"
            exit 1
        fi
    fi
done

# Create necessary directories
echo ""
echo "Creating directories..."
echo "----------------------"
mkdir -p uploads
mkdir -p data
mkdir -p logs
echo "✅ Directories ready"

# Check for .env file
echo ""
echo "Checking environment..."
echo "----------------------"
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cat > .env << 'EOF'
# Pleasant Cove Design Environment Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Production URLs (Railway deployment)
API_BASE_URL=https://pcd-production-clean-production-e6f3.up.railway.app
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5173

# For local development
LOCAL_API_URL=http://localhost:3000
LOCAL_FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=./pleasantcove.db

# CORS Configuration
CORS_ORIGINS="http://localhost:5173 http://localhost:3000 http://localhost:8080 https://pcd-production-clean-production-e6f3.up.railway.app https://*.squarespace.com"

# Authentication & Security
JWT_SECRET=pleasant-cove-dev-jwt-secret-2025
SESSION_SECRET=pleasant-cove-dev-session-secret-2025
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# File Storage
LOCAL_UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_WEBSOCKETS=true
ENABLE_FILE_UPLOADS=true

# WebSocket Configuration
WS_PORT=8080
WS_CORS_ORIGINS="http://localhost:5173 https://*.squarespace.com"

# Development
DEBUG=false
LOG_LEVEL=info
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file exists"
fi

# Function to start a service in background
start_service() {
    local name=$1
    local command=$2
    local log_file="logs/${name}.log"
    
    echo ""
    echo "Starting $name..."
    echo "Command: $command"
    
    # Start the service and redirect output to log file
    nohup bash -c "$command" > "$log_file" 2>&1 &
    local pid=$!
    
    # Give it a moment to start
    sleep 2
    
    # Check if process is still running
    if ps -p $pid > /dev/null; then
        echo "✅ $name started (PID: $pid)"
        echo $pid > "logs/${name}.pid"
        return 0
    else
        echo "❌ Failed to start $name"
        echo "Check logs: tail -f $log_file"
        return 1
    fi
}

# Start services
echo ""
echo "Starting services..."
echo "==================="

# 1. Start Backend API
if [ -d "server" ]; then
    cd server
    if [ -f "package.json" ]; then
        echo "Installing server dependencies..."
        npm install --silent
        cd ..
        start_service "backend-api" "cd server && npm run dev"
    else
        echo "⚠️  No server directory found"
    fi
    cd ..
fi

# 2. Start Admin UI
if [ -d "admin-ui" ]; then
    cd admin-ui
    if [ -f "package.json" ]; then
        echo "Installing admin-ui dependencies..."
        npm install --silent
        cd ..
        start_service "admin-ui" "cd admin-ui && npm run dev"
    else
        echo "⚠️  No admin-ui directory found"
    fi
    cd ..
fi

# 3. Start Widget Server (simple HTTP server for widgets)
if [ -d "widgets" ]; then
    start_service "widget-server" "cd widgets && python3 -m http.server 8080"
fi

# 4. Start any Python services
if [ -f "api_gateway_complete.py" ]; then
    echo "Checking Python dependencies..."
    pip3 install flask flask-cors redis PyJWT > /dev/null 2>&1
    start_service "api-gateway" "python3 api_gateway_complete.py"
fi

# Wait a moment for services to stabilize
sleep 3

# Check service status
echo ""
echo "Service Status:"
echo "==============="

# Function to check if service is running
check_service() {
    local name=$1
    local port=$2
    local url=$3
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ $name is running on port $port"
        if [ ! -z "$url" ]; then
            echo "   Access at: $url"
        fi
        return 0
    else
        echo "❌ $name is NOT running on port $port"
        return 1
    fi
}

# Check each service
check_service "Backend API" 3000 "http://localhost:3000"
check_service "Admin UI" 5173 "http://localhost:5173"
check_service "Widget Server" 8080 "http://localhost:8080"

# Show widget URLs
echo ""
echo "Squarespace Widgets Available:"
echo "=============================="
echo "📱 Messaging Widget: http://localhost:8080/messaging-widget-unified.html"
echo "📊 Project Workspace: http://localhost:8080/squarespace-module.html"
echo "📅 Appointment Booking: http://localhost:8080/appointment-booking.html"

# Show logs location
echo ""
echo "Logs:"
echo "====="
echo "View logs with: tail -f logs/*.log"

# Instructions
echo ""
echo "🎉 Pleasant Cove Design is ready!"
echo "================================="
echo ""
echo "Next steps:"
echo "1. Open Admin Dashboard: http://localhost:5173"
echo "2. Test widgets at: http://localhost:8080"
echo "3. Copy widget code to your Squarespace site"
echo ""
echo "To stop all services, run: ./stop-all-services.sh"
echo ""

# Save process IDs for stop script
cat > logs/services.pid << EOF
# Pleasant Cove Design Service PIDs
# Generated at: $(date)
EOF

# Keep script running to maintain services
echo "Services are running. Press Ctrl+C to stop all services."
trap 'echo "Stopping services..."; pkill -P $$; exit' INT

# Wait indefinitely
while true; do
    sleep 60
done
