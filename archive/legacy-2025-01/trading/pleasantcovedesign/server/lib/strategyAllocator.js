/**
 * Strategy Allocator - IR-weighted capital allocation system
 * Distributes capital based on strategy performance and risk-adjusted returns
 */

class StrategyAllocator {
  constructor(options = {}) {
    this.maxActiveStrategies = options.maxActiveStrategies || 8;
    this.minTrades = options.minTrades || 50;
    this.minSharpe = options.minSharpe || 0.3;
    this.maxDrawdownThreshold = options.maxDrawdownThreshold || 0.15; // 15%
    this.totalRiskBudget = options.totalRiskBudget || 0.02; // 2% daily VaR
    this.minAllocation = options.minAllocation || 0.05; // 5% minimum per strategy
    this.maxAllocation = options.maxAllocation || 0.40; // 40% maximum per strategy

    // Track allocation history
    this.allocationHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Allocate capital across strategies based on IR-weighted scoring
   * @param {Object} strategyStats - Performance stats by strategy ID
   * @param {Object} context - Current market/portfolio context
   * @returns {Object} Allocation map with weights and reasons
   */
  allocateCapital(strategyStats, context) {
    const startTime = new Date();

    // 1. Filter eligible strategies
    const eligibleStrategies = this._filterEligibleStrategies(strategyStats);

    // 2. Score strategies by IR and other factors
    const scoredStrategies = this._scoreStrategies(eligibleStrategies, context);

    // 3. Select top strategies (limited by maxActiveStrategies)
    const selectedStrategies = this._selectTopStrategies(scoredStrategies);

    // 4. Calculate IR-weighted allocations
    const allocations = this._calculateAllocations(selectedStrategies);

    // 5. Apply risk limits and constraints
    const finalAllocations = this._applyRiskConstraints(allocations, context);

    // 6. Record allocation for audit
    const allocationRecord = {
      timestamp: startTime,
      totalStrategies: Object.keys(strategyStats).length,
      eligibleStrategies: eligibleStrategies.length,
      selectedStrategies: selectedStrategies.length,
      allocations: finalAllocations,
      totalAllocated: Object.values(finalAllocations).reduce((sum, alloc) => sum + alloc.weight, 0),
      context: {
        totalRiskBudget: this.totalRiskBudget,
        equity: context.equity,
        volatilityRegime: context.volatilityRegime
      }
    };

    this.allocationHistory.unshift(allocationRecord);
    if (this.allocationHistory.length > this.maxHistorySize) {
      this.allocationHistory.pop();
    }

    return {
      allocations: finalAllocations,
      summary: {
        totalStrategies: Object.keys(strategyStats).length,
        eligibleCount: eligibleStrategies.length,
        selectedCount: selectedStrategies.length,
        totalWeight: Object.values(finalAllocations).reduce((sum, alloc) => sum + alloc.weight, 0),
        totalRiskBudget: this.totalRiskBudget,
        timestamp: startTime
      },
      audit: allocationRecord
    };
  }

  /**
   * Filter strategies that meet minimum eligibility criteria
   */
  _filterEligibleStrategies(strategyStats) {
    const eligible = [];

    for (const [strategyId, stats] of Object.entries(strategyStats)) {
      const reasons = [];

      // Must have minimum trades
      if ((stats.trades_count || stats.trades || 0) < this.minTrades) {
        reasons.push(`insufficient_trades: ${stats.trades_count || stats.trades || 0} < ${this.minTrades}`);
      }

      // Must have minimum Sharpe ratio
      if ((stats.sharpe_ratio || stats.sharpe_after_costs || 0) < this.minSharpe) {
        reasons.push(`low_sharpe: ${stats.sharpe_ratio || 0} < ${this.minSharpe}`);
      }

      // Must not be in excessive drawdown
      if ((stats.max_drawdown || stats.current_drawdown || 0) > this.maxDrawdownThreshold) {
        reasons.push(`excessive_drawdown: ${(stats.max_drawdown || stats.current_drawdown || 0) * 100}% > ${(this.maxDrawdownThreshold * 100).toFixed(1)}%`);
      }

      // Must have positive expectancy (using win_rate as proxy if no PF available)
      const profitFactor = stats.profit_factor || stats.pf_after_costs || (stats.win_rate > 0.5 ? 1.1 : 0.9);
      if (profitFactor <= 1.0) {
        reasons.push(`negative_expectancy: ${profitFactor} <= 1.0`);
      }

      if (reasons.length === 0) {
        eligible.push({
          id: strategyId,
          stats: stats,
          eligible: true,
          score: 0 // Will be calculated next
        });
      } else {
        eligible.push({
          id: strategyId,
          stats: stats,
          eligible: false,
          reasons: reasons
        });
      }
    }

    return eligible.filter(s => s.eligible);
  }

  /**
   * Score strategies based on multiple factors
   */
  _scoreStrategies(eligibleStrategies, context) {
    return eligibleStrategies.map(strategy => {
      const stats = strategy.stats;

      // Primary: Information Ratio (IR) = Sharpe ratio proxy
      const ir = stats.sharpe_ratio || stats.sharpe_after_costs || 0;

      // Secondary factors
      const pf = stats.profit_factor || stats.pf_after_costs || (stats.win_rate > 0.5 ? 1.1 : 0.9);
      const trades = Math.min(stats.trades_count || stats.trades || 0, 500); // Cap at 500 for stability
      const winRate = stats.win_rate || 0.5;

      // Risk-adjusted score
      const riskAdjustment = Math.max(0.1, 1 - (stats.max_drawdown || stats.current_drawdown || 0));
      const stabilityBonus = Math.min(1.0, trades / 200); // Bonus for more trades

      // Context adjustments
      let contextMultiplier = 1.0;
      if (context.volatilityRegime === 'high' && stats.volatility_tolerant) {
        contextMultiplier = 1.2; // Bonus for vol-tolerant strategies in high vol
      } else if (context.volatilityRegime === 'low' && !stats.volatility_tolerant) {
        contextMultiplier = 1.1; // Bonus for mean-reversion in low vol
      }

      // Final score
      const score = ir * pf * riskAdjustment * stabilityBonus * contextMultiplier;

      return {
        ...strategy,
        score: score,
        components: {
          ir: ir,
          pf: pf,
          riskAdjustment: riskAdjustment,
          stabilityBonus: stabilityBonus,
          contextMultiplier: contextMultiplier,
          finalScore: score
        }
      };
    });
  }

  /**
   * Select top strategies up to maxActiveStrategies limit
   */
  _selectTopStrategies(scoredStrategies) {
    return scoredStrategies
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxActiveStrategies);
  }

