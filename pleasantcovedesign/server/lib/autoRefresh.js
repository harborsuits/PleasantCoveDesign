'use strict';

const http = require('http');
const { setQuoteTouch } = require('./health');

/**
 * Simple auto-refresh module that periodically touches quotes
 * to keep the health status GREEN
 */
class AutoRefresh {
  constructor(options = {}) {
    this.interval = options.interval || 60_000; // Default: refresh every 60 seconds
    this.symbols = options.symbols || ['SPY']; // Default: refresh SPY
    this.enabled = options.enabled !== false;
    this.timer = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning || !this.enabled) return;
    
    this.isRunning = true;
    console.log(`[AutoRefresh] Starting with interval ${this.interval}ms for symbols: ${this.symbols.join(',')}`);
    
    // Immediate first refresh
    this.refresh();
    
    // Set up interval
    this.timer = setInterval(() => this.refresh(), this.interval);
  }

  stop() {
    if (!this.isRunning) return;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.isRunning = false;
    console.log('[AutoRefresh] Stopped');
  }

  refresh() {
    const symbolsParam = this.symbols.join(',');
    const url = `http://localhost:4000/api/quotes?symbols=${encodeURIComponent(symbolsParam)}`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          // Manually call setQuoteTouch to update timestamp
          setQuoteTouch();
          console.log(`[AutoRefresh] Refreshed quotes at ${new Date().toISOString()}`);
        } else {
          console.error(`[AutoRefresh] Failed with status ${res.statusCode}`);
        }
      });
    }).on('error', (err) => {
      console.error('[AutoRefresh] Error:', err.message);
    });
  }
}

module.exports = { AutoRefresh };

