const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const app = express();
const PORT = 4000;

// Basic middleware
app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    server: 'minimal-live-api'
  });
});

// Alerts endpoint
app.get('/api/alerts', (req, res) => {
  res.json([]);
});

// Autoloop status endpoints
app.get('/api/autoloop/status', (req, res) => {
  res.json({
    is_running: true,
    status: 'IDLE',
    interval_ms: 30000,
    last_cycle: new Date().toISOString(),
    next_cycle: new Date(Date.now() + 30000).toISOString()
  });
});

app.get('/api/audit/autoloop/status', (req, res) => {
  res.json({
    is_running: true,
    status: 'IDLE',
    interval_ms: 30000,
    coordination_audit: {
      rawSignals: 0,
      winners: 0,
      conflicts: 0
    },
    risk_rejections: [],
    allocation_summary: {}
  });
});

// Ingestion/events endpoint
app.get('/api/ingestion/events', (req, res) => {
  res.json([]);
});

// Roster endpoint
app.get('/api/roster/active', (req, res) => {
  res.json({
    symbols: ['SPY', 'AAPL', 'QQQ', 'MSFT', 'NVDA'],
    count: 5,
    timestamp: new Date().toISOString()
  });
});

// Bars endpoint
app.get('/api/bars', (req, res) => {
  const { symbol = 'SPY', timeframe = '1Day', limit = 30 } = req.query;
  const limitNum = parseInt(limit) || 30;

  // Use same realistic base prices as quotes endpoint
  const basePrices = {
    'NVDA': 142.50,
    'TSLA': 275.00,
    'AAPL': 235.00,
    'MSFT': 425.00,
    'GOOGL': 165.00,
    'AMZN': 185.00,
    'META': 585.00,
    'SPY': 575.00,
    'QQQ': 485.00,
    'VIX': 18.50
  };

  // Generate mock OHLCV bars
  const bars = [];
  const basePrice = basePrices[symbol] || 100; // Use realistic base price
  let currentPrice = basePrice;

  for (let i = limitNum - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Generate realistic OHLC based on current price
    const volatility = 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;

    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
    // Realistic volume based on symbol type
    let baseVolume = 1000000; // Default
    if (['NVDA', 'TSLA', 'AAPL', 'MSFT'].includes(symbol)) {
      baseVolume = 50000000 + Math.random() * 50000000; // Large cap stocks
    } else if (['SPY', 'QQQ'].includes(symbol)) {
      baseVolume = 100000000 + Math.random() * 200000000; // ETFs
    } else {
      baseVolume = 1000000 + Math.random() * 9000000; // Other stocks
    }
    const volume = Math.floor(baseVolume);

    bars.push({
      t: date.toISOString(),
      o: Math.round(open * 100) / 100,
      h: Math.round(high * 100) / 100,
      l: Math.round(low * 100) / 100,
      c: Math.round(close * 100) / 100,
      v: volume
    });

    currentPrice = close;
  }

  // Return bars array directly (the hook handles both formats)
  res.json(bars);
});

