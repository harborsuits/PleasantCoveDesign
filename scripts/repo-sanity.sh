#!/bin/bash

# Pleasant Cove Design - Repository Sanity Check
# Ensures no contamination from archived trading code

set -e

echo "🔍 Checking repository sanity..."

# Check for archive imports (should fail if found)
if git grep -n "archive/" -- '*.py' '*.ts' '*.js' '*.html' >/dev/null 2>&1; then
    echo "❌ ERROR: Found imports from archive/ directory:"
    git grep -n "archive/" -- '*.py' '*.ts' '*.js' '*.html'
    echo ""
    echo "💡 Fix: Remove these imports. Archive code is quarantined and should not be used."
    exit 1
fi

# Check for trading keywords in active code
TRADING_KEYWORDS="alpaca|tradier|polygon|ccxt|yfinance|binance|paper.trading|options.trading|websocket.trading"
if git grep -nE "$TRADING_KEYWORDS" -- '*.py' '*.ts' '*.js' | grep -v archive/ >/dev/null 2>&1; then
    echo "❌ ERROR: Found trading-related code in active files:"
    git grep -nE "$TRADING_KEYWORDS" -- '*.py' '*.ts' '*.js' | grep -v archive/
    echo ""
    echo "💡 Fix: Move trading code to archive/ directory."
    exit 1
fi

# Check for trading env vars in active .env files
if git grep -nE "TRADIER_|ALPACA_|BROKER_|API_KEY.*trading|SECRET_KEY.*trading" -- .env* | grep -v archive/ >/dev/null 2>&1; then
    echo "❌ ERROR: Found trading API keys in active .env files:"
    git grep -nE "TRADIER_|ALPACA_|BROKER_|API_KEY.*trading|SECRET_KEY.*trading" -- .env* | grep -v archive/
    echo ""
    echo "💡 Fix: Move trading credentials to archived project."
    exit 1
fi

echo "✅ Repository is clean - no trading code contamination detected"
