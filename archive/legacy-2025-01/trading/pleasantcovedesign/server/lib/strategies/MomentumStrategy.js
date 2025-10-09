/**
 * Momentum Strategy
 * Trades based on price momentum, volume surge, and technical indicators
 */

class MomentumStrategy {
  constructor(config = {}) {
    this.config = {
      symbol: config.symbol || 'SPY',
      lookbackPeriod: config.lookbackPeriod || 20,
      momentumThreshold: config.momentumThreshold || 0.02, // 2% minimum momentum
      volumeMultiplier: config.volumeMultiplier || 1.5, // 50% above average
      rsiOverbought: config.rsiOverbought || 70,
      rsiOversold: config.rsiOversold || 30,
      macdSignalThreshold: config.macdSignalThreshold || 0,
      qty: config.qty || 5,
      stopLossPercent: config.stopLossPercent || 0.02,
      takeProfitPercent: config.takeProfitPercent || 0.05,
      ...config
    };

    this.name = 'momentum_advanced';
    this.type = 'momentum';
    this.priceHistory = [];
    this.volumeHistory = [];
  }

  /**
   * Calculate momentum (rate of change)
   */
  calculateMomentum(prices, period) {
    if (prices.length < period + 1) return 0;
    
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - period - 1];
    
    return (currentPrice - pastPrice) / pastPrice;
  }

  /**
   * Calculate RSI
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD
   */
  calculateMACD(prices) {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };

    // Simple implementation - in production, use exponential moving averages
    const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
    const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
    const macd = ema12 - ema26;
    
    // Simplified signal line (9-period average of MACD)
    const signal = macd * 0.9; // Simplified
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  /**
   * Main strategy logic
   */
  async run(context) {
    const { paperBroker, strategyName } = context;

    try {
      // Get current price
      const currentPrice = paperBroker.getCurrentPrice(this.config.symbol);
      if (!currentPrice) {
        return { signal: null, data: { message: 'No price available' } };
      }
      
      // For now, use mock volume data (in production, get from quotes service)
      const currentVolume = Math.floor(Math.random() * 1000000) + 500000;

      // Update history
      this.priceHistory.push(currentPrice);
      this.volumeHistory.push(currentVolume);

      // Keep only recent data
      if (this.priceHistory.length > 100) {
        this.priceHistory = this.priceHistory.slice(-100);
        this.volumeHistory = this.volumeHistory.slice(-100);
      }

      // Need minimum data
      if (this.priceHistory.length < 26) {
        return { signal: null, data: { message: 'Insufficient price history' } };
      }

      // Calculate indicators
      const momentum = this.calculateMomentum(this.priceHistory, this.config.lookbackPeriod);
      const rsi = this.calculateRSI(this.priceHistory);
      const macd = this.calculateMACD(this.priceHistory);
      
      // Volume analysis
      const avgVolume = this.volumeHistory.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

      // Momentum scoring
      let score = 0;
      let signals = [];

      // 1. Price momentum
      if (Math.abs(momentum) > this.config.momentumThreshold) {
        score += momentum > 0 ? 1 : -1;
        signals.push(`Momentum: ${(momentum * 100).toFixed(2)}%`);
      }

      // 2. Volume confirmation
      if (volumeRatio > this.config.volumeMultiplier) {
        score += momentum > 0 ? 0.5 : -0.5;
        signals.push(`Volume surge: ${volumeRatio.toFixed(2)}x`);
      }

      // 3. RSI confirmation
      if (momentum > 0 && rsi < this.config.rsiOverbought && rsi > 50) {
        score += 0.5;
        signals.push(`RSI bullish: ${rsi.toFixed(1)}`);
      } else if (momentum < 0 && rsi > this.config.rsiOversold && rsi < 50) {
        score -= 0.5;
        signals.push(`RSI bearish: ${rsi.toFixed(1)}`);
      }

      // 4. MACD confirmation
      if (macd.histogram > 0 && momentum > 0) {
        score += 0.5;
        signals.push('MACD bullish');
      } else if (macd.histogram < 0 && momentum < 0) {
        score -= 0.5;
        signals.push('MACD bearish');
      }

      // No signal if score is neutral
      if (Math.abs(score) < 1.5) {
        return { 
          signal: null, 
          data: { 
            message: 'Insufficient momentum signals',
            score,
            momentum: (momentum * 100).toFixed(2) + '%',
            rsi: rsi.toFixed(1)
          } 
        };
      }

      // Generate signal
      const side = score > 0 ? 'buy' : 'sell';
      const confidence = Math.min(Math.abs(score) / 3, 0.9); // Max 90% confidence

      // Dynamic stops based on volatility
      const recentPrices = this.priceHistory.slice(-20);
      const volatility = Math.sqrt(
        recentPrices.reduce((sum, price, i, arr) => {
          if (i === 0) return 0;
          const change = (price - arr[i-1]) / arr[i-1];
          return sum + change * change;
        }, 0) / (recentPrices.length - 1)
      );

      const stopDistance = Math.max(this.config.stopLossPercent, volatility * 2);
      const targetDistance = Math.max(this.config.takeProfitPercent, volatility * 4);

      const stopPrice = side === 'buy' 
        ? currentPrice * (1 - stopDistance)
        : currentPrice * (1 + stopDistance);
        
      const targetPrice = side === 'buy'
        ? currentPrice * (1 + targetDistance)
        : currentPrice * (1 - targetDistance);

      console.log(`[${strategyName}] Momentum Signal: ${side.toUpperCase()} ${this.config.symbol} @ ${currentPrice}`);
      console.log(`  Score: ${score.toFixed(2)}, Signals: ${signals.join(', ')}`);
      console.log(`  Volatility: ${(volatility * 100).toFixed(2)}%, Confidence: ${(confidence * 100).toFixed(1)}%`);

      return {
        signal: {
          action: side,
          symbol: this.config.symbol,
          quantity: this.config.qty,
          confidence,
          strategy: this.name,
          metadata: {
            momentum: momentum * 100,
            rsi,
            macdHistogram: macd.histogram,
            volumeRatio,
            score,
            signals,
            volatility: volatility * 100,
            stopPrice,
            targetPrice
          }
        },
        data: {
          momentum: (momentum * 100).toFixed(2) + '%',
          rsi: rsi.toFixed(1),
          volumeRatio: volumeRatio.toFixed(2) + 'x',
          score: score.toFixed(2),
          confidence: (confidence * 100).toFixed(1) + '%'
        }
      };

    } catch (error) {
      console.error(`[${strategyName}] Error:`, error);
      return { signal: null, data: { error: error.message } };
    }
  }

  /**
   * Analyze method for scanner integration
   */
  async analyze(candidate, context) {
    // Temporarily set symbol for this analysis
    const originalSymbol = this.config.symbol;
    this.config.symbol = candidate.symbol;
    
    const result = await this.run(context);
    
    // Restore original symbol
    this.config.symbol = originalSymbol;
    
    if (result.signal) {
      return {
        symbol: candidate.symbol,
        side: result.signal.action,
        confidence: result.signal.confidence,
        strategy: this.name,
        metadata: result.signal.metadata
      };
    }
    
    return null;
  }
}

module.exports = MomentumStrategy;
