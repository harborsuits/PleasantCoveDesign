/**
 * Decision Coordinator - Resolves conflicts between multiple trading strategies
 * Implements evidence-based prioritization with after-cost EV scoring
 */

class DecisionCoordinator {
  constructor(options = {}) {
    this.maxStrategiesPerSymbol = options.maxStrategiesPerSymbol || 5;
    this.evWeight = options.evWeight || 1.0;
    this.reliabilityWeight = options.reliabilityWeight || 1.0;
    this.liquidityWeight = options.liquidityWeight || 1.0;
    this.confidenceWeight = options.confidenceWeight || 1.0;

    // Track last cycle's decisions for audit
    this.lastCycle = {
      timestamp: null,
      rawSignals: [],
      scoredSignals: [],
      winners: [],
      rejects: [],
      conflicts: []
    };
  }

  /**
   * Main coordination function - resolves conflicts between multiple strategies
   * @param {Array} rawSignals - Array of trading signals from all strategies
   * @param {Object} strategyStats - Performance stats by strategy ID
   * @returns {Array} Winning intents with audit trail
   */
  pickWinningIntents(rawSignals, strategyStats) {
    const startTime = new Date();

    // 1. Normalize and score all signals
    const scoredSignals = this._scoreSignals(rawSignals, strategyStats);

    // 2. Group by symbol and pick winners
    const symbolGroups = this._groupBySymbol(scoredSignals);
    const winners = [];
    const conflicts = [];

    for (const [symbol, signals] of Object.entries(symbolGroups)) {
      const { winner, contenders } = this._pickSymbolWinner(symbol, signals);

      if (winner) {
        winners.push(winner);
      }

      // Track conflicts for audit
      if (signals.length > 1) {
        conflicts.push({
          symbol,
          totalSignals: signals.length,
          winner: winner?.strategy_id,
          topScore: winner?.score || 0,
          contenders: contenders.map(s => ({
            strategy_id: s.strategy_id,
            score: s.score,
            reason: s.rejection_reason || 'lost_to_winner'
          }))
        });
      }
    }

    // 3. Update audit trail
    this.lastCycle = {
      timestamp: startTime,
      rawSignals: rawSignals.length,
      scoredSignals: scoredSignals.length,
      winners: winners.length,
      rejects: scoredSignals.length - winners.length,
      conflicts: conflicts.length,
      details: {
        winners: winners.map(w => ({
          symbol: w.symbol,
          strategy: w.strategy_id,
          score: w.score,
          side: w.side
        })),
        conflicts: conflicts
      }
    };

    return winners;
  }

  /**
   * Score individual signals based on expected value, reliability, liquidity
   */
  _scoreSignals(rawSignals, strategyStats) {
    return rawSignals.map(signal => {
      // Get strategy performance stats
      const stats = strategyStats[signal.strategy_id] || {
        profit_factor: 1.0,
        trades_count: 0,
        win_rate: 0.5,
        avg_win: 0,
        avg_loss: 0
      };

      // Calculate reliability factor (0.5 to 2.0)
      const reliability = Math.max(0.5, Math.min(2.0,
        (stats.profit_factor || stats.pf_after_costs || 1) * (1 + Math.min(stats.trades_count || stats.trades || 0, 500) / 1000)
      ));

      // Calculate liquidity factor (0.5 to 1.5)
      const spreadPenalty = (signal.spread_bps || 0) / 10000; // 1bps = 0.01
      const liquidity = Math.max(0.5, Math.min(1.5, 1 - spreadPenalty));

      // Calculate expected after-cost value
      const pWin = stats.win_rate || 0.5;
      const avgWin = Math.abs(stats.avg_win || 0);
      const avgLoss = Math.abs(stats.avg_loss || 0);
      const costsEst = signal.costs_est || 0;

      const afterCostEV = (pWin * avgWin) - ((1 - pWin) * avgLoss) - costsEst;

      // Final score combines all factors
      const score = afterCostEV * reliability * liquidity * (signal.confidence || 1.0);

      return {
        ...signal,
        reliability,
        liquidity,
        afterCostEV,
        score,
        // Audit fields
        scoring_breakdown: {
          afterCostEV,
          reliability,
          liquidity,
          confidence: signal.confidence || 1.0,
          final_score: score
        }
      };
    });
  }

  /**
   * Group signals by symbol
   */
  _groupBySymbol(scoredSignals) {
    const groups = {};
    for (const signal of scoredSignals) {
      if (!groups[signal.symbol]) {
        groups[signal.symbol] = [];
      }
      groups[signal.symbol].push(signal);
    }
    return groups;
  }

  /**
   * Pick the winning signal for a specific symbol
   */
  _pickSymbolWinner(symbol, signals) {
    if (signals.length === 0) {
      return { winner: null, contenders: [] };
    }

    if (signals.length === 1) {
      return {
        winner: this._formatWinner(signals[0]),
        contenders: []
      };
    }

    // Sort by score (highest first)
    const sorted = signals.sort((a, b) => b.score - a.score);
    const winner = sorted[0];

    // Mark others as rejected
    for (let i = 1; i < sorted.length; i++) {
      sorted[i].rejection_reason = 'lower_score';
    }

    return {
      winner: this._formatWinner(winner),
      contenders: sorted.slice(1, 6) // Top 5 contenders for audit
    };
  }

  /**
   * Format winner signal into final intent
   */
  _formatWinner(signal) {
    return {
      symbol: signal.symbol,
      side: signal.side,
      size_hint: signal.quantity || signal.size_hint || 1,
      price: signal.price, // ADD THIS LINE - critical for risk validation!
      key: `${signal.symbol}:${signal.side}:${signal.strategy_id}`,
      strategy_id: signal.strategy_id,
      score: signal.score,
      meta: {
        reason: "coordinator_winner",
        winner: signal.strategy_id,
        score: signal.score,
        afterCostEV: signal.afterCostEV,
        reliability: signal.reliability,
        liquidity: signal.liquidity,
        confidence: signal.confidence || 1.0,
        scoring_breakdown: signal.scoring_breakdown
      }
    };
  }

  /**
   * Get audit trail for the last coordination cycle
   */
  getLastCycleAudit() {
    return this.lastCycle;
  }

  /**
   * Get summary statistics
   */
  getStats() {
    return {
      total_coordination_cycles: 1, // Would increment in real implementation
      average_signals_per_cycle: this.lastCycle.rawSignals,
      average_conflicts_per_cycle: this.lastCycle.conflicts,
      average_winners_per_cycle: this.lastCycle.winners,
      last_cycle_timestamp: this.lastCycle.timestamp
    };
  }
}

module.exports = { DecisionCoordinator };
