/**
 * Generic Evolved Strategy
 * 
 * This strategy implementation is used for all evolved phenotypes from EvoTester.
 * It interprets the phenotype parameters to implement trading logic.
 */

class EvolvedStrategy {
  constructor(phenotypeData) {
    this.phenotype = phenotypeData;
    this.family = phenotypeData.family || 'unknown';
    this.params = phenotypeData.params || {};
    
    // Extract common parameters
    this.config = {
      symbol: this.params.symbol || 'SPY',
      qty: this.params.qty || 5,
      stopLoss: this.params.stop_loss || 0.02,
      takeProfit: this.params.take_profit || 0.05,
      ...this.params
    };
    
    // State
    this.position = null;
    this.entryPrice = null;
    this.indicators = {};
    this.priceHistory = [];
    
    console.log(`[EvolvedStrategy] Initialized ${this.phenotype.id} (${this.family} family)`);
  }
  
  async run(context) {
    const { paperBroker, strategyName } = context;
    
    try {
      // Get current price
      const quote = await paperBroker.getQuote(this.config.symbol);
      if (!quote || !quote.price) {
        console.log(`[${strategyName}] No quote for ${this.config.symbol}`);
        return;
      }
      
      const currentPrice = quote.price;
      this.priceHistory.push(currentPrice);
      
      // Keep only recent history
      if (this.priceHistory.length > 100) {
        this.priceHistory.shift();
      }
      
      // Get current position
      this.position = await paperBroker.getPosition(this.config.symbol);
      
      // Execute strategy based on family
      switch (this.family) {
        case 'trend':
          await this.executeTrendStrategy(paperBroker, strategyName, currentPrice);
          break;
        case 'meanrev':
          await this.executeMeanReversionStrategy(paperBroker, strategyName, currentPrice);
          break;
        case 'breakout':
          await this.executeBreakoutStrategy(paperBroker, strategyName, currentPrice);
          break;
        default:
          console.log(`[${strategyName}] Unknown family: ${this.family}`);
      }
      
    } catch (error) {
      console.error(`[${strategyName}] Error:`, error);
    }
  }
  
  async executeTrendStrategy(paperBroker, strategyName, currentPrice) {
    if (this.priceHistory.length < 20) return;
    
    // Calculate simple moving averages
    const ma_fast = this.calculateSMA(this.params.ma_fast || 10);
    const ma_slow = this.calculateSMA(this.params.ma_slow || 20);
    
    if (!ma_fast || !ma_slow) return;
    
    // Generate signals
    const signal = ma_fast > ma_slow ? 'buy' : 'sell';
    
    // Execute trades
    if (!this.position && signal === 'buy') {
      await this.enterPosition(paperBroker, strategyName, 'buy', currentPrice);
    } else if (this.position && signal === 'sell') {
      await this.exitPosition(paperBroker, strategyName);
    }
    
    // Check stop loss and take profit
    if (this.position && this.entryPrice) {
      await this.checkExitConditions(paperBroker, strategyName, currentPrice);
    }
  }
  
  async executeMeanReversionStrategy(paperBroker, strategyName, currentPrice) {
    if (this.priceHistory.length < 20) return;
    
    // Calculate mean and standard deviation
    const mean = this.calculateSMA(this.params.lookback || 20);
    const stdDev = this.calculateStdDev(this.params.lookback || 20);
    
    if (!mean || !stdDev) return;
    
    // Calculate z-score
    const zScore = (currentPrice - mean) / stdDev;
    const threshold = this.params.z_threshold || 2.0;
    
    // Generate signals
    if (!this.position) {
      if (zScore < -threshold) {
        // Price is oversold, buy
        await this.enterPosition(paperBroker, strategyName, 'buy', currentPrice);
      } else if (zScore > threshold) {
        // Price is overbought, short (if enabled)
        if (this.params.allow_short) {
          await this.enterPosition(paperBroker, strategyName, 'sell', currentPrice);
        }
      }
    } else {
      // Exit when price reverts to mean
      if (Math.abs(zScore) < 0.5) {
        await this.exitPosition(paperBroker, strategyName);
      }
    }
  }
  
