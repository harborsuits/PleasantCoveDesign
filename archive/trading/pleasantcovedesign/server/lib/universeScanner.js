/**
 * Universe Scanner - Dynamic symbol discovery for POOR_CAPITAL_MODE
 * 
 * This scanner finds tradeable symbols based on:
 * - Price range ($1-$10 for smaller accounts)
 * - Liquidity (min $10M daily volume)
 * - Spread constraints (max 0.20%)
 * - Float requirements (10M+ shares)
 */

const axios = require('axios');

// Import POOR_CAPITAL_MODE config
const POOR_CAPITAL_MODE = {
  universe: {
    minPrice: 1,
    maxPrice: 10,
    minDollarADV: 10_000_000, // $10M daily volume
    maxSpreadBps: 20, // 0.20% max spread
    minFloat: 10_000_000, // 10M shares
  },
  catalysts: {
    w_news: 0.40,
    w_rvol: 0.25,
    w_gap: 0.15,
    w_si: 0.10,
    w_context: 0.10,
    minScore: 0.6,
  }
};

class UniverseScanner {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Get universe candidates with scoring
   */
  async getCandidates(options = {}) {
    const {
      limit = 20,
      minPrice = POOR_CAPITAL_MODE.universe.minPrice,
      maxPrice = POOR_CAPITAL_MODE.universe.maxPrice,
      minVolume = POOR_CAPITAL_MODE.universe.minDollarADV,
      includeETFs = false,
      sortBy = 'score' // 'score', 'volume', 'change', 'volatility'
    } = options;

    // Check cache
    const cacheKey = JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // For now, we'll enhance the existing watchlist-based approach
      // In production, this would query a proper market data provider
      const watchlistSymbols = await this.getWatchlistSymbols();
      
      // Add some popular small-cap symbols that fit our criteria
      const additionalSymbols = [
        'SOFI', 'PLTR', 'BB', 'NOK', 'SNDL', 'TELL', 'GSAT', 'BNGO', 
        'SENS', 'OCGN', 'PROG', 'ATOS', 'XELA', 'CEI', 'BBIG', 'ANY',
        'MMAT', 'SPRT', 'WKHS', 'RIDE', 'NKLA', 'GOEV', 'LCID', 'RIVN',
        'F', 'GE', 'AAL', 'CCL', 'NCLH', 'MGM', 'WYNN', 'DKNG', 'PENN'
      ];
      
      const allSymbols = [...new Set([...watchlistSymbols, ...additionalSymbols])];
      
      // Fetch quotes for all symbols
      const quotes = await this.fetchQuotes(allSymbols);
      
      // Filter and score candidates
      const candidates = quotes
        .filter(q => this.passesFilters(q, { minPrice, maxPrice, minVolume, includeETFs }))
        .map(q => this.scoreCandidate(q))
        .sort((a, b) => {
          switch (sortBy) {
            case 'volume': return b.dollarVolume - a.dollarVolume;
            case 'change': return Math.abs(b.changePercent) - Math.abs(a.changePercent);
            case 'volatility': return b.volatility - a.volatility;
            default: return b.score - a.score;
          }
        })
        .slice(0, limit);

      // Cache results
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: candidates
      });

      return candidates;
    } catch (error) {
      console.error('[UniverseScanner] Error:', error.message);
      return [];
    }
  }

  /**
   * Get symbols from watchlists
   */
  async getWatchlistSymbols() {
    try {
      const fs = require('fs');
      const path = require('path');
      const watchlistPath = path.join(__dirname, '../data/watchlists.json');
      
      if (fs.existsSync(watchlistPath)) {
        const data = JSON.parse(fs.readFileSync(watchlistPath, 'utf8'));
        const current = data.items.find(w => w.id === data.currentId) || data.items[0];
        return current?.symbols || [];
      }
    } catch (e) {
      console.error('[UniverseScanner] Error loading watchlist:', e.message);
    }
    return ['SPY', 'QQQ', 'AAPL']; // Fallback
  }

  /**
   * Fetch quotes from API
   */
  async fetchQuotes(symbols) {
    try {
      const response = await axios.get('http://localhost:4000/api/quotes', {
        params: { symbols: symbols.join(',') },
        timeout: 5000
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('[UniverseScanner] Quote fetch error:', error.message);
      return [];
    }
  }

  /**
   * Check if quote passes universe filters
   */
  passesFilters(quote, filters) {
    const price = Number(quote.last || 0);
    const volume = Number(quote.volume || 0);
    const avgPrice = (Number(quote.high || price) + Number(quote.low || price)) / 2;
    const dollarVolume = volume * avgPrice;
    
    // Price range
    if (price < filters.minPrice || price > filters.maxPrice) {
      return false;
    }
    
    // Volume requirement (dollar volume)
    if (dollarVolume < filters.minVolume) {
      return false;
    }
    
    // Spread check
    const bid = Number(quote.bid || 0);
    const ask = Number(quote.ask || 0);
    if (bid > 0 && ask > 0) {
      const spreadBps = ((ask - bid) / price) * 10000;
      if (spreadBps > POOR_CAPITAL_MODE.universe.maxSpreadBps) {
        return false;
      }
    }
    
    // Skip ETFs if not included
    if (!filters.includeETFs && quote.type === 'etf') {
      return false;
    }
    
    return true;
  }

  /**
   * Score a candidate based on catalyst weights
   */
  scoreCandidate(quote) {
    const price = Number(quote.last || 0);
    const volume = Number(quote.volume || 0);
    const prevClose = Number(quote.prevClose || price);
    const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    const avgVolume = Number(quote.avgVolume || volume);
    const relativeVolume = avgVolume > 0 ? volume / avgVolume : 1;
    
    // Calculate component scores
    const scores = {
      gap: Math.min(1, Math.abs(changePercent) / 10), // 10% move = max score
      rvol: Math.min(1, relativeVolume / 3), // 3x average = max score
      news: 0.5, // Placeholder - would check news API
      si: 0.3, // Placeholder - would check short interest
      context: 0.4 // Placeholder - market conditions
    };
    
    // Apply weights
    const weights = POOR_CAPITAL_MODE.catalysts;
    const totalScore = 
      scores.gap * weights.w_gap +
      scores.rvol * weights.w_rvol +
      scores.news * weights.w_news +
      scores.si * weights.w_si +
      scores.context * weights.w_context;
    
    // Calculate additional metrics
    const bid = Number(quote.bid || 0);
    const ask = Number(quote.ask || 0);
    const spreadBps = bid > 0 && ask > 0 ? ((ask - bid) / price) * 10000 : 50;
    const avgPrice = (Number(quote.high || price) + Number(quote.low || price)) / 2;
    const dollarVolume = volume * avgPrice;
    const volatility = quote.high && quote.low ? 
      ((Number(quote.high) - Number(quote.low)) / avgPrice) * 100 : 0;
    
    return {
      symbol: quote.symbol,
      last: price,
      changePercent: Number(changePercent.toFixed(2)),
      volume,
      dollarVolume,
      relativeVolume: Number(relativeVolume.toFixed(2)),
      spreadBps: Number(spreadBps.toFixed(2)),
      volatility: Number(volatility.toFixed(2)),
      score: Number(totalScore.toFixed(3)),
      scores,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get symbols by specific criteria
   */
  async getSymbolsByCriteria(criteria) {
    const {
      minGap = 5, // Min 5% move
      minRVOL = 2, // Min 2x average volume
      maxSpread = 15, // Max 0.15% spread
      sector = null,
      limit = 10
    } = criteria;
    
    const candidates = await this.getCandidates({ limit: limit * 3 });
    
    return candidates
      .filter(c => {
        if (Math.abs(c.changePercent) < minGap) return false;
        if (c.relativeVolume < minRVOL) return false;
        if (c.spreadBps > maxSpread) return false;
        // Sector filter would go here if we had sector data
        return true;
      })
      .slice(0, limit);
  }
}

module.exports = UniverseScanner;
