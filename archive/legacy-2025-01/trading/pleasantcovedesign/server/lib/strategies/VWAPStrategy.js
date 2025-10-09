/**
 * VWAP (Volume Weighted Average Price) Strategy
 * Uses existing market indicators to trade mean reversion from VWAP
 */

class VWAPStrategy {
  constructor(config = {}) {
    this.config = {
      symbol: config.symbol || 'SPY',
      deviationThreshold: config.deviationThreshold || 0.02, // 2% from VWAP
      volumeThreshold: config.volumeThreshold || 1.2, // 20% above average volume
      minConfidence: config.minConfidence || 0.5,
      qty: config.qty || 5,
      stopLossPercent: config.stopLossPercent || 0.02,
      takeProfitPercent: config.takeProfitPercent || 0.03,
      ...config
    };

    this.name = 'vwap_reversion';
    this.type = 'mean_reversion';
    this.priceHistory = [];
    this.volumeHistory = [];
  }

  /**
   * Calculate VWAP for given price and volume data
   */
  calculateVWAP(prices, volumes, period = 20) {
    if (prices.length < period || volumes.length < period) return null;
    
    const recentPrices = prices.slice(-period);
    const recentVolumes = volumes.slice(-period);
    
    let totalPV = 0;
    let totalVolume = 0;
    
    for (let i = 0; i < period; i++) {
      totalPV += recentPrices[i] * recentVolumes[i];
      totalVolume += recentVolumes[i];
    }
    
    return totalVolume > 0 ? totalPV / totalVolume : null;
  }

  /**
   * Calculate volume ratio (current vs average)
   */
  calculateVolumeRatio(volumes, currentVolume) {
    if (volumes.length < 20) return 1;
    
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    return avgVolume > 0 ? currentVolume / avgVolume : 1;
  }

  /**
   * Main strategy logic
   */
  async run(context) {
    const { paperBroker, strategyName, marketData } = context;

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

      // Calculate VWAP
      const vwap = this.calculateVWAP(this.priceHistory, this.volumeHistory);
      if (!vwap) {
        return { signal: null, data: { message: 'Insufficient data for VWAP' } };
      }

      // Calculate deviation from VWAP
      const deviation = (currentPrice - vwap) / vwap;
      const absDeviation = Math.abs(deviation);

      // Calculate volume confirmation
      const volumeRatio = this.calculateVolumeRatio(this.volumeHistory, currentVolume);

      // Check if we should trade
      if (absDeviation < this.config.deviationThreshold) {
        return { 
          signal: null, 
          data: { 
            message: 'Price too close to VWAP',
            vwap,
            deviation: (deviation * 100).toFixed(2) + '%'
          } 
        };
      }

      // Volume confirmation required for entry
      if (volumeRatio < this.config.volumeThreshold) {
        return { 
          signal: null, 
          data: { 
            message: 'Insufficient volume',
            volumeRatio: volumeRatio.toFixed(2)
          } 
        };
      }

      // Generate signal
      const side = deviation < 0 ? 'buy' : 'sell'; // Buy below VWAP, sell above
      
      // Calculate confidence based on deviation and volume
      let confidence = Math.min(absDeviation * 20, 0.8); // Max 80% from deviation
      confidence *= Math.min(volumeRatio / 2, 1); // Boost for high volume
      confidence = Math.max(confidence, this.config.minConfidence);

      // Calculate stop and target
      const stopPrice = side === 'buy' 
        ? currentPrice * (1 - this.config.stopLossPercent)
        : currentPrice * (1 + this.config.stopLossPercent);
        
      const targetPrice = vwap; // Target is return to VWAP

      console.log(`[${strategyName}] VWAP Signal: ${side.toUpperCase()} ${this.config.symbol} @ ${currentPrice}`);
      console.log(`  VWAP: ${vwap.toFixed(2)}, Deviation: ${(deviation * 100).toFixed(2)}%`);
      console.log(`  Volume Ratio: ${volumeRatio.toFixed(2)}x, Confidence: ${(confidence * 100).toFixed(1)}%`);

      return {
        signal: {
          action: side,
          symbol: this.config.symbol,
          quantity: this.config.qty,
          confidence,
          strategy: this.name,
          metadata: {
            vwap,
            deviation: deviation * 100,
            volumeRatio,
            stopPrice,
            targetPrice,
            expectedReturn: Math.abs(targetPrice - currentPrice) / currentPrice
          }
        },
        data: {
          vwap,
          deviation: (deviation * 100).toFixed(2) + '%',
          volumeRatio: volumeRatio.toFixed(2),
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

module.exports = VWAPStrategy;
