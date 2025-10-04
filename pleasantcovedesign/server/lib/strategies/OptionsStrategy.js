/**
 * Options Trading Strategy
 * Implements basic options trading strategies for paper trading
 */

class OptionsStrategy {
  constructor(config = {}) {
    this.name = config.name || 'options_basic';
    this.type = 'options';
    this.enabled = true;
    this.capital = config.capital || 10000;
    
    // Strategy parameters
    this.config = {
      // Use conservative covered calls and cash-secured puts
      strategies: ['covered_call', 'cash_secured_put', 'long_call_spread'],
      maxContractsPerTrade: 5,
      minDaysToExpiration: 21,
      maxDaysToExpiration: 45,
      minDelta: 0.25,
      maxDelta: 0.40,
      minImpliedVolatility: 0.15,
      targetPremiumPercent: 0.02, // 2% monthly target
      ...config
    };
    
    this.positions = new Map();
  }
  
  async run(data) {
    try {
      const { symbol, price, timestamp } = data;
      
      // Only trade liquid stocks suitable for options
      const optionableStocks = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'TSLA', 'AMD', 'NVDA'];
      if (!optionableStocks.includes(symbol)) {
        return null;
      }
      
      // Check market conditions
      const signal = this.analyzeForOptions(symbol, price);
      if (!signal) return null;
      
      return {
        action: signal.action,
        symbol: symbol,
        quantity: signal.quantity,
        confidence: signal.confidence,
        strategy: this.name,
        optionsData: {
          strategyType: signal.strategyType,
          strike: signal.strike,
          expiration: signal.expiration,
          optionType: signal.optionType,
          contracts: signal.contracts,
          estimatedPremium: signal.premium
        }
      };
      
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return null;
    }
  }
  
  analyzeForOptions(symbol, price) {
    // Simplified options strategy logic
    const hasPosition = this.positions.has(symbol);
    
    // Covered call strategy (if we own stock)
    if (hasPosition && Math.random() > 0.7) {
      const position = this.positions.get(symbol);
      if (position.quantity >= 100) {
        const strike = Math.ceil(price * 1.02); // 2% OTM
        const contracts = Math.floor(position.quantity / 100);
        
        return {
          action: 'sell_call',
          strategyType: 'covered_call',
          strike: strike,
          expiration: this.getExpirationDate(30),
          optionType: 'call',
          contracts: Math.min(contracts, this.config.maxContractsPerTrade),
          quantity: -contracts, // Negative for selling
          premium: strike * 0.02, // Estimated 2% premium
          confidence: 0.75
        };
      }
    }
    
    // Cash-secured put strategy (if we have cash)
    if (!hasPosition && price > 20 && Math.random() > 0.6) {
      const strike = Math.floor(price * 0.95); // 5% OTM
      const contracts = Math.min(
        Math.floor(this.capital / (strike * 100)),
        this.config.maxContractsPerTrade
      );
      
      if (contracts > 0) {
        return {
          action: 'sell_put',
          strategyType: 'cash_secured_put',
          strike: strike,
          expiration: this.getExpirationDate(30),
          optionType: 'put',
          contracts: contracts,
          quantity: -contracts, // Negative for selling
          premium: strike * 0.015, // Estimated 1.5% premium
          confidence: 0.70
        };
      }
    }
    
    // Bull call spread (if bullish)
    if (!hasPosition && Math.random() > 0.8) {
      const longStrike = Math.floor(price);
      const shortStrike = Math.ceil(price * 1.05);
      const contracts = Math.min(5, this.config.maxContractsPerTrade);
      
      return {
        action: 'bull_call_spread',
        strategyType: 'vertical_spread',
        strike: longStrike,
        shortStrike: shortStrike,
        expiration: this.getExpirationDate(35),
        optionType: 'call',
        contracts: contracts,
        quantity: contracts, // Positive for buying spread
        premium: (shortStrike - longStrike) * 0.3, // Max profit estimate
        confidence: 0.65
        };
    }
    
    return null;
  }
  
  getExpirationDate(daysOut) {
    const date = new Date();
    date.setDate(date.getDate() + daysOut);
    
    // Move to next Friday
    const dayOfWeek = date.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilFriday);
    
    return date.toISOString().split('T')[0];
  }
  
  updatePosition(symbol, quantity, price) {
    if (this.positions.has(symbol)) {
      const pos = this.positions.get(symbol);
      pos.quantity += quantity;
      if (pos.quantity === 0) {
        this.positions.delete(symbol);
      }
    } else if (quantity > 0) {
      this.positions.set(symbol, {
        quantity,
        avgPrice: price,
        timestamp: new Date()
      });
    }
  }
  
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      enabled: this.enabled,
      config: this.config,
      openPositions: this.positions.size
    };
  }
}

module.exports = OptionsStrategy;
