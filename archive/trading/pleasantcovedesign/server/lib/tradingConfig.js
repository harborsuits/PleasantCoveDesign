// Trading Configuration for Profitable Strategy
module.exports = {
  // Minimum requirements for trades
  minimums: {
    brainScore: 0.6, // Minimum brain score to consider a trade
    expectedMovePct: 1.0, // Minimum expected move to cover costs
    confidence: 0.5, // Minimum confidence level
    profitTargetBps: 50, // Minimum profit target in basis points after costs
  },
  
  // Cost estimates (basis points)
  costs: {
    commission: 5, // ~$0.005 per share on $100 stock
    spread: {
      largeCap: 5,
      midCap: 15,
      smallCap: 25
    },
    marketImpact: {
      largeCap: 5,
      midCap: 15,
      smallCap: 25
    },
    slippage: {
      low: 2.5,
      normal: 5,
      high: 10
    }
  },
  
  // Strategy-specific expected move multipliers
  strategyMultipliers: {
    momentum: 4.0, // Momentum strategies expect larger moves
    mean_reversion: 2.0, // Mean reversion expects smaller moves
    breakout: 5.0, // Breakout strategies expect big moves
    scalping: 1.0, // Scalping needs small moves but high win rate
    default: 3.0
  },
  
  // Volatility adjustments
  volatilityAdjustments: {
    low: 0.7, // Reduce expected move in low volatility
    normal: 1.0, // No adjustment
    high: 1.5 // Increase expected move in high volatility
  },
  
  // Risk management
  riskManagement: {
    maxPositionSizePct: 10, // Max 10% of capital per position
    maxTotalExposurePct: 60, // Max 60% total exposure
    stopLossPct: 2.0, // 2% stop loss
    profitTargetMultiple: 2.0 // 2:1 profit/loss ratio target
  },
  
  // Market condition filters
  marketFilters: {
    minVolume: 100000, // Minimum average volume
    minPrice: 5.0, // Minimum stock price
    maxSpreadBps: 50, // Maximum acceptable spread
    avoidEarnings: true, // Avoid trading around earnings
    avoidPremarket: true, // Avoid premarket/afterhours
  },
  
  // Strategy selection based on market conditions
  strategySelection: {
    trending: ['momentum', 'breakout'],
    rangebound: ['mean_reversion', 'scalping'],
    volatile: ['momentum', 'mean_reversion'],
    neutral: ['mean_reversion', 'momentum', 'breakout']
  }
};