  /**
   * Calculate allocations using IR-weighting with caps
   */
  _calculateAllocations(selectedStrategies) {
    if (selectedStrategies.length === 0) {
      return {};
    }

    // Calculate raw IR weights
    const totalScore = selectedStrategies.reduce((sum, s) => sum + Math.max(0, s.score), 0);

    if (totalScore === 0) {
      // Equal weight if all scores are zero or negative
      const equalWeight = 1.0 / selectedStrategies.length;
      return selectedStrategies.reduce((allocs, strategy) => {
        allocs[strategy.id] = {
          weight: equalWeight,
          reason: 'equal_weight_fallback',
          score: strategy.score,
          components: strategy.components
        };
        return allocs;
      }, {});
    }

    // Calculate weighted allocations
    const allocations = {};
    for (const strategy of selectedStrategies) {
      const rawWeight = strategy.score / totalScore;

      // Apply min/max caps
      const cappedWeight = Math.max(
        this.minAllocation,
        Math.min(this.maxAllocation, rawWeight)
      );

      allocations[strategy.id] = {
        weight: cappedWeight,
        rawWeight: rawWeight,
        reason: 'ir_weighted',
        score: strategy.score,
        components: strategy.components,
        stats: {
          trades: strategy.stats.trades,
          sharpe: strategy.stats.sharpe_after_costs,
          pf: strategy.stats.pf_after_costs,
          winRate: strategy.stats.win_rate
        }
      };
    }

    // Re-normalize after capping
    const totalWeight = Object.values(allocations).reduce((sum, alloc) => sum + alloc.weight, 0);
    const normalizationFactor = 1.0 / totalWeight;

    for (const [strategyId, alloc] of Object.entries(allocations)) {
      allocations[strategyId].weight *= normalizationFactor;
      allocations[strategyId].normalizedWeight = allocations[strategyId].weight;
    }

    return allocations;
  }

