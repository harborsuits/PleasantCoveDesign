# REPO MAP — Pleasant Cove Design

## Active Apps (Web Design Business Management)

### Core Services
- `api_gateway_minimal.py` → Backend API (Flask, port 8080)
- `demo_server.py` → Demo hosting (port 8010)
- `minimal_health_server.py` → Health monitoring (port 8003)
- `lead_tracker.py` → Lead management system
- `main.py` → Main application entry point

### Key Components
- `scrapers/` → Lead generation scrapers
- `templates/` → Email/website templates
- `demos/` → Generated demo websites
- `data/` → Database files

### HTML UIs
- `SQUARESPACE_MODULE_FINAL.html` → Client portal widget
- `MESSAGING_WIDGET_FINAL.html` → Chat widget
- `APPOINTMENT_WIDGET_FINAL.html` → Booking widget
- `admin-ui-test.html` → Admin interface test

## Archive (DO NOT IMPORT)

### `archive/trading/`
- **TRADING/BOT CODE** - Completely unrelated to web design business
- Contains: Tradier, Alpaca, Binance, paper trading, options trading code
- **Do not import from this directory**
- This was a separate trading bot project that got mixed into the repo

## API Contracts

- All Pleasant Cove APIs use `/api/v1/` prefix
- Health checks at `/health` endpoint
- CORS enabled for Squarespace embedding

## Environment

- `.env` contains only PCD-related variables (Stripe, SendGrid, R2 storage)
- No trading/broker API keys in PCD environment

## Port Mapping

- 8080 → Backend API
- 8010 → Demo server
- 8003 → Health dashboard
- 8090 → Widget server (if needed)


