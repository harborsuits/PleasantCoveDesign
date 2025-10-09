class MACrossoverStrategy {
  constructor(config = {}) {
    this.config = {
      symbol: config.symbol || 'SPY',
      fastPeriod: config.fastPeriod || 5,
      slowPeriod: config.slowPeriod || 20,
      qty: config.qty || 10,
      ...config
    };

    this.prices = [];
    this.fastMA = null;
    this.slowMA = null;
    this.lastSignal = null;
  }

  // Calculate simple moving average
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Main strategy logic
  async run(context) {
    const { paperBroker, strategyName } = context;

    try {
      // Get current price
      const currentPrice = paperBroker.getCurrentPrice(this.config.symbol);
      if (!currentPrice) {
        return { signal: null, data: { message: 'No price available' } };
      }

      // Add price to history
      this.prices.push(currentPrice);

      // Keep only recent prices for efficiency
      if (this.prices.length > this.config.slowPeriod * 2) {
        this.prices = this.prices.slice(-this.config.slowPeriod * 2);
      }

      // Calculate moving averages
      this.fastMA = this.calculateSMA(this.prices, this.config.fastPeriod);
      this.slowMA = this.calculateSMA(this.prices, this.config.slowPeriod);

      if (!this.fastMA || !this.slowMA) {
        return { signal: null, data: { message: 'Not enough data for MA calculation' } };
      }

      // Get current position
      const positions = paperBroker.getPositions();
      const position = positions.find(p => p.symbol === this.config.symbol);
      const currentQty = position ? position.qty : 0;

      // Generate signals
      let signal = null;
      let signalData = null;

      // Bullish crossover: Fast MA crosses above Slow MA
      if (this.fastMA > this.slowMA && (!this.lastSignal || this.lastSignal === 'SELL')) {
        if (currentQty === 0) { // Only buy if we don't have a position
          signal = 'BUY';
          const maDiff = (this.fastMA - this.slowMA) / this.slowMA * 100;
          signalData = {
            symbol: this.config.symbol,
            qty: this.config.qty,
            type: 'market',
            price: currentPrice,
            reason: `Fast MA (${this.fastMA.toFixed(2)}) crossed above Slow MA (${this.slowMA.toFixed(2)})`,
            expectedMovePct: Math.min(3.0, Math.abs(maDiff) * 1.5), // Expect move proportional to MA divergence
            confidence: Math.min(0.6, 0.4 + Math.abs(maDiff) * 0.1) // Confidence based on divergence strength
          };
        }
      }
      // Bearish crossover: Fast MA crosses below Slow MA
      else if (this.fastMA < this.slowMA && (!this.lastSignal || this.lastSignal === 'BUY')) {
        if (currentQty >= this.config.qty) { // Only sell if we have enough shares
          signal = 'SELL';
          const maDiff = (this.slowMA - this.fastMA) / this.slowMA * 100;
          signalData = {
            symbol: this.config.symbol,
            qty: Math.min(currentQty, this.config.qty), // Don't sell more than we have
            type: 'market',
            price: currentPrice,
            reason: `Fast MA (${this.fastMA.toFixed(2)}) crossed below Slow MA (${this.slowMA.toFixed(2)})`,
            expectedMovePct: -Math.min(3.0, Math.abs(maDiff) * 1.5), // Expect negative move proportional to MA divergence
            confidence: Math.min(0.6, 0.4 + Math.abs(maDiff) * 0.1) // Confidence based on divergence strength
          };
        }
      }

      if (signal) {
        this.lastSignal = signal;
      }

      return {
        signal,
        data: signalData,
        metadata: {
          symbol: this.config.symbol,
          fastMA: this.fastMA,
          slowMA: this.slowMA,
          currentPrice,
          position: currentQty,
          pricesCount: this.prices.length
        }
      };

    } catch (error) {
      return {
        signal: null,
        data: { error: error.message },
        metadata: { strategy: strategyName }
      };
    }
  }

  // Get strategy info
  getInfo() {
    return {
      name: 'MA Crossover',
      description: 'Moving Average Crossover Strategy',
      config: this.config,
      status: {
        pricesCount: this.prices.length,
        fastMA: this.fastMA,
        slowMA: this.slowMA,
        lastSignal: this.lastSignal
      }
    };
  }
}

module.exports = { MACrossoverStrategy };
