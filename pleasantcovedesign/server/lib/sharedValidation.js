/**
 * Shared Validation Layer
 * All strategies and components MUST use this for validation
 */

class SharedValidation {
  constructor(paperBroker, capitalTracker, circuitBreaker) {
    this.paperBroker = paperBroker;
    this.capitalTracker = capitalTracker;
    this.circuitBreaker = circuitBreaker;
    this.positionCache = new Map();
    this.lastCacheUpdate = 0;
    this.CACHE_TTL = 5000; // 5 seconds
  }

  /**
   * Core validation that EVERY signal must pass
   */
  async validateSignal(signal) {
    const validations = {
      hasPosition: false,
      positionSize: 0,
      canBuy: false,
      canSell: false,
      capitalAvailable: 0,
      riskAllowed: true,
      circuitBreakerOk: true,
      errors: []
    };

    try {
      // 1. Get fresh position data
      const positions = await this.getFreshPositions();
      const position = positions.find(p => p.symbol === signal.symbol);
      
      validations.hasPosition = !!position;
      validations.positionSize = position ? position.qty : 0;

      // 2. Validate based on signal type
      if (signal.action === 'buy' || signal.action === 'BUY') {
        // Can't buy if we already have a position
        if (validations.hasPosition && validations.positionSize > 0) {
          validations.errors.push(`Already have ${validations.positionSize} shares of ${signal.symbol}`);
          validations.canBuy = false;
        } else {
          validations.canBuy = true;
        }

        // Check capital
        const capital = await this.capitalTracker.getAvailableCapital();
        validations.capitalAvailable = capital;
        
        if (capital < signal.quantity * (signal.price || 100)) {
          validations.errors.push('Insufficient capital');
          validations.canBuy = false;
        }
      }
      
      if (signal.action === 'sell' || signal.action === 'SELL') {
        // Can't sell if we don't have a position
        if (!validations.hasPosition || validations.positionSize <= 0) {
          validations.errors.push(`No position in ${signal.symbol} to sell`);
          validations.canSell = false;
        } else if (signal.quantity > validations.positionSize) {
          validations.errors.push(`Can't sell ${signal.quantity} shares, only have ${validations.positionSize}`);
          validations.canSell = false;
        } else {
          validations.canSell = true;
        }
      }

      // 3. Circuit breaker check
      if (this.circuitBreaker) {
        const cbStatus = await this.circuitBreaker.canTrade();
        validations.circuitBreakerOk = cbStatus.allowed;
        if (!cbStatus.allowed) {
          validations.errors.push(`Circuit breaker: ${cbStatus.reason}`);
          validations.riskAllowed = false;
        }
      }

      // 4. Risk checks
      const riskCheck = await this.validateRisk(signal);
      if (!riskCheck.allowed) {
        validations.errors.push(`Risk check failed: ${riskCheck.reason}`);
        validations.riskAllowed = false;
      }

    } catch (error) {
      validations.errors.push(`Validation error: ${error.message}`);
    }

    // Final decision
    validations.isValid = 
      ((signal.action === 'buy' && validations.canBuy) ||
       (signal.action === 'sell' && validations.canSell)) &&
      validations.riskAllowed &&
      validations.circuitBreakerOk;

    return validations;
  }

  /**
   * Get fresh positions with caching
   */
  async getFreshPositions() {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.CACHE_TTL && this.positionCache.size > 0) {
      return Array.from(this.positionCache.values());
    }

    try {
      const positions = this.paperBroker.getPositions();
      this.positionCache.clear();
      positions.forEach(p => this.positionCache.set(p.symbol, p));
      this.lastCacheUpdate = now;
      return positions;
    } catch (error) {
      console.error('[SharedValidation] Failed to get positions:', error);
      return Array.from(this.positionCache.values()); // Use cache if fetch fails
    }
  }

  /**
   * Shared risk validation
   */
  async validateRisk(signal) {
    // Max position size check
    const maxPositionSize = 0.10; // 10% of portfolio
    const accountValue = await this.capitalTracker.getTotalEquity();
    const positionValue = signal.quantity * (signal.price || 100);
    
    if (positionValue > accountValue * maxPositionSize) {
      return {
        allowed: false,
        reason: `Position size ${(positionValue/accountValue*100).toFixed(1)}% exceeds max 10%`
      };
    }

    // Daily loss check
    const dailyPnL = await this.capitalTracker.getDailyPnL();
    const maxDailyLoss = accountValue * 0.02; // 2% max daily loss
    
    if (dailyPnL < -maxDailyLoss) {
      return {
        allowed: false,
        reason: `Daily loss ${(dailyPnL/accountValue*100).toFixed(1)}% exceeds max 2%`
      };
    }

    return { allowed: true };
  }

  /**
   * Shared state management - strategies should NOT maintain their own state
   */
  getStrategyState(strategyId) {
    // Return actual positions, not what strategy thinks it has
    const positions = Array.from(this.positionCache.values());
    return {
      positions: positions,
      positionsBySymbol: Object.fromEntries(
        positions.map(p => [p.symbol, p])
      )
    };
  }
}

module.exports = SharedValidation;
