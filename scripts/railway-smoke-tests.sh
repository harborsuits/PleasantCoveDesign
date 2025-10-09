#!/bin/bash
# Railway Deployment Smoke Tests
# Run this after deploying to Railway to verify everything is working

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment variables are set
if [ -z "$API_URL" ]; then
    echo -e "${YELLOW}Setting default API_URL to localhost${NC}"
    API_URL="http://localhost:3000"
fi

if [ -z "$ADMIN_KEY" ]; then
    echo -e "${RED}ERROR: ADMIN_KEY not set${NC}"
    echo "Usage: ADMIN_KEY=your-admin-token API_URL=https://your-backend.railway.app $0"
    exit 1
fi

echo "🧪 Running Railway Deployment Smoke Tests"
echo "API URL: $API_URL"
echo ""

# Function to check test result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 1. Test health endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    check_result "Health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# 2. Test authentication
echo ""
echo "2. Testing admin authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/admin" \
  -H "Content-Type: application/json" \
  -d "{\"adminKey\":\"$ADMIN_KEY\"}")

JWT=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$JWT" ]; then
    check_result "Authentication successful"
    echo "   Got JWT: ${JWT:0:20}..."
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "   Response: $AUTH_RESPONSE"
    exit 1
fi

# 3. Test metrics endpoint
echo ""
echo "3. Testing metrics endpoint..."
METRICS_RESPONSE=$(curl -s "$API_URL/api/metrics")
if echo "$METRICS_RESPONSE" | grep -q "uptime"; then
    check_result "Metrics endpoint working"
    echo "   Uptime: $(echo "$METRICS_RESPONSE" | grep -o '"uptime":[0-9.]*' | cut -d: -f2) seconds"
else
    echo -e "${RED}❌ Metrics endpoint failed${NC}"
    exit 1
fi

# 4. Test admin conversations endpoint
echo ""
echo "4. Testing admin conversations endpoint..."
CONV_RESPONSE=$(curl -s "$API_URL/api/admin/conversations" \
  -H "Authorization: Bearer $JWT")
if echo "$CONV_RESPONSE" | grep -q "projectMessages"; then
    check_result "Admin endpoint accessible"
    COUNT=$(echo "$CONV_RESPONSE" | grep -o '"projectMessages":\[[^]]*' | grep -o '{' | wc -l | tr -d ' ')
    echo "   Found $COUNT conversations"
else
    echo -e "${RED}❌ Admin endpoint failed${NC}"
    echo "   Response: $CONV_RESPONSE"
    exit 1
fi

# 5. Test CORS headers
echo ""
echo "5. Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I "$API_URL/api/health" -H "Origin: https://test.com")
if echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin"; then
    check_result "CORS headers present"
else
    echo -e "${YELLOW}⚠️  CORS headers may need configuration${NC}"
fi

# 6. Test WebSocket endpoint (if wscat is available)
echo ""
echo "6. Testing WebSocket availability..."
if command -v wscat &> /dev/null; then
    WS_URL=$(echo "$API_URL" | sed 's/http/ws/g')
    timeout 2 wscat -c "$WS_URL/socket.io/?transport=websocket" 2>&1 | grep -q "connected" && \
        check_result "WebSocket endpoint reachable" || \
        echo -e "${YELLOW}⚠️  WebSocket test inconclusive${NC}"
else
    echo "   Skipping (wscat not installed)"
fi

echo ""
echo -e "${GREEN}🎉 All smoke tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open admin UI at: ${API_URL/backend/admin-ui}"
echo "2. Check Railway logs: railway logs --service=pcd-backend"
echo "3. Configure Squarespace widget with production URLs"
