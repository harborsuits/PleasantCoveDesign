// Expected Value Calculator with Realistic Trading Costs
class ExpectedValueCalculator {
  constructor(config = {}) {
    this.config = {
      // Commission costs (per share)
      commissionPerShare: config.commissionPerShare || 0.005, // $0.005 per share
      minCommission: config.minCommission || 1.00, // $1 minimum
      
      // Market impact multipliers
      smallCapImpactBps: config.smallCapImpactBps || 25, // 25 bps for small caps
      midCapImpactBps: config.midCapImpactBps || 15, // 15 bps for mid caps
      largeCapImpactBps: config.largeCapImpactBps || 5, // 5 bps for large caps
      
      // Slippage factors
      baseSlippageBps: config.baseSlippageBps || 5, // 5 bps base slippage
      volatilityMultiplier: config.volatilityMultiplier || 2, // 2x for high volatility
      
      // Risk adjustments
      minProfitTargetBps: config.minProfitTargetBps || 50, // Need 50 bps profit minimum
      riskAdjustment: config.riskAdjustment || 0.8, // 80% probability adjustment
      
      ...config
    };
  }

  /**
   * Calculate the expected value of a trade after all costs
   * @param {Object} trade - Trade parameters
   * @returns {Object} Expected value calculation
   */
  calculateExpectedValue(trade) {
    const {
      symbol,
      side,
      quantity,
      price,
      expectedMove, // Expected price movement in %
      confidence, // Confidence in the prediction (0-1)
      spreadBps = 10, // Current bid-ask spread in basis points
      avgVolume = 1000000, // Average daily volume
      marketCap = 'large', // 'small', 'mid', or 'large'
      volatility = 'normal' // 'low', 'normal', 'high'
    } = trade;

    // Calculate position value
    const positionValue = price * quantity;
    
    // 1. Calculate commission costs
    const commissionCost = Math.max(
      this.config.minCommission,
      quantity * this.config.commissionPerShare
    );
    const commissionBps = (commissionCost / positionValue) * 10000;

    // 2. Calculate spread cost (pay half on entry, half on exit)
    const spreadCost = positionValue * (spreadBps / 10000);
    const spreadCostBps = spreadBps;

    // 3. Calculate market impact based on market cap
    let marketImpactBps = this.config.largeCapImpactBps;
    if (marketCap === 'small') {
      marketImpactBps = this.config.smallCapImpactBps;
    } else if (marketCap === 'mid') {
      marketImpactBps = this.config.midCapImpactBps;
    }
    
    // Adjust market impact based on trade size vs average volume
    const volumeImpact = Math.min(quantity / avgVolume, 0.01); // Cap at 1% of ADV
    marketImpactBps *= (1 + volumeImpact * 10); // Scale up for larger trades
    
    const marketImpactCost = positionValue * (marketImpactBps / 10000);

    // 4. Calculate slippage based on volatility
    let slippageBps = this.config.baseSlippageBps;
    if (volatility === 'high') {
      slippageBps *= this.config.volatilityMultiplier;
    } else if (volatility === 'low') {
      slippageBps *= 0.5;
    }
    const slippageCost = positionValue * (slippageBps / 10000);

    // 5. Total cost calculation (round trip - entry and exit)
    const totalCostBps = (commissionBps * 2) + spreadCostBps + marketImpactBps + slippageBps;
    const totalCost = (commissionCost * 2) + spreadCost + marketImpactCost + slippageCost;

    // 6. Calculate expected profit
    const expectedProfitBps = expectedMove * 100; // Convert % to bps
    const expectedProfit = positionValue * (expectedMove / 100);

    // 7. Calculate risk-adjusted expected value
    const probabilityOfSuccess = Math.min(confidence * this.config.riskAdjustment, 0.95);
    const expectedGain = expectedProfit * probabilityOfSuccess;
    const expectedLoss = totalCost; // Always pay costs
    
    // 8. Final expected value calculation
    const expectedValue = expectedGain - expectedLoss;
    const expectedValueBps = (expectedValue / positionValue) * 10000;
    const afterCostEV = expectedValueBps / 10000; // Convert to decimal for compatibility

    // 9. Determine if trade is profitable
    const isProfitable = expectedValueBps > this.config.minProfitTargetBps;

    return {
      symbol,
      side,
      quantity,
      price,
      positionValue,
      
      // Cost breakdown
      costs: {
        commissionCost: commissionCost * 2, // Round trip
        commissionBps: commissionBps * 2,
        spreadCost,
        spreadCostBps,
        marketImpactCost,
        marketImpactBps,
        slippageCost,
        slippageBps,
        totalCost,
        totalCostBps
      },
      
      // Expected profit
      expectedMove,
      expectedProfitBps,
      expectedProfit,
      confidence,
      probabilityOfSuccess,
      
      // Final calculation
      expectedValue,
      expectedValueBps,
      afterCostEV, // For compatibility with existing code
      isProfitable,
      
      // Decision
      recommendation: isProfitable ? 'EXECUTE' : 'REJECT',
      reason: isProfitable 
        ? `Expected profit of ${expectedValueBps.toFixed(0)} bps exceeds costs of ${totalCostBps.toFixed(0)} bps`
        : `Expected profit of ${expectedProfitBps.toFixed(0)} bps does not cover costs of ${totalCostBps.toFixed(0)} bps`
    };
  }

  /**
   * Quick check if a trade meets minimum profitability threshold
   * @param {number} expectedMovePct - Expected price movement in %
   * @param {number} confidence - Confidence level (0-1)
   * @param {number} spreadBps - Current spread in basis points
   * @returns {boolean} Whether trade is likely profitable
   */
  quickProfitabilityCheck(expectedMovePct, confidence, spreadBps = 10) {
    // Quick calculation assuming typical costs
    const typicalCostsBps = 30 + spreadBps; // 30 bps typical + spread
    const expectedProfitBps = expectedMovePct * 100;
    const adjustedProfitBps = expectedProfitBps * confidence * this.config.riskAdjustment;
    
    return adjustedProfitBps > typicalCostsBps + this.config.minProfitTargetBps;
  }
}

module.exports = ExpectedValueCalculator;
