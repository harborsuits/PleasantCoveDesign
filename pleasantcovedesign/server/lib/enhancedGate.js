/**
 * Enhanced Risk Management Gates
 * Fail-closed safety system with comprehensive pre-trade validation
 */

const { CONFIG } = require('./config');

class EnhancedRiskGate {
  constructor(options = {}) {
    this.maxSpreadBps = options.maxSpreadBps || 200; // 2% max spread
    this.maxNotionalPct = options.maxNotionalPct || 0.02; // 2% of equity per position
    this.maxOpenPositions = options.maxOpenPositions || 10;
    this.maxDailyVaR = options.maxDailyVaR || 0.02; // 2% daily VaR limit
    this.minLiquidityScore = options.minLiquidityScore || 0.7;
    this.maxCorrelationBucket = options.maxCorrelationBucket || 0.3; // 30% max per correlation bucket

    // Track recent rejections for audit
    this.recentRejections = [];
    this.maxRejectionsHistory = 100;
  }

  /**
   * Enhanced pre-trade gate with comprehensive risk checks
   */
  async validateTrade(intent, context) {
    const startTime = new Date();
    const checks = [];
    
    console.log(`[RiskGate] Validating trade for ${intent.symbol} - intent:`, JSON.stringify(intent));
    console.log(`[RiskGate] Context:`, JSON.stringify({...context, strategy_stats: 'omitted'}));

    try {
      // 1. Health checks
      checks.push(await this._checkHealth(context));
      checks.push(this._checkTradingHours());

      // 2. Liquidity checks
      checks.push(await this._checkLiquidity(intent, context));

      // 3. Position limits
      checks.push(await this._checkPositionLimits(intent, context));

      // 4. Portfolio risk
      checks.push(await this._checkPortfolioRisk(intent, context));

      // 5. Strategy-specific limits
      checks.push(await this._checkStrategyLimits(intent, context));

      // 6. Market conditions
      checks.push(await this._checkMarketConditions(intent, context));

      // 7. Size validation
      checks.push(this._validateSize(intent, context));

      // Find first rejection
      const rejection = checks.find(check => check.decision === 'REJECT');
      console.log(`[RiskGate] All checks:`, JSON.stringify(checks));

      if (rejection) {
        this._recordRejection(intent, rejection, context);
        return {
          decision: 'REJECT',
          reason: rejection.reason,
          details: rejection.details,
          routed_qty: 0,
          audit: {
            intent_id: intent.key,
            symbol: intent.symbol,
            timestamp: startTime,
            failed_check: rejection.check,
            context: {
              equity: context.equity,
              cash: context.cash,
              spread_bps: intent.spread_bps,
              requested_qty: intent.size_hint
            }
          }
        };
      }

      // All checks passed
      return {
        decision: 'ACCEPT',
        reason: null,
        routed_qty: intent.size_hint,
        audit: {
          intent_id: intent.key,
          symbol: intent.symbol,
          timestamp: startTime,
          checks_passed: checks.length
        }
      };

    } catch (error) {
      console.error('Risk gate error:', error);
      this._recordRejection(intent, {
        decision: 'REJECT',
        reason: 'GATE_ERROR',
        check: 'system_error',
        details: error.message
      }, context);

      return {
        decision: 'REJECT',
        reason: 'GATE_ERROR',
        routed_qty: 0
      };
    }
  }

  async _checkHealth(context) {
    const issues = [];

    // If breakers are disabled, accept health in dev/paper mode
    if (!CONFIG.BREAKERS_ENABLED) {
      return { decision: 'ACCEPT', check: 'health' };
    }

    if (context.quote_age_s > (CONFIG.QUOTE_STALE_SEC || 300)) {
      issues.push('stale_quotes');
    }

    if (context.broker_age_s > (CONFIG.BROKER_STALE_SEC || 300)) {
      issues.push('stale_broker');
    }

    if (!context.broker_ok) {
      issues.push('broker_down');
    }

    if (issues.length > 0) {
      return {
        decision: 'REJECT',
        reason: 'HEALTH_CHECK_FAILED',
        check: 'health',
        details: issues.join(', ')
      };
    }

    return { decision: 'ACCEPT', check: 'health' };
  }

  _checkTradingHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Allow off-hours if configured (paper/dev) or if breakers are disabled
    if (CONFIG.ALLOW_OFFHOURS || process.env.ALLOW_OFFHOURS === '1' || !CONFIG.BREAKERS_ENABLED) {
      return { decision: 'ACCEPT', check: 'trading_hours' };
    }

    // Weekend check
    if (day === 0 || day === 6) {
      return {
        decision: 'REJECT',
        reason: 'MARKET_CLOSED',
        check: 'trading_hours',
        details: 'weekend'
      };
    }