  async executeBreakoutStrategy(paperBroker, strategyName, currentPrice) {
    if (this.priceHistory.length < 20) return;
    
    // Calculate recent high and low
    const lookback = this.params.lookback || 20;
    const recent = this.priceHistory.slice(-lookback);
    const high = Math.max(...recent);
    const low = Math.min(...recent);
    
    // Check for breakout
    const breakoutThreshold = this.params.breakout_pct || 0.01;
    
    if (!this.position) {
      if (currentPrice > high * (1 + breakoutThreshold)) {
        // Upward breakout
        await this.enterPosition(paperBroker, strategyName, 'buy', currentPrice);
      } else if (currentPrice < low * (1 - breakoutThreshold) && this.params.allow_short) {
        // Downward breakout
        await this.enterPosition(paperBroker, strategyName, 'sell', currentPrice);
      }
    } else {
      // Exit on reversal
      const range = high - low;
      const retracement = this.params.retracement || 0.5;
      
      if (this.position.side === 'long' && currentPrice < high - (range * retracement)) {
        await this.exitPosition(paperBroker, strategyName);
      } else if (this.position.side === 'short' && currentPrice > low + (range * retracement)) {
        await this.exitPosition(paperBroker, strategyName);
      }
    }
  }
  
  async enterPosition(paperBroker, strategyName, side, price) {
    try {
      const order = await paperBroker.submitOrder({
        symbol: this.config.symbol,
        qty: this.config.qty,
        side: side === 'buy' ? 'buy' : 'sell',
        type: 'market',
        source: strategyName
      });
      
      this.entryPrice = price;
      console.log(`[${strategyName}] Entered ${side} position at ${price}`);
      
    } catch (error) {
      console.error(`[${strategyName}] Failed to enter position:`, error);
    }
  }
  
  async exitPosition(paperBroker, strategyName) {
    if (!this.position) return;
    
    try {
      const side = this.position.side === 'long' ? 'sell' : 'buy';
      
      const order = await paperBroker.submitOrder({
        symbol: this.config.symbol,
        qty: Math.abs(this.position.qty),
        side: side,
        type: 'market',
        source: strategyName
      });
      
      console.log(`[${strategyName}] Exited position`);
      this.position = null;
      this.entryPrice = null;
      
    } catch (error) {
      console.error(`[${strategyName}] Failed to exit position:`, error);
    }
  }
  
  async checkExitConditions(paperBroker, strategyName, currentPrice) {
    if (!this.position || !this.entryPrice) return;
    
    const pnlPct = this.position.side === 'long' 
      ? (currentPrice - this.entryPrice) / this.entryPrice
      : (this.entryPrice - currentPrice) / this.entryPrice;
    
    // Check stop loss
    if (pnlPct <= -this.config.stopLoss) {
      console.log(`[${strategyName}] Stop loss triggered at ${(pnlPct * 100).toFixed(2)}%`);
      await this.exitPosition(paperBroker, strategyName);
      return;
    }
    
    // Check take profit
    if (pnlPct >= this.config.takeProfit) {
      console.log(`[${strategyName}] Take profit triggered at ${(pnlPct * 100).toFixed(2)}%`);
      await this.exitPosition(paperBroker, strategyName);
    }
  }
  
  calculateSMA(period) {
    if (this.priceHistory.length < period) return null;
    
    const recent = this.priceHistory.slice(-period);
    return recent.reduce((sum, price) => sum + price, 0) / period;
  }
  
  calculateStdDev(period) {
    if (this.priceHistory.length < period) return null;
    
    const mean = this.calculateSMA(period);
    if (!mean) return null;
    
    const recent = this.priceHistory.slice(-period);
    const squaredDiffs = recent.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    
    return Math.sqrt(variance);
  }
}

module.exports = { EvolvedStrategy };
