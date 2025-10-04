/**
 * Risk Management System - The "Brakes and Tires"
 * Implements smart position sizing and stop loss management
 */

class RiskManager {
  constructor(performanceRecorder, paperBroker) {
    this.performanceRecorder = performanceRecorder;
    this.paperBroker = paperBroker;
    
    // Configuration
    this.config = {
      // Position sizing
      maxPositionPercent: 0.10,    // Max 10% in any single position
      maxTotalRiskPercent: 0.02,   // Max 2% total portfolio risk
      kellyFraction: 0.25,         // Use 25% of Kelly (conservative)
      minPositionSize: 100,        // Minimum $100 position
      
      // Stop losses
      defaultStopPercent: 0.015,   // 1.5% default stop
      trailingStopPercent: 0.02,   // 2% trailing stop
      profitLockPercent: 0.005,    // Lock in profits when up 0.5%
      
      // Risk limits
      maxDailyLossPercent: 0.02,   // Stop trading if down 2% for day
      maxConsecutiveLosses: 3,     // Reduce size after 3 losses
      maxDrawdownPercent: 0.05,    // Emergency stop at 5% drawdown
    };
    
    // State tracking
    this.positionStops = new Map();      // symbol -> stop price
    this.positionPeaks = new Map();      // symbol -> highest price seen
    this.dailyPnL = 0;
    this.consecutiveLosses = 0;
    this.startingBalance = 0;
    this.lastCheckTime = Date.now();
  }
  
  /**
   * Calculate optimal position size using Kelly Criterion
   */
  async calculateOptimalSize(symbol, entryPrice, confidence = 0.5) {
    try {
      // Get account info
      const accountResp = await fetch('http://localhost:4000/api/paper/account');
      if (!accountResp.ok) return { shares: 0, reason: 'Cannot fetch account' };
      
      const account = await accountResp.json();
      const equity = account.equity || account.cash || 100000;
      
      // Get historical performance for Kelly calculation
      const stats = await this.getStrategyStats();
      
      // Kelly Criterion: f = (p*b - q) / b
      // Where: p = win rate, b = avg win/avg loss, q = loss rate
      const winRate = stats.winRate || 0.5;
      const avgWinLoss = stats.avgWinLossRatio || 1.5;
      
      const kellyPercent = this.calculateKelly(winRate, avgWinLoss);
      
      // Adjust Kelly based on confidence
      const adjustedKelly = kellyPercent * confidence * this.config.kellyFraction;
      
      // Calculate position size
      let positionPercent = Math.min(
        adjustedKelly,
        this.config.maxPositionPercent
      );
      
      // Reduce size if we've had consecutive losses
      if (this.consecutiveLosses >= this.config.maxConsecutiveLosses) {
        positionPercent *= 0.5; // Half size after losing streak
        console.log(`[RiskManager] Reducing size due to ${this.consecutiveLosses} consecutive losses`);
      }
      
      // Check daily loss limit
      const dailyLossPercent = this.dailyPnL / equity;
      if (dailyLossPercent < -this.config.maxDailyLossPercent * 0.5) {
        positionPercent *= 0.5; // Half size when approaching daily limit
        console.log(`[RiskManager] Reducing size due to daily loss: ${(dailyLossPercent * 100).toFixed(2)}%`);
      }
      
      // Calculate shares
      const positionValue = equity * positionPercent;
      const shares = Math.floor(positionValue / entryPrice);
      
      // Validate minimum size
      if (positionValue < this.config.minPositionSize) {
        return {
          shares: 0,
          reason: `Position too small: $${positionValue.toFixed(2)} < $${this.config.minPositionSize}`,
          kellyPercent: kellyPercent * 100,
          adjustedPercent: positionPercent * 100
        };
      }
      
      return {
        shares,
        positionValue,
        percentOfEquity: positionPercent * 100,
        kellyPercent: kellyPercent * 100,
        confidence,
        stopPrice: this.calculateStopPrice(symbol, entryPrice, 'buy'),
        riskAmount: positionValue * this.config.defaultStopPercent
      };
      
    } catch (error) {
      console.error('[RiskManager] Position sizing error:', error);
      return { shares: 0, reason: 'Calculation error' };
    }
  }
  
  /**
   * Calculate Kelly percentage
   */
  calculateKelly(winRate, avgWinLossRatio) {
    if (avgWinLossRatio <= 0) return 0;
    
    const p = winRate;
    const q = 1 - winRate;
    const b = avgWinLossRatio;
    
    // Kelly formula: f = (p*b - q) / b
    const kelly = (p * b - q) / b;
    
    // Never bet more than 25% even if Kelly says to
    return Math.max(0, Math.min(0.25, kelly));
  }
  