// Quotes endpoint using real Tradier API
app.get('/api/quotes', async (req, res) => {
  const symbols = req.query.symbols ? req.query.symbols.split(',') : ['SPY'];

  try {
    // Use the real Tradier API with the configured token
    const tradierToken = process.env.TRADIER_TOKEN;
    const tradierBaseUrl = process.env.TRADIER_BASE_URL || 'https://sandbox.tradier.com/v1';

    if (!tradierToken) {
      console.log('No Tradier token found, falling back to mock data');
      return res.json(getMockQuotes(symbols));
    }

    const response = await axios.get(`${tradierBaseUrl}/markets/quotes`, {
      params: {
        symbols: symbols.join(','),
        includeQuotes: true
      },
      headers: {
        Authorization: `Bearer ${tradierToken}`,
        Accept: 'application/json'
      },
      timeout: 10000
    });

    const quotes = response.data?.quotes?.quote;
    if (!quotes) {
      console.log('No quotes returned from Tradier, falling back to mock data');
      return res.json(getMockQuotes(symbols));
    }

    // Handle single quote (not in array)
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const result = quotesArray.map(q => {
      const last = Number(q.last || q.close || q.bid || q.ask || 0);
      const prevClose = Number(q.prevclose || q.previous_close || q.previousClose || 0);

      return {
        symbol: q.symbol,
        price: Number(last.toFixed(2)),
        change: typeof q.change === 'number' ? Number(q.change.toFixed(2)) : Number((last - prevClose).toFixed(2)),
        changePercent: typeof q.change_percentage === 'number' ? Number(q.change_percentage.toFixed(2)) : Number((((last/prevClose)-1)*100).toFixed(2)),
        volume: Math.floor(q.volume || 1000000),
        timestamp: new Date().toISOString()
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Tradier API error:', error.message);
    // Fallback to mock data
    res.json(getMockQuotes(symbols));
  }
});

function getMockQuotes(symbols) {
  const basePrices = {
    'SPY': 573, 'AAPL': 236, 'QQQ': 483, 'MSFT': 428, 'NVDA': 177.75,
    'TSLA': 229, 'AMD': 166, 'META': 567, 'GOOGL': 166, 'BTC': 65000
  };

  return symbols.map(symbol => {
    const basePrice = basePrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.06;
    const price = basePrice * (1 + variation);
    const change = price - basePrice;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: Math.floor(1000000 + Math.random() * 9000000),
      timestamp: new Date().toISOString()
    };
  });
}

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    totalSymbolsTracked: 29,
    errorRate: 0.02,
    requestsLastHour: 150,
    averageLatency: 45,
    timestamp: new Date().toISOString()
  });
});

// Brain flow summary endpoint
app.get('/api/brain/flow/summary', (req, res) => {
  const window = req.query.window || '15m';
  res.json({
    window,
    counts: {
      ingest_ok: 87,
      context_ok: 85,
      candidates_ok: 82,
      gates_passed: 41,
      gates_failed: 46,
      plan_ok: 2,
      route_ok: 1,
      manage_ok: 1,
      learn_ok: 1
    },
    by_mode: {
      discovery: 100,
      shadow: 0,
      live: 0
    },
    latency_ms: {
      p50: 120,
      p95: 340
    },
    timestamp: new Date().toISOString()
  });
});

// Decisions summary endpoint
app.get('/api/decisions/summary', (req, res) => {
  const window = req.query.window || '15m';
  res.json({
    window,
    proposals_per_min: 4.2,
    unique_symbols: 7,
    last_ts: new Date().toISOString(),
    by_stage: {
      proposed: 15,
      intent: 2,
      executed: 8
    },
    timestamp: new Date().toISOString()
  });
});

// Brain status endpoint
app.get('/api/brain/status', (req, res) => {
  res.json({
    mode: process.env.AUTOLOOP_MODE || 'discovery',
    running: true,
    tick_ms: 30000,
    breaker: null,
    recent_pf_after_costs: 1.05,
    sharpe_30d: 0.42,
    sharpe_90d: 0.38,
    timestamp: new Date().toISOString()
  });
});

// Evo status endpoint
app.get('/api/evo/status', (req, res) => {
  res.json({
    generation: 15,
    population: 200,
    best: {
      config_id: 'cfg_abc123',
      metrics: {
        pf_after_costs: 1.18,
        sharpe: 0.42,
        trades: 640
      }
    },
    running: true,
    timestamp: new Date().toISOString()
  });
});

// Brain activity endpoint
app.get('/api/brain/activity', (req, res) => {
  res.json([]);
});

