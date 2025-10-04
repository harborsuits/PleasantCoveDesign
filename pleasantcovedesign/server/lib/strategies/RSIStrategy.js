class RSIStrategy {
  constructor(config = {}) {
    this.config = {
      symbol: config.symbol || 'AAPL',
      period: config.period || 14,
      overbought: config.overbought || 70,
      oversold: config.oversold || 30,
      qty: config.qty || 5,
      ...config
    };

    this.prices = [];
    this.gains = [];
    this.losses = [];
    this.rsi = null;
    // NEVER track state - always check actual positions!
  }

  // Calculate RSI
  calculateRSI() {
    if (this.prices.length < this.config.period + 1) return null;

    // Calculate price changes
    const changes = [];
    for (let i = 1; i < this.prices.length; i++) {
      changes.push(this.prices[i] - this.prices[i - 1]);
    }

    // Calculate gains and losses
    this.gains = changes.map(change => change > 0 ? change : 0);
    this.losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    if (this.gains.length < this.config.period || this.losses.length < this.config.period) {
      return null;
    }

    // Calculate average gains and losses
    const avgGain = this.gains.slice(-this.config.period).reduce((a, b) => a + b, 0) / this.config.period;
    const avgLoss = this.losses.slice(-this.config.period).reduce((a, b) => a + b, 0) / this.config.period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
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

      // Keep only recent prices
      const maxHistory = this.config.period * 3;
      if (this.prices.length > maxHistory) {
        this.prices = this.prices.slice(-maxHistory);
      }

      // Calculate RSI
      this.rsi = this.calculateRSI();

      if (this.rsi === null) {
        return { signal: null, data: { message: 'Not enough data for RSI calculation' } };
      }

      // Get current position
      const positions = paperBroker.getPositions();
      const position = positions.find(p => p.symbol === this.config.symbol);
      const currentQty = position ? position.qty : 0;

      // Generate signals
      let signal = null;
      let signalData = null;

      // Oversold signal: RSI below oversold threshold
      if (this.rsi < this.config.oversold && currentQty === 0) { // Only buy if NO position
          signal = 'BUY';
          signalData = {
            symbol: this.config.symbol,
            qty: this.config.qty,
            type: 'market',
            price: currentPrice,
            reason: `RSI (${this.rsi.toFixed(2)}) below oversold threshold (${this.config.oversold})`,
            expectedMovePct: 1.5, // Expect 1.5% bounce from oversold
            confidence: Math.min(0.7, (this.config.oversold - this.rsi) / this.config.oversold) // Higher confidence when more oversold
          };
      }
      // Overbought signal: RSI above overbought threshold
      else if (this.rsi > this.config.overbought && currentQty > 0) { // Only sell if we HAVE a position
          signal = 'SELL';
          signalData = {
            symbol: this.config.symbol,
            qty: Math.min(currentQty, this.config.qty), // Don't sell more than we have
            type: 'market',
            price: currentPrice,
            reason: `RSI (${this.rsi.toFixed(2)}) above overbought threshold (${this.config.overbought})`,
            expectedMovePct: -1.5, // Expect 1.5% pullback from overbought
            confidence: Math.min(0.7, (this.rsi - this.config.overbought) / (100 - this.config.overbought)) // Higher confidence when more overbought
          };
      }

      // Never track internal state - positions are the source of truth!

      return {
        signal,
        data: signalData,
        metadata: {
          symbol: this.config.symbol,
          rsi: this.rsi,
          overbought: this.config.overbought,
          oversold: this.config.oversold,
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
      name: 'RSI Strategy',
      description: 'RSI-based Mean Reversion Strategy',
      config: this.config,
      status: {
        pricesCount: this.prices.length,
        rsi: this.rsi
      }
    };
  }
}

module.exports = { RSIStrategy };