  /**
   * Get strategy performance stats
   */
  async getStrategyStats() {
    const trades = this.performanceRecorder.trades || [];
    const recentTrades = trades.slice(-100); // Last 100 trades
    
    if (recentTrades.length < 10) {
      // Not enough data, use conservative defaults
      return {
        winRate: 0.5,
        avgWinLossRatio: 1.5,
        avgWin: 0.02,
        avgLoss: 0.015
      };
    }
    
    const wins = recentTrades.filter(t => (t.pnl_at_exit || 0) > 0);
    const losses = recentTrades.filter(t => (t.pnl_at_exit || 0) < 0);
    
    const winRate = wins.length / recentTrades.length;
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + t.pnl_at_exit, 0) / wins.length
      : 0;
    const avgLoss = losses.length > 0
      ? Math.abs(losses.reduce((sum, t) => sum + t.pnl_at_exit, 0) / losses.length)
      : 0;
    
    return {
      winRate,
      avgWinLossRatio: avgLoss > 0 ? avgWin / avgLoss : 1.5,
      avgWin,
      avgLoss
    };
  }
  
  /**
   * Calculate stop loss price
   */
  calculateStopPrice(symbol, entryPrice, side = 'buy') {
    const stopPercent = this.config.defaultStopPercent;
    
    if (side === 'buy' || side === 'BUY') {
      return entryPrice * (1 - stopPercent);
    } else {
      return entryPrice * (1 + stopPercent);
    }
  }
  
  /**
   * Set stop loss for a new position
   */
  setStopLoss(symbol, entryPrice, side = 'buy') {
    const stopPrice = this.calculateStopPrice(symbol, entryPrice, side);
    
    this.positionStops.set(symbol, {
      stopPrice,
      entryPrice,
      side,
      isTrailing: false,
      highWaterMark: entryPrice
    });
    
    console.log(`[RiskManager] Stop loss set for ${symbol}: $${stopPrice.toFixed(2)} (${(this.config.defaultStopPercent * 100).toFixed(1)}% from entry)`);
    
    return stopPrice;
  }
  
  /**
   * Update trailing stops for winning positions
   */
  updateTrailingStops(positions, quotes) {
    for (const position of positions) {
      if (position.qty <= 0) continue;
      
      const quote = quotes[position.symbol];
      if (!quote) continue;
      
      const currentPrice = quote.last || quote.price;
      const stopData = this.positionStops.get(position.symbol);
      
      if (!stopData) {
        // No stop data, create one based on average cost
        this.setStopLoss(position.symbol, position.avg_cost || currentPrice, 'buy');
        continue;
      }
      
      // Update high water mark
      if (currentPrice > stopData.highWaterMark) {
        stopData.highWaterMark = currentPrice;
        
        // Calculate profit percentage
        const profitPct = (currentPrice - stopData.entryPrice) / stopData.entryPrice;
        
        // Start trailing stop once we're up more than lock percentage
        if (profitPct > this.config.profitLockPercent) {
          const newStop = currentPrice * (1 - this.config.trailingStopPercent);
          
          // Only raise stop, never lower it
          if (newStop > stopData.stopPrice) {
            stopData.stopPrice = newStop;
            stopData.isTrailing = true;
            
            console.log(`[RiskManager] Trailing stop updated for ${position.symbol}: $${newStop.toFixed(2)} (protecting ${(profitPct * 100).toFixed(1)}% profit)`);
          }
        }
      }
    }
  }
  
  /**
   * Check if any positions should be stopped out
   */
  async checkStopLosses() {
    try {
      // Get positions and quotes
      const positionsResp = await fetch('http://localhost:4000/api/paper/positions');
      if (!positionsResp.ok) return [];
      
      const positions = await positionsResp.json();
      const openPositions = positions.filter(p => p.qty > 0);
      
      if (openPositions.length === 0) return [];
      
      // Get current quotes
      const symbols = openPositions.map(p => p.symbol).join(',');
      const quotesResp = await fetch(`http://localhost:4000/api/quotes?symbols=${symbols}`);
      if (!quotesResp.ok) return [];
      
      const quotes = await quotesResp.json();
      
      // Update trailing stops first
      this.updateTrailingStops(openPositions, quotes);
      
      // Check for stop triggers
      const stopsToExecute = [];
      
      for (const position of openPositions) {
        const quote = quotes[position.symbol];
        if (!quote) continue;
        
        const currentPrice = quote.last || quote.price;
        const stopData = this.positionStops.get(position.symbol);
        
        if (!stopData) continue;
        
        // Check if stop is triggered
        const stopTriggered = stopData.side === 'buy' 
          ? currentPrice <= stopData.stopPrice
          : currentPrice >= stopData.stopPrice;
        
        if (stopTriggered) {
          const lossPct = stopData.side === 'buy'
            ? (currentPrice - stopData.entryPrice) / stopData.entryPrice
            : (stopData.entryPrice - currentPrice) / stopData.entryPrice;
          
          stopsToExecute.push({
            symbol: position.symbol,
            qty: position.qty,
            reason: stopData.isTrailing ? 'trailing_stop' : 'stop_loss',
            entryPrice: stopData.entryPrice,
            stopPrice: stopData.stopPrice,
            currentPrice,
            lossPct
          });
          
          console.log(`[RiskManager] Stop triggered for ${position.symbol}: ${(lossPct * 100).toFixed(2)}% loss`);
        }
      }
      
      return stopsToExecute;
      
    } catch (error) {
      console.error('[RiskManager] Stop loss check error:', error);
      return [];
    }
  }
  
  /**
   * Check overall risk limits
   */
  async checkRiskLimits() {
    try {
      const accountResp = await fetch('http://localhost:4000/api/paper/account');
      if (!accountResp.ok) return { withinLimits: true };
      
      const account = await accountResp.json();
      const equity = account.equity || account.cash || 100000;
      
      // Update daily PnL if new day
      const now = Date.now();
      const isNewDay = new Date(now).toDateString() !== new Date(this.lastCheckTime).toDateString();
      
      if (isNewDay) {
        this.dailyPnL = 0;
        this.startingBalance = equity;
        console.log(`[RiskManager] New day - reset daily PnL tracking`);
      }
      
      this.lastCheckTime = now;
      
      // Calculate current drawdown
      const currentPnL = equity - this.startingBalance;
      this.dailyPnL = currentPnL;
      
      const dailyLossPercent = -this.dailyPnL / this.startingBalance;
      const maxDrawdown = this.calculateMaxDrawdown();
      
      // Check limits
      const limits = {
        withinLimits: true,
        warnings: [],
        restrictions: []
      };
      
      // Daily loss limit
      if (dailyLossPercent > this.config.maxDailyLossPercent) {
        limits.withinLimits = false;
        limits.restrictions.push(`Daily loss limit exceeded: ${(dailyLossPercent * 100).toFixed(2)}%`);
      } else if (dailyLossPercent > this.config.maxDailyLossPercent * 0.75) {
        limits.warnings.push(`Approaching daily loss limit: ${(dailyLossPercent * 100).toFixed(2)}%`);
      }
      
      // Max drawdown
      if (maxDrawdown > this.config.maxDrawdownPercent) {
        limits.withinLimits = false;
        limits.restrictions.push(`Max drawdown exceeded: ${(maxDrawdown * 100).toFixed(2)}%`);
      }
      
      // Consecutive losses
      if (this.consecutiveLosses >= this.config.maxConsecutiveLosses) {
        limits.warnings.push(`${this.consecutiveLosses} consecutive losses - position sizes reduced`);
      }
      
      return limits;
      
    } catch (error) {
      console.error('[RiskManager] Risk limit check error:', error);
      return { withinLimits: true };
    }
  }
  
  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown() {
    const trades = this.performanceRecorder.trades || [];
    if (trades.length === 0) return 0;
    
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    
    for (const trade of trades) {
      runningPnL += trade.pnl_at_exit || 0;
      
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      
      const drawdown = peak > 0 ? (peak - runningPnL) / peak : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
  
  /**
   * Record trade result for tracking
   */
  recordTradeResult(symbol, pnl) {
    // Clear stop data
    this.positionStops.delete(symbol);
    this.positionPeaks.delete(symbol);
    
    // Update consecutive losses
    if (pnl < 0) {
      this.consecutiveLosses++;
    } else if (pnl > 0) {
      this.consecutiveLosses = 0;
    }
    
    // Update daily PnL
    this.dailyPnL += pnl;
    
    console.log(`[RiskManager] Trade result recorded: ${symbol} P&L: $${pnl.toFixed(2)}, Consecutive losses: ${this.consecutiveLosses}`);
  }
  
  /**
   * Get current risk metrics
   */
  async getRiskMetrics() {
    const limits = await this.checkRiskLimits();
    const stats = await this.getStrategyStats();
    
    return {
      dailyPnL: this.dailyPnL,
      dailyPnLPercent: this.startingBalance > 0 ? this.dailyPnL / this.startingBalance : 0,
      consecutiveLosses: this.consecutiveLosses,
      maxDrawdown: this.calculateMaxDrawdown(),
      activeStops: this.positionStops.size,
      trailingStops: Array.from(this.positionStops.values()).filter(s => s.isTrailing).length,
      winRate: stats.winRate,
      kellyPercent: this.calculateKelly(stats.winRate, stats.avgWinLossRatio) * 100,
      riskStatus: limits
    };
  }
}

module.exports = { RiskManager };