// Live tournament endpoint
app.get('/api/live/tournament', (req, res) => {
  res.json({
    current_generation: 1,
    rounds: [
      {
        stage: 'incubation',
        name: 'Incubation',
        active_strategies: 2,
        criteria: {
          minSharpe: 0.5,
          minPf: 1.05,
          maxDd: 0.15,
          maxBreaches: 3
        }
      },
      {
        stage: 'evaluation',
        name: 'Evaluation',
        active_strategies: 1,
        criteria: {
          minSharpe: 0.8,
          minPf: 1.10,
          maxDd: 0.12,
          maxBreaches: 2
        }
      },
      {
        stage: 'production',
        name: 'Production',
        active_strategies: 1,
        criteria: {
          minSharpe: 1.0,
          minPf: 1.15,
          maxDd: 0.10,
          maxBreaches: 1
        }
      }
    ],
    stats: {
      totalPromotions: 5,
      totalDemotions: 2,
      roundPassRates: {
        'incubation-evaluation': { promoted: 3, demoted: 1 },
        'evaluation-production': { promoted: 1, demoted: 1 }
      }
    },
    recent_decisions: [
      {
        strategyId: 'news_momo_v2',
        decision: 'promote',
        fromStage: 'evaluation',
        toStage: 'production',
        reason: 'Exceeded Sharpe target (1.2 > 1.0)',
        timestamp: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// News endpoints
app.get('/api/news/insights', (req, res) => {
  res.json({
    sentiment: 'neutral',
    confidence: 0.7,
    sources: [],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/news/sentiment', (req, res) => {
  res.json({
    category: req.query.category || 'markets',
    sentiment: 'neutral',
    confidence: 0.6,
    sources: [],
    timestamp: new Date().toISOString()
  });
});

// Scanner candidates endpoint
app.get('/api/scanner/candidates', (req, res) => {
  res.json([]);
});

// Competition endpoints
app.get('/api/competition/ledger', (req, res) => {
  res.json([]);
});

app.get('/api/competition/poolStatus', (req, res) => {
  res.json({
    total_pool: 100000,
    poolPnl: 15234.56, // This was causing the toFixed() error
    active_strategies: 3,
    capPct: 0.8,
    utilizationPct: 0.65,
    activeCount: 3,
    timestamp: new Date().toISOString()
  });
});

// Live AI endpoints
app.get('/api/live/ai/status', (req, res) => {
  res.json({
    status: 'idle',
    last_cycle: new Date().toISOString(),
    active_strategies: ['news_momo_v2'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/live/ai/context', (req, res) => {
  res.json({
    market_regime: 'neutral_medium',
    volatility: 'medium',
    sentiment: 'neutral',
    timestamp: new Date().toISOString()
  });
});

// Context endpoint
app.get('/api/context', (req, res) => {
  res.json({
    market_regime: 'neutral_medium',
    volatility: 'medium',
    sentiment: 'neutral',
    timestamp: new Date().toISOString()
  });
});

// Safety status endpoint
app.get('/api/safety/status', (req, res) => {
  res.json({
    circuit_breaker: 'GREEN',
    last_check: new Date().toISOString(),
    alerts: [],
    timestamp: new Date().toISOString()
  });
});

// Decisions endpoints
app.get('/api/decisions', (req, res) => {
  res.json([]);
});

// Removed stub endpoint - using the full implementation below

app.get('/api/decisions/latest', (req, res) => {
  res.json([]);
});

// Portfolio endpoints
app.get('/api/portfolio', (req, res) => {
  res.json({
    balances: {
      total_equity: 100000,
      total_cash: 100000,
      market_value: 0
    },
    positions: [],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/portfolio/summary', (req, res) => {
  res.json({
    cash: 100000,
    equity: 100000,
    day_pnl: 0,
    open_pnl: 0,
    positions: [],
    asOf: new Date().toISOString(),
    broker: 'tradier',
    mode: 'paper'
  });
});

app.get('/api/portfolio/paper', (req, res) => {
  res.json({
    cash: 100000,
    equity: 100000,
    day_pnl: 0,
    open_pnl: 0,
    positions: [],
    asOf: new Date().toISOString(),
    broker: 'tradier',
    mode: 'paper'
  });
});

// Paper trading endpoints
app.get('/api/paper/account', (req, res) => {
  res.json({
    balances: {
      total_equity: 100000,
      total_cash: 100000,
      market_value: 0
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/paper/orders', (req, res) => {
  res.json([]);
});

app.get('/api/paper/positions', (req, res) => {
  res.json([]);
});

app.get('/api/paper/orders/stream', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Send an initial comment to establish the connection
  res.write(': connected\n\n');

  // Send a keep-alive every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    res.end();
  });
});

// Trades endpoint
app.get('/api/trades', (req, res) => {
  res.json([]);
});

// Strategies endpoint
app.get('/api/strategies', (req, res) => {
  res.json({
    items: [{
      id: 'news_momo_v2',
      name: 'News Momentum v2',
      active: true,
      performance: {
        trades_count: 50,
        profit_factor: 1.15,
        sharpe_ratio: 0.8
      }
    }]
  });
});

app.get('/api/strategies/active', (req, res) => {
  res.json([{
    id: 'news_momo_v2',
    name: 'News Momentum v2',
    budget: 1.0,
    reason: 'IR_weighted',
    sharpe_after_costs: 0.8,
    trades: 50
  }]);
});

// Data status endpoint
app.get('/api/data/status', (req, res) => {
  res.json({
    quotes_fresh: true,
    market_data_ok: true,
    last_update: new Date().toISOString(),
    timestamp: new Date().toISOString()
  });
});

// Test autoloop trigger
app.post('/api/test/autoloop/runonce', (req, res) => {
  res.json({
    success: true,
    message: 'AutoLoop runOnce completed (minimal)',
    meta: {
      asOf: new Date().toISOString(),
      source: 'minimal-server'
    }
  });
});

// Metrics/Prometheus endpoint
app.get('/metrics/prom', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP live_api_requests_total Total number of requests
# TYPE live_api_requests_total counter
live_api_requests_total 150

# HELP live_api_errors_total Total number of errors
# TYPE live_api_errors_total counter
live_api_errors_total 3
`);
});

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const url = req.url;
  console.log(`WebSocket connected: ${url}`);

  // Handle different WebSocket endpoints
  if (url === '/ws/prices') {
    // Send mock price updates for multiple symbols every 5 seconds
    let symbols = ['SPY', 'AAPL', 'QQQ', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'BTC'];

    // Current market prices (NVDA corrected to 177.75)
    const currentPrices = {
      'SPY': 573,
      'AAPL': 236,
      'QQQ': 483,
      'MSFT': 428,
      'NVDA': 177.75,  // Corrected - user verified this is ~177.75
      'TSLA': 229,
      'AMD': 166,
      'META': 567,
      'GOOGL': 166,
      'BTC': 65000
    };

    const priceInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const mockPrices = symbols.map(symbol => {
          const basePrice = currentPrices[symbol] || 100;
          // More realistic price movements: ±2% max change per 5 seconds
          const maxChange = basePrice * 0.02;
          const change = (Math.random() - 0.5) * maxChange * 2;
          const currentPrice = Math.max(0.01, basePrice + change);

          return {
            symbol: symbol,
            last: currentPrice,
            bid: Math.max(0.01, currentPrice - 0.05),
            ask: currentPrice + 0.05,
            prevClose: basePrice,
            change: change,
            pct: (change / basePrice) * 100,
            volume: Math.floor(Math.random() * 1000000),
            timestamp: new Date().toISOString()
          };
        });

        const message = {
          type: 'prices',
          data: mockPrices,
          time: new Date().toISOString()
        };
        ws.send(JSON.stringify(message));
      }
    }, 5000);

    // Handle subscription messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe' && data.symbols) {
          symbols = data.symbols;
          console.log(`Price WebSocket subscribed to symbols: ${symbols.join(', ')}`);
        }
      } catch (e) {
        console.log('Price WebSocket received invalid message:', message.toString());
      }
    });

    ws.on('close', () => {
      clearInterval(priceInterval);
      console.log('Price WebSocket disconnected');
    });

  } else if (url === '/ws/decisions') {
    // Send mock decision updates occasionally
    const decisionInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && Math.random() > 0.7) { // 30% chance
        const mockDecision = {
          symbol: 'SPY',
          action: 'BUY',
          confidence: 0.75,
          strategy: 'news_momo_v2',
          timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(mockDecision));
      }
    }, 10000);

    ws.on('close', () => {
      clearInterval(decisionInterval);
      console.log('Decision WebSocket disconnected');
    });

  } else {
    // Generic WebSocket connection
    ws.on('message', (message) => {
      console.log('Received:', message.toString());
      ws.send(JSON.stringify({ echo: message.toString(), timestamp: new Date().toISOString() }));
    });

    ws.on('close', () => {
      console.log('Generic WebSocket disconnected');
    });
  }

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    endpoint: url,
    timestamp: new Date().toISOString()
  }));
});

// Lab diamonds endpoint
app.get('/api/lab/diamonds', (req, res) => {
  const { limit = 25, universe = 'all' } = req.query;
  const limitNum = parseInt(limit) || 25;

  const diamonds = [];
  const symbols = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AVGO'];

  for (let i = 0; i < Math.min(limitNum, symbols.length); i++) {
    const symbol = symbols[i];
    diamonds.push({
      symbol,
      score: 0.5 + Math.random() * 0.5, // 0.5 to 1.0
      features: {
        impact1h: (Math.random() - 0.5) * 2, // -1 to 1
        impact24h: (Math.random() - 0.5) * 4, // -2 to 2
        count24h: Math.floor(Math.random() * 20) + 1, // 1 to 20
        gapPct: Math.random() * 0.02, // 0 to 2%
        spreadPct: Math.random() * 0.005, // 0 to 0.5%
        rvol: 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      }
    });
  }

  res.json({
    items: diamonds,
    asOf: new Date().toISOString()
  });
});

// EvoTester history endpoint
app.get('/api/evotester/history', (req, res) => {
  const history = [
    {
      id: 'evo-1',
      date: new Date().toISOString(),
      bestFitness: 0.78,
      status: 'completed',
      generations: 50,
      elapsed: '1h 23m'
    },
    {
      id: 'evo-2',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      bestFitness: 0.72,
      status: 'completed',
      generations: 42,
      elapsed: '58m'
    },
    {
      id: 'evo-3',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      bestFitness: 0.65,
      status: 'completed',
      generations: 35,
      elapsed: '45m'
    }
  ];

  res.json(history);
});

// Context news endpoint
app.get('/api/context/news', (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = parseInt(limit) || 10;

  const newsItems = [];
  for (let i = 0; i < limitNum; i++) {
    newsItems.push({
      id: `news-${i + 1}`,
      headline: `Market News Headline ${i + 1}`,
      summary: `This is a summary of market news item ${i + 1} with relevant market information.`,
      url: `https://example.com/news/${i + 1}`,
      source: 'Market News Wire',
      published_at: new Date(Date.now() - i * 3600000).toISOString(),
      sentiment_score: ((i % 5) - 2) / 2, // -1 to 1
      impact: ['high', 'medium', 'low'][i % 3],
      categories: ['markets'],
      symbols: i % 2 === 0 ? ['SPY', 'QQQ'] : ['AAPL', 'MSFT']
    });
  }

  res.json(newsItems);
});

// Logs endpoint
app.get('/api/logs', (req, res) => {
  const { level = 'INFO', limit = 100, offset = 0 } = req.query;
  const limitNum = parseInt(limit) || 100;
  const offsetNum = parseInt(offset) || 0;

  const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
  const sources = ['trading-engine', 'data-ingestion', 'strategy-manager', 'market-data', 'websocket-server', 'api-gateway'];
  const categories = ['performance', 'errors', 'data-quality', 'trading', 'system', 'market'];

  const logs = [];
  for (let i = 0; i < limitNum; i++) {
    const timestamp = new Date(Date.now() - (i + offsetNum) * 60000).toISOString();
    const levelIndex = level === 'ALL' ? Math.floor(Math.random() * logLevels.length) : logLevels.indexOf(level.toUpperCase());
    const logLevel = level === 'ALL' ? logLevels[levelIndex] : level.toUpperCase();

    logs.push({
      id: `log-${Date.now()}-${i}`,
      timestamp,
      level: logLevel,
      message: generateLogMessage(logLevel),
      source: sources[Math.floor(Math.random() * sources.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      acknowledged: Math.random() > 0.8,
      requires_action: Math.random() > 0.9,
      related_symbol: Math.random() > 0.7 ? ['SPY', 'QQQ', 'AAPL', 'MSFT'][Math.floor(Math.random() * 4)] : undefined,
      details: Math.random() > 0.5 ? {
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.floor(Math.random() * 5000),
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      } : undefined
    });
  }

  res.json(logs);
});

// Events logs endpoint
app.get('/api/events/logs', (req, res) => {
  const { level = 'INFO', limit = 100, offset = 0 } = req.query;
  const limitNum = parseInt(limit) || 100;
  const offsetNum = parseInt(offset) || 0;

  const eventLogs = [];
  for (let i = 0; i < limitNum; i++) {
    const timestamp = new Date(Date.now() - (i + offsetNum) * 30000).toISOString();

    eventLogs.push({
      id: `event-log-${Date.now()}-${i}`,
      timestamp,
      level: level.toUpperCase(),
      message: `Event: ${['Trade executed', 'Position updated', 'Strategy activated', 'Alert triggered', 'Data ingested'][Math.floor(Math.random() * 5)]}`,
      source: 'event-system',
      category: 'events',
      acknowledged: true,
      requires_action: false,
      related_symbol: ['SPY', 'QQQ', 'AAPL'][Math.floor(Math.random() * 3)],
      details: {
        eventType: ['trade', 'position', 'strategy', 'alert', 'data'][Math.floor(Math.random() * 5)],
        eventId: `evt-${Math.random().toString(36).substr(2, 9)}`,
        correlationId: `corr-${Math.random().toString(36).substr(2, 9)}`
      }
    });
  }

  res.json(eventLogs);
});

// Helper function to generate realistic log messages
function generateLogMessage(level) {
  const messages = {
    DEBUG: [
      'Processing market data for SPY',
      'Cache hit for strategy configuration',
      'WebSocket connection established',
      'Database query executed in 45ms'
    ],
    INFO: [
      'Strategy manager initialized successfully',
      'Market data ingestion completed',
      'Portfolio rebalanced automatically',
      'New trade signal generated for AAPL'
    ],
    WARNING: [
      'High latency detected in data source',
      'Strategy performance below threshold',
      'API rate limit approaching',
      'Market volatility increased significantly'
    ],
    ERROR: [
      'Failed to connect to data provider',
      'Strategy execution failed with timeout',
      'Database connection lost',
      'Invalid market data received'
    ]
  };

  return messages[level][Math.floor(Math.random() * messages[level].length)];
}

// Removed duplicate poolStatus endpoint

// === ADVANCED ENDPOINTS FOR DASHBOARD ===

// In-memory decision store for demo purposes
const decisionStore = [];
let decisionCounter = 0;

// Mock decision generator
setInterval(() => {
  if (Math.random() > 0.7) { // ~30% chance every 3 seconds
    const decision = {
      id: `decision_${++decisionCounter}`,
      ts: Date.now(),
      symbol: ['SPY', 'AAPL', 'QQQ', 'TSLA', 'NVDA'][Math.floor(Math.random() * 5)],
      stage: ['proposed', 'intent', 'executed'][Math.floor(Math.random() * 3)],
      strategy_id: `strategy_${Math.floor(Math.random() * 3)}`,
      confidence: 0.5 + Math.random() * 0.5,
      costs: {
        spread_bps: 5 + Math.random() * 10,
        fees_per_contract: 0.5 + Math.random() * 1.5,
        slippage_bps: 1 + Math.random() * 5
      }
    };
    decisionStore.push(decision);
    // Keep only last 200 decisions
    if (decisionStore.length > 200) {
      decisionStore.shift();
    }
  }
}, 3000);

// Decisions recent endpoint with stage filtering
app.get('/api/decisions/recent', (req, res) => {
  try {
    const stage = req.query.stage;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    let filtered = decisionStore;
    if (stage) {
      filtered = decisionStore.filter(d => d.stage === stage);
    }

    const recent = filtered.slice(-limit).reverse().map(d => ({
      id: d.id,
      ts: d.ts,
      symbol: d.symbol,
      strategy_id: d.strategy_id,
      confidence: d.confidence,
      stage: d.stage,
      trace_id: d.id,
      as_of: d.ts,
      explain_layman: `Decision for ${d.symbol}`,
      plan: { strategyLabel: d.strategy_id },
      market_context: {
        regime: { label: 'neutral' },
        volatility: { vix: 20 },
        sentiment: { label: 'neutral' }
      },
      costs: d.costs
    }));

    res.json({ items: recent });
  } catch (e) {
    console.error('Decisions recent error:', e);
    res.json({ items: [] });
  }
});

// SSE endpoint for real-time decisions
app.get('/api/decisions/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  res.write('data: {"type": "connected"}\n\n');

  // Send a mock decision every 5-15 seconds
  const interval = setInterval(() => {
    if (Math.random() > 0.6) { // 40% chance
      const decision = {
        ts: Date.now(),
        symbol: ['SPY', 'AAPL', 'QQQ'][Math.floor(Math.random() * 3)],
        stage: ['proposed', 'intent'][Math.floor(Math.random() * 2)],
        strategy_id: `strategy_${Math.floor(Math.random() * 3)}`,
        confidence: 0.5 + Math.random() * 0.5,
        costs: {
          spread_bps: 5 + Math.random() * 10,
          fees_per_contract: 0.5 + Math.random() * 1.5,
          slippage_bps: 1 + Math.random() * 5
        }
      };
      res.write(`event: ${decision.stage}\ndata: ${JSON.stringify(decision)}\n\n`);
    }
  }, 8000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Telemetry endpoints
const telemetryData = new Map();

app.post('/api/telemetry/card-mounted', (req, res) => {
  try {
    const { cardId } = req.body;
    if (!cardId) {
      return res.status(400).json({ error: 'cardId required' });
    }

    const count = (telemetryData.get(cardId) || 0) + 1;
    telemetryData.set(cardId, count);

    res.json({ ok: true, count });
  } catch (e) {
    res.status(500).json({ error: 'Telemetry error' });
  }
});

app.get('/api/telemetry/cards', (req, res) => {
  try {
    const cards = Array.from(telemetryData.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cardId, count]) => ({ cardId, count }));

    res.json({
      cards,
      total_unique_cards: telemetryData.size,
      asOf: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: 'Telemetry fetch error' });
  }
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`Enhanced Minimal Live-API server listening on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- /api/health');
  console.log('- /api/alerts');
  console.log('- /api/autoloop/status');
  console.log('- /api/bars');
  console.log('- /api/brain/flow/summary');
  console.log('- /api/brain/status');
  console.log('- /api/brain/activity');
  console.log('- /api/context/news');
  console.log('- /api/decisions/*');
  console.log('- /api/decisions/summary');
  console.log('- /api/evotester/history');
  console.log('- /api/evo/status');
  console.log('- /api/lab/diamonds');
  console.log('- /api/logs');
  console.log('- /api/events/logs');
  console.log('- /api/portfolio/*');
  console.log('- /api/paper/*');
  console.log('- /api/strategies');
  console.log('- /api/quotes');
  console.log('- /api/competition/poolStatus');
  console.log('- /metrics');
  console.log('- WebSocket endpoints: /ws, /ws/prices, /ws/decisions');
});
