#!/bin/bash

# Pleasant Cove Design - Health Monitoring Script
# Checks all services are running and responding

set -e

echo "🔍 Pleasant Cove Design Health Check"
echo "===================================="

# Service endpoints to check
services=(
    "API:http://localhost:8080/health"
    "Admin:http://localhost:5173/health"
    "Health:http://localhost:8003/health"
    "Demo:http://localhost:8010/health"
)

all_healthy=true

for service in "${services[@]}"; do
    name="${service%%:*}"
    url="${service#*:}"

    echo -n "$name: "

    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo "✅ UP"
    else
        echo "❌ DOWN"
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo "🎉 All services are healthy!"
    exit 0
else
    echo "⚠️  Some services are down. Check the output above."
    exit 1
fi