    // Trading hours: 9:30 AM - 4:00 PM ET
    if (hour < 9 || (hour === 9 && now.getMinutes() < 30) || hour >= 16) {
      return {
        decision: 'REJECT',
        reason: 'MARKET_CLOSED',
        check: 'trading_hours',
        details: `${hour}:${now.getMinutes()}`
      };
    }

    return { decision: 'ACCEPT', check: 'trading_hours' };
  }

  async _checkLiquidity(intent, context) {
    const spreadBps = intent.spread_bps || 0;

    if (spreadBps > this.maxSpreadBps) {
      return {
        decision: 'REJECT',
        reason: 'INSUFFICIENT_LIQUIDITY',
        check: 'liquidity',
        details: `spread ${spreadBps}bps > ${this.maxSpreadBps}bps limit`
      };
    }

    // Check bid/ask spread as % of price
    const spreadPct = spreadBps / 10000; // Convert bps to percentage
    const price = context.last_price || intent.price;
    console.log(`[RiskGate] Liquidity check - context.last_price: ${context.last_price}, intent.price: ${intent.price}, final price: ${price}`);

    if (!price || price <= 0) {
      return {
        decision: 'REJECT',
        reason: 'INVALID_PRICE',
        check: 'liquidity',
        details: `Invalid price: ${price}`
      };
    }

    if ((spreadPct / price) > 0.02) { // 2% max spread
      return {
        decision: 'REJECT',
        reason: 'WIDE_SPREAD',
        check: 'liquidity',
        details: `spread ${(spreadPct/price*100).toFixed(2)}% of price`
      };
    }

    return { decision: 'ACCEPT', check: 'liquidity' };
  }

  async _checkPositionLimits(intent, context) {
    const price = context.last_price || intent.price;
    if (!price || price <= 0) {
      return {
        decision: 'REJECT',
        reason: 'INVALID_PRICE',
        check: 'position_limits',
        details: `Invalid price: ${price}`
      };
    }

    const notional = Math.abs(intent.size_hint * price);
    const maxNotional = context.equity * this.maxNotionalPct;

    if (notional > maxNotional) {
      return {
        decision: 'REJECT',
        reason: 'POSITION_SIZE_EXCEEDED',
        check: 'position_limits',
        details: `$${notional.toFixed(2)} > $${maxNotional.toFixed(2)} (${(this.maxNotionalPct*100).toFixed(1)}% of equity)`
      };
    }

    // Check open positions count
    const openPositions = context.open_positions_count || 0;
    if (openPositions >= this.maxOpenPositions) {
      return {
        decision: 'REJECT',
        reason: 'MAX_POSITIONS_EXCEEDED',
        check: 'position_limits',
        details: `${openPositions} >= ${this.maxOpenPositions} max positions`
      };
    }

    return { decision: 'ACCEPT', check: 'position_limits' };
  }

  async _checkPortfolioRisk(intent, context) {
    // Check daily VaR budget
    const currentVaR = context.current_daily_var || 0;
    const estimatedTradeVaR = this._estimateTradeVaR(intent, context);

    if (currentVaR + estimatedTradeVaR > this.maxDailyVaR) {
      return {
        decision: 'REJECT',
        reason: 'VAR_LIMIT_EXCEEDED',
        check: 'portfolio_risk',
        details: `VaR ${(currentVaR + estimatedTradeVaR).toFixed(3)} > ${(this.maxDailyVaR).toFixed(3)} limit`
      };
    }

    // Check correlation bucket limits
    const price = context.last_price || intent.price;
    if (!price || price <= 0) {
      return {
        decision: 'REJECT',
        reason: 'INVALID_PRICE',
        check: 'portfolio_risk',
        details: `Invalid price: ${price}`
      };
    }

    const notional = Math.abs(intent.size_hint * price);
    const correlationBucket = this._getCorrelationBucket(intent.symbol);
    const bucketExposure = context.correlation_buckets?.[correlationBucket] || 0;
    const newExposure = bucketExposure + (notional / context.equity);

    if (newExposure > this.maxCorrelationBucket) {
      return {
        decision: 'REJECT',
        reason: 'CORRELATION_LIMIT_EXCEEDED',
        check: 'portfolio_risk',
        details: `Bucket ${correlationBucket}: ${(newExposure*100).toFixed(1)}% > ${(this.maxCorrelationBucket*100).toFixed(1)}%`
      };
    }

    return { decision: 'ACCEPT', check: 'portfolio_risk' };
  }

  async _checkStrategyLimits(intent, context) {
    const strategyId = intent.strategy_id;
    const strategyStats = context.strategy_stats?.[strategyId] || {};

    // Check if strategy is in drawdown
    const currentDrawdown = strategyStats.current_drawdown || 0;
    if (currentDrawdown > 0.1) { // 10% drawdown
      return {
        decision: 'REJECT',
        reason: 'STRATEGY_IN_DRAWDOWN',
        check: 'strategy_limits',
        details: `Drawdown ${(currentDrawdown*100).toFixed(1)}% > 10% limit`
      };
    }

    // Check strategy heat
    const strategyHeat = context.strategy_heat || 0;
    if (strategyHeat > 0.8) { // 80% heat limit
      return {
        decision: 'REJECT',
        reason: 'STRATEGY_OVERHEATED',
        check: 'strategy_limits',
        details: `Heat ${(strategyHeat*100).toFixed(1)}% > 80% limit`
      };
    }

    return { decision: 'ACCEPT', check: 'strategy_limits' };
  }

  async _checkMarketConditions(intent, context) {
    // Check volatility regime
    const volRegime = context.volatility_regime || 'normal';
    if (volRegime === 'extreme' && !intent.volatility_tolerant) {
      return {
        decision: 'REJECT',
        reason: 'EXTREME_VOLATILITY',
        check: 'market_conditions',
        details: 'Extreme volatility regime detected'
      };
    }

    // Check for earnings/events
    if (context.upcoming_events?.length > 0) {
      return {
        decision: 'REJECT',
        reason: 'UPCOMING_EVENT',
        check: 'market_conditions',
        details: `Events: ${context.upcoming_events.join(', ')}`
      };
    }

    return { decision: 'ACCEPT', check: 'market_conditions' };
  }

  _validateSize(intent, context) {
    const qty = intent.size_hint;

    // Minimum size checks
    if (Math.abs(qty) < 1) {
      return {
        decision: 'REJECT',
        reason: 'SIZE_TOO_SMALL',
        check: 'size_validation',
        details: `Quantity ${qty} below minimum 1`
      };
    }

    // Cash availability
    const price = context.last_price || intent.price;
    if (!price || price <= 0) {
      return {
        decision: 'REJECT',
        reason: 'INVALID_PRICE',
        check: 'size_validation',
        details: `Invalid price: ${price}`
      };
    }

    const notional = Math.abs(qty * price);
    if (notional > context.cash) {
      return {
        decision: 'REJECT',
        reason: 'INSUFFICIENT_CASH',
        check: 'size_validation',
        details: `Need $${notional.toFixed(2)}, have $${context.cash.toFixed(2)}`
      };
    }

    return { decision: 'ACCEPT', check: 'size_validation' };
  }

  _estimateTradeVaR(intent, context) {
    // Simple VaR estimation based on position size and volatility
    const price = context.last_price || intent.price;
    if (!price || price <= 0) {
      return 0; // Return 0 VaR for invalid prices
    }

    const notional = Math.abs(intent.size_hint * price);
    const vol = context.volatility || 0.2; // 20% default
    const confidence = 1.96; // 95% confidence
    const timeHorizon = 1; // 1 day
    
    // Calculate VaR as percentage of equity
    const equity = context.equity || 100000;
    const varDollars = notional * vol * confidence * Math.sqrt(timeHorizon);
    const varPercent = varDollars / equity;

    return varPercent;
  }

  _getCorrelationBucket(symbol) {
    // Simple sector-based bucketing (would be more sophisticated in production)
    const techStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
    const financeStocks = ['JPM', 'BAC', 'WFC', 'GS', 'MS'];

    if (techStocks.includes(symbol)) return 'technology';
    if (financeStocks.includes(symbol)) return 'finance';
    return 'other';
  }

  _recordRejection(intent, rejection, context) {
    const rejectionRecord = {
      timestamp: new Date(),
      intent_id: intent.key,
      symbol: intent.symbol,
      strategy_id: intent.strategy_id,
      reason: rejection.reason,
      check: rejection.check,
      details: rejection.details,
      context: {
        equity: context.equity,
        cash: context.cash,
        spread_bps: intent.spread_bps
      }
    };

    this.recentRejections.unshift(rejectionRecord);
    if (this.recentRejections.length > this.maxRejectionsHistory) {
      this.recentRejections.pop();
    }
  }

  getRecentRejections(limit = 10) {
    return this.recentRejections.slice(0, limit);
  }

  getRejectionStats() {
    const stats = {};
    for (const rejection of this.recentRejections) {
      const reason = rejection.reason;
      stats[reason] = (stats[reason] || 0) + 1;
    }
    return stats;
  }
}

module.exports = { EnhancedRiskGate };
