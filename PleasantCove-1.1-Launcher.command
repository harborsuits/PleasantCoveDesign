#!/bin/bash

# Pleasant Cove Design v1.1 Launcher
cd "/Users/bendickinson/Desktop/pleasantcovedesign/pleasantcovedesign"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pleasant Cove Design v1.1 Launcher${NC}"
echo -e "${BLUE}===========================================${NC}"

# Kill any existing processes on both ports
echo -e "${YELLOW}🔧 Cleaning up existing processes...${NC}"
pkill -f "tsx server" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start BOTH backend and React UI
echo -e "${YELLOW}🚀 Starting Backend Server and React UI...${NC}"
npm run dev &
SERVER_PID=$!

# Wait for both backend and frontend to start
echo -e "${YELLOW}⏳ Waiting for system to initialize...${NC}"
sleep 12

# Test if backend server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pleasant Cove Design v1.1 is running successfully!${NC}"
    echo -e "${GREEN}📍 Admin UI: http://localhost:5173${NC}"
    echo -e "${GREEN}🔗 Backend API: http://localhost:3000/api/*${NC}"
    echo -e "${GREEN}🎯 Webhook URL: http://localhost:3000/api/new-lead${NC}"
    echo ""
    echo -e "${BLUE}📋 Quick Access:${NC}"
    echo -e "${BLUE}• Dashboard: http://localhost:5173/dashboard${NC}"
    echo -e "${BLUE}• Inbox: http://localhost:5173/inbox${NC}"
    echo ""
    
    # Open the Admin Inbox automatically
    echo -e "${YELLOW}🌐 Opening Admin Inbox...${NC}"
    open http://localhost:5173/inbox
    
    echo -e "${GREEN}🎉 System is ready!${NC}"
    echo -e "${YELLOW}💡 Press Ctrl+C in terminal to stop the server${NC}"
    
    # Keep the script running so user can see the output
    wait $SERVER_PID
else
    echo -e "${RED}❌ Failed to start Pleasant Cove Design v1.1${NC}"
    echo -e "${RED}Please check for errors above and try again${NC}"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi 