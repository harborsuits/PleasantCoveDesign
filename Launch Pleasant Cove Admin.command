#!/bin/bash

# Pleasant Cove Design Admin Launcher
# Starts the admin interface and opens your browser

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pleasant Cove Design Admin${NC}"
echo -e "${BLUE}==============================${NC}"

# Check if admin UI is already running
if curl -sf http://localhost:5173/health > /dev/null; then
    echo -e "${GREEN}✅ Admin UI is already running${NC}"
else
    echo -e "${YELLOW}🚀 Starting Admin UI...${NC}"
    cd "$(dirname "$0")/admin-ui"
    python3 server.py &
    ADMIN_PID=$!

    # Wait for UI to start
    echo -e "${YELLOW}⏳ Waiting for Admin UI to start...${NC}"
    for i in {1..10}; do
        if curl -sf http://localhost:5173/health > /dev/null; then
            echo -e "${GREEN}✅ Admin UI started successfully${NC}"
            break
        fi
        sleep 1
    done
fi

echo ""
echo -e "${GREEN}📊 Your Admin Dashboard${NC}"
echo -e "${GREEN}🌐 http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop the launcher${NC}"
echo -e "${YELLOW}💡 The admin UI will keep running in the background${NC}"

# Open browser
sleep 1
open "http://localhost:5173/"

# Keep script running
echo ""
echo -e "${BLUE}🎉 Ready! Your admin dashboard is open.${NC}"
echo -e "${YELLOW}💡 This terminal window can be closed - the admin UI will stay running.${NC}"

# Wait for user to stop
trap 'echo -e "\n${BLUE}👋 Launcher stopped${NC}"; exit 0' INT
while true; do
    sleep 1
done
