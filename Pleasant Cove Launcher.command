#!/bin/bash

# Pleasant Cove Design Unified Launcher
# Launches the comprehensive Node.js launcher application

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pleasant Cove Design Unified Launcher${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    echo -e "${YELLOW}💡 Visit: https://nodejs.org/${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "launcher.js" ]; then
    echo -e "${RED}❌ launcher.js not found. Please run this from the Pleasant Cove Design directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found${NC}"
echo -e "${YELLOW}🚀 Starting launcher...${NC}"
echo ""

# Run the launcher
node launcher.js

echo ""
echo -e "${BLUE}👋 Launcher closed${NC}"