  /**
   * Apply final risk constraints and calculate dollar amounts
   */
  _applyRiskConstraints(allocations, context) {
    const equity = context.equity || 100000;
    const riskBudget = this.totalRiskBudget;

    for (const [strategyId, alloc] of Object.entries(allocations)) {
      // Calculate dollar allocation
      const dollarAllocation = alloc.weight * equity * riskBudget;

      // Calculate VaR allocation
      const varAllocation = alloc.weight * riskBudget;

      allocations[strategyId] = {
        ...alloc,
        dollarAllocation: dollarAllocation,
        varAllocation: varAllocation,
        maxPositionSize: dollarAllocation * 0.1, // 10% of strategy allocation
        dailyVaRLimit: varAllocation
      };
    }

    return allocations;
  }

  /**
   * Get current allocation summary
   */
  getCurrentAllocation() {
    if (this.allocationHistory.length === 0) {
      return { error: 'No allocation history available' };
    }

    return this.allocationHistory[0];
  }

  /**
   * Get allocation performance over time
   */
  getAllocationPerformance() {
    return {
      totalCycles: this.allocationHistory.length,
      averageStrategiesSelected: this.allocationHistory.reduce((sum, record) => sum + record.selectedStrategies, 0) / Math.max(1, this.allocationHistory.length),
      allocationStability: this._calculateStability(),
      recentAllocations: this.allocationHistory.slice(0, 5)
    };
  }

  _calculateStability() {
    if (this.allocationHistory.length < 2) {
      return 1.0; // Perfect stability with limited data
    }

    // Calculate how much allocations change between cycles
    let totalChange = 0;
    let comparisons = 0;

    for (let i = 0; i < this.allocationHistory.length - 1; i++) {
      const current = this.allocationHistory[i];
      const previous = this.allocationHistory[i + 1];

      // Compare overlap in selected strategies
      const currentIds = Object.keys(current.allocations);
      const previousIds = Object.keys(previous.allocations);

      const overlap = currentIds.filter(id => previousIds.includes(id)).length;
      const total = new Set([...currentIds, ...previousIds]).size;

      const change = 1 - (overlap / total);
      totalChange += change;
      comparisons++;
    }

    return 1 - (totalChange / comparisons); // Lower change = higher stability
  }

  /**
   * Emergency de-risk: reduce all allocations to safe levels
   */
  emergencyDerisk(reductionFactor = 0.5) {
    const currentAllocation = this.getCurrentAllocation();

    if (currentAllocation.error) {
      return { error: 'No current allocation to de-risk' };
    }

    const deriskedAllocations = {};
    for (const [strategyId, alloc] of Object.entries(currentAllocation.allocations)) {
      deriskedAllocations[strategyId] = {
        ...alloc,
        weight: alloc.weight * reductionFactor,
        dollarAllocation: alloc.dollarAllocation * reductionFactor,
        reason: `emergency_derisk_${reductionFactor}x`,
        emergency: true
      };
    }

    const deriskRecord = {
      timestamp: new Date(),
      type: 'emergency_derisk',
      reductionFactor: reductionFactor,
      originalAllocation: currentAllocation,
      deriskedAllocation: deriskedAllocations
    };

    this.allocationHistory.unshift(deriskRecord);

    return {
      success: true,
      reductionFactor: reductionFactor,
      newAllocations: deriskedAllocations,
      timestamp: new Date()
    };
  }
}

module.exports = { StrategyAllocator };
