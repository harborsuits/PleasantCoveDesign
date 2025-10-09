/**
 * Learning Insights Generator
 * Provides actionable insights from trading patterns and bot learning
 */

class LearningInsights {
  constructor(performanceRecorder, enhancedRecorder) {
    this.performanceRecorder = performanceRecorder;
    this.enhancedRecorder = enhancedRecorder;
  }

  /**
   * Generate comprehensive learning insights
   */
  async generateInsights() {
    const trades = this.performanceRecorder.trades || [];
    const todaysTrades = trades.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.timestamp).toDateString() === today;
    });

    const insights = {
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      summary: await this.generateSummary(todaysTrades),
      patterns: await this.identifyPatterns(trades),
      lessons: await this.extractLessons(trades),
      recommendations: await this.generateRecommendations(trades),
      evolution: await this.getEvolutionProgress()
    };

    return insights;
  }

  async generateSummary(todaysTrades) {
    const buyTrades = todaysTrades.filter(t => t.side === 'buy');
    const sellTrades = todaysTrades.filter(t => t.side === 'sell');
    
    // Analyze timing patterns
    const tradeTimes = todaysTrades.map(t => {
      const hour = new Date(t.timestamp).getHours();
      const minute = new Date(t.timestamp).getMinutes();
      return hour + (minute / 60);
    });

    const avgTradeTime = tradeTimes.length > 0 
      ? tradeTimes.reduce((a, b) => a + b, 0) / tradeTimes.length 
      : 0;

    return {
      totalTrades: todaysTrades.length,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      avgTradeHour: Math.floor(avgTradeTime),
      mostActiveHour: this.getMostActiveHour(todaysTrades),
      tradeDistribution: this.getTradeDistribution(todaysTrades)
    };
  }

  async identifyPatterns(trades) {
    const patterns = [];

    // Pattern 1: Time-based patterns
    const morningTrades = trades.filter(t => {
      const hour = new Date(t.timestamp).getHours();
      return hour >= 9 && hour < 11;
    });

    const afternoonTrades = trades.filter(t => {
      const hour = new Date(t.timestamp).getHours();
      return hour >= 14 && hour < 16;
    });

    if (morningTrades.length > afternoonTrades.length * 2) {
      patterns.push({
        type: 'timing',
        pattern: 'morning_bias',
        confidence: 0.8,
        description: 'Bot is more active in morning sessions',
        actionable: 'Consider spreading trades throughout the day for better price discovery'
      });
    }

    // Pattern 2: Symbol concentration
    const symbolCounts = {};
    trades.forEach(t => {
      symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
    });

    const sortedSymbols = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedSymbols.length > 0 && sortedSymbols[0][1] > trades.length * 0.2) {
      patterns.push({
        type: 'concentration',
        pattern: 'symbol_bias',
        confidence: 0.7,
        description: `Over-concentrated on ${sortedSymbols[0][0]} (${sortedSymbols[0][1]} trades)`,
        actionable: 'Diversify symbol selection to reduce concentration risk'
      });
    }

    // Pattern 3: Size patterns
    const sizes = trades.map(t => t.qty || 1).filter(q => q > 0);
    const avgSize = sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
    const recentSizes = sizes.slice(-10);
    const recentAvg = recentSizes.length > 0 ? recentSizes.reduce((a, b) => a + b, 0) / recentSizes.length : 0;

    if (recentAvg > avgSize * 1.5) {
      patterns.push({
        type: 'sizing',
        pattern: 'increasing_confidence',
        confidence: 0.6,
        description: 'Position sizes are increasing over time',
        actionable: 'Good sign of growing confidence, but ensure risk limits are maintained'
      });
    }

    // Pattern 4: Win/Loss streaks
    const results = this.getTradeResults(trades);
    const streaks = this.findStreaks(results);
    
    if (streaks.currentStreak.type && Math.abs(streaks.currentStreak.length) >= 3) {
      patterns.push({
        type: 'streak',
        pattern: `${streaks.currentStreak.type}_streak`,
        confidence: 0.5,
        description: `Currently on a ${streaks.currentStreak.length} trade ${streaks.currentStreak.type} streak`,
        actionable: streaks.currentStreak.type === 'winning' 
          ? 'Maintain discipline, don\'t increase risk during win streaks'
          : 'Consider reducing position size during drawdowns'
      });
    }

    return patterns;
  }

  async extractLessons(trades) {
    const lessons = [];

    // Lesson 1: Best performing time slots
    const timeSlotPerformance = this.analyzeTimeSlots(trades);
    if (timeSlotPerformance.bestSlot) {
      lessons.push({
        category: 'timing',
        lesson: `Best performance during ${timeSlotPerformance.bestSlot.name}`,
        evidence: `${timeSlotPerformance.bestSlot.winRate}% win rate in this period`,
        application: 'Focus more capital allocation during proven profitable time windows'
      });
    }

    // Lesson 2: Strategy performance
    const strategyPerformance = this.analyzeStrategies(trades);
    if (strategyPerformance.best) {
      lessons.push({
        category: 'strategy',
        lesson: `${strategyPerformance.best.name} strategy performing best`,
        evidence: `${strategyPerformance.best.profitFactor.toFixed(2)} profit factor`,
        application: 'Allocate more capital to winning strategies'
      });
    }

    // Lesson 3: Symbol characteristics
    const symbolAnalysis = this.analyzeSymbolCharacteristics(trades);
    if (symbolAnalysis.pattern) {
      lessons.push({
        category: 'selection',
        lesson: symbolAnalysis.pattern,
        evidence: symbolAnalysis.evidence,
        application: symbolAnalysis.recommendation
      });
    }

    // Lesson 4: Risk management
    const riskAnalysis = this.analyzeRiskManagement(trades);
    if (riskAnalysis.lesson) {
      lessons.push({
        category: 'risk',
        lesson: riskAnalysis.lesson,
        evidence: riskAnalysis.evidence,
        application: riskAnalysis.recommendation
      });
    }

    return lessons;
  }

  async generateRecommendations(trades) {
    const recommendations = [];

    // Analyze current state
    const recentTrades = trades.slice(-20);
    const performance = this.calculatePerformanceMetrics(recentTrades);
    
    // Recommendation 1: Position sizing
    if (performance.avgLoss > performance.avgWin * 2) {
      recommendations.push({
        priority: 'high',
        category: 'risk',
        action: 'Adjust stop loss levels',
        reason: 'Average losses are more than 2x average wins',
        implementation: 'Tighten stops to 1.5% or use trailing stops'
      });
    }

    // Recommendation 2: Trade frequency
    const tradesPerDay = this.calculateTradesPerDay(trades);
    if (tradesPerDay < 5) {
      recommendations.push({
        priority: 'medium',
        category: 'activity',
        action: 'Lower entry thresholds slightly',
        reason: `Only ${tradesPerDay.toFixed(1)} trades per day on average`,
        implementation: 'Consider reducing buy threshold from 40% to 38%'
      });
    } else if (tradesPerDay > 30) {
      recommendations.push({
        priority: 'high',
        category: 'activity',
        action: 'Increase quality filters',
        reason: `Too many trades (${tradesPerDay.toFixed(1)} per day)`,
        implementation: 'Raise buy threshold to 42% and increase minimum confidence'
      });
    }

    // Recommendation 3: Diversification
    const concentration = this.calculateConcentration(trades);
    if (concentration.top5Percent > 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'diversification',
        action: 'Expand symbol universe',
        reason: `Top 5 symbols represent ${(concentration.top5Percent * 100).toFixed(1)}% of trades`,
        implementation: 'Add more symbols to scanning list or enable dynamic discovery'
      });
    }

    // Recommendation 4: Market conditions
    const regime = this.enhancedRecorder?.getCurrentRegime() || { trend: 'neutral' };
    const strategyMix = this.getStrategyMix(trades);
    
    if (regime.trend === 'trending' && strategyMix.meanReversion > 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'strategy',
        action: 'Adjust strategy allocation',
        reason: 'Using mean reversion strategies in trending market',
        implementation: 'Increase momentum strategy allocation in trending conditions'
      });
    }

    return recommendations;
  }

  async getEvolutionProgress() {
    // Get strategy evolution metrics
    const evolution = {
      generationsComplete: 0,
      currentGeneration: 1,
      improvementRate: 0,
      topStrategies: [],
      parameterConvergence: {}
    };

    // This would connect to actual evolution system
    // For now, return placeholder that shows structure
    return {
      ...evolution,
      status: 'Early stage - collecting baseline data',
      nextMilestone: '40 trades per strategy for first evolution'
    };
  }

  // Helper methods
  getMostActiveHour(trades) {
    const hourCounts = {};
    trades.forEach(t => {
      const hour = new Date(t.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? parseInt(sorted[0][0]) : 0;
  }

  getTradeDistribution(trades) {
    const dist = {
      morning: 0,   // 9:30-11:30
      midday: 0,    // 11:30-14:00
      afternoon: 0, // 14:00-16:00
    };

    trades.forEach(t => {
      const time = new Date(t.timestamp);
      const hour = time.getHours();
      const minute = time.getMinutes();
      const totalMinutes = hour * 60 + minute;

      if (totalMinutes >= 570 && totalMinutes < 690) dist.morning++;
      else if (totalMinutes >= 690 && totalMinutes < 840) dist.midday++;
      else if (totalMinutes >= 840 && totalMinutes < 960) dist.afternoon++;
    });

    return dist;
  }

  getTradeResults(trades) {
    return trades.map(t => ({
      symbol: t.symbol,
      side: t.side,
      pnl: t.pnl_at_exit || 0,
      result: (t.pnl_at_exit || 0) > 0 ? 'win' : 'loss'
    }));
  }

  findStreaks(results) {
    const streaks = {
      longest_win: 0,
      longest_loss: 0,
      currentStreak: { type: null, length: 0 }
    };

    let currentWin = 0;
    let currentLoss = 0;

    results.forEach(r => {
      if (r.result === 'win') {
        currentWin++;
        currentLoss = 0;
        streaks.longest_win = Math.max(streaks.longest_win, currentWin);
      } else {
        currentLoss++;
        currentWin = 0;
        streaks.longest_loss = Math.max(streaks.longest_loss, currentLoss);
      }
    });

    // Set current streak
    if (currentWin > 0) {
      streaks.currentStreak = { type: 'winning', length: currentWin };
    } else if (currentLoss > 0) {
      streaks.currentStreak = { type: 'losing', length: currentLoss };
    }

    return streaks;
  }

  analyzeTimeSlots(trades) {
    const slots = {
      opening: { name: '9:30-10:30', trades: [], wins: 0 },
      morning: { name: '10:30-12:00', trades: [], wins: 0 },
      midday: { name: '12:00-14:00', trades: [], wins: 0 },
      afternoon: { name: '14:00-15:30', trades: [], wins: 0 },
      closing: { name: '15:30-16:00', trades: [], wins: 0 }
    };

    trades.forEach(t => {
      const time = new Date(t.timestamp);
      const hour = time.getHours();
      const minute = time.getMinutes();
      const totalMinutes = hour * 60 + minute;
      
      let slot;
      if (totalMinutes >= 570 && totalMinutes < 630) slot = slots.opening;
      else if (totalMinutes >= 630 && totalMinutes < 720) slot = slots.morning;
      else if (totalMinutes >= 720 && totalMinutes < 840) slot = slots.midday;
      else if (totalMinutes >= 840 && totalMinutes < 930) slot = slots.afternoon;
      else if (totalMinutes >= 930 && totalMinutes < 960) slot = slots.closing;
      
      if (slot) {
        slot.trades.push(t);
        if ((t.pnl_at_exit || 0) > 0) slot.wins++;
      }
    });

    // Calculate win rates
    Object.values(slots).forEach(slot => {
      slot.winRate = slot.trades.length > 0 
        ? Math.round((slot.wins / slot.trades.length) * 100)
        : 0;
    });

    // Find best slot
    const bestSlot = Object.values(slots)
      .filter(s => s.trades.length >= 5)
      .sort((a, b) => b.winRate - a.winRate)[0];

    return { slots, bestSlot };
  }

  analyzeStrategies(trades) {
    const strategies = {};
    
    trades.forEach(t => {
      const strategy = t.strategy || 'unknown';
      if (!strategies[strategy]) {
        strategies[strategy] = {
          name: strategy,
          trades: [],
          wins: 0,
          losses: 0,
          totalPnL: 0
        };
      }
      
      strategies[strategy].trades.push(t);
      const pnl = t.pnl_at_exit || 0;
      strategies[strategy].totalPnL += pnl;
      
      if (pnl > 0) strategies[strategy].wins++;
      else if (pnl < 0) strategies[strategy].losses++;
    });

    // Calculate metrics
    Object.values(strategies).forEach(s => {
      s.winRate = s.trades.length > 0 
        ? (s.wins / s.trades.length) * 100 
        : 0;
      s.profitFactor = s.losses > 0 
        ? Math.abs(s.wins / s.losses) 
        : s.wins > 0 ? 999 : 0;
    });

    const best = Object.values(strategies)
      .filter(s => s.trades.length >= 10)
      .sort((a, b) => b.profitFactor - a.profitFactor)[0];

    return { strategies, best };
  }

  analyzeSymbolCharacteristics(trades) {
    const winners = trades.filter(t => (t.pnl_at_exit || 0) > 0);
    const losers = trades.filter(t => (t.pnl_at_exit || 0) < 0);
    
    // Analyze price ranges
    const winnerPrices = winners.map(t => t.price || 0).filter(p => p > 0);
    const loserPrices = losers.map(t => t.price || 0).filter(p => p > 0);
    
    const avgWinnerPrice = winnerPrices.length > 0 
      ? winnerPrices.reduce((a, b) => a + b, 0) / winnerPrices.length 
      : 0;
    const avgLoserPrice = loserPrices.length > 0 
      ? loserPrices.reduce((a, b) => a + b, 0) / loserPrices.length 
      : 0;

    if (avgWinnerPrice > 0 && avgLoserPrice > 0) {
      if (avgWinnerPrice < 5 && avgLoserPrice > 10) {
        return {
          pattern: 'Better performance with penny stocks',
          evidence: `Winners avg $${avgWinnerPrice.toFixed(2)} vs Losers avg $${avgLoserPrice.toFixed(2)}`,
          recommendation: 'Focus on stocks under $5 for better win rate'
        };
      } else if (avgWinnerPrice > 50 && avgLoserPrice < 20) {
        return {
          pattern: 'Better performance with quality stocks',
          evidence: `Winners avg $${avgWinnerPrice.toFixed(2)} vs Losers avg $${avgLoserPrice.toFixed(2)}`,
          recommendation: 'Focus on stocks above $50 for better results'
        };
      }
    }

    return {};
  }

  analyzeRiskManagement(trades) {
    const losses = trades
      .filter(t => (t.pnl_at_exit || 0) < 0)
      .map(t => Math.abs(t.pnl_at_exit || 0));
    
    const wins = trades
      .filter(t => (t.pnl_at_exit || 0) > 0)
      .map(t => t.pnl_at_exit || 0);

    if (losses.length > 0 && wins.length > 0) {
      const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
      const avgWin = wins.reduce((a, b) => a + b, 0) / wins.length;
      const ratio = avgWin / avgLoss;

      if (ratio < 1) {
        return {
          lesson: 'Losses are larger than wins',
          evidence: `Average win: $${avgWin.toFixed(2)}, Average loss: $${avgLoss.toFixed(2)}`,
          recommendation: 'Let winners run longer or cut losses quicker'
        };
      } else if (ratio > 2) {
        return {
          lesson: 'Excellent risk/reward ratio',
          evidence: `Wins are ${ratio.toFixed(1)}x larger than losses`,
          recommendation: 'Maintain current risk management approach'
        };
      }
    }

    return {};
  }

  calculatePerformanceMetrics(trades) {
    const wins = trades.filter(t => (t.pnl_at_exit || 0) > 0);
    const losses = trades.filter(t => (t.pnl_at_exit || 0) < 0);
    
    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      avgWin: wins.length > 0 
        ? wins.reduce((sum, t) => sum + (t.pnl_at_exit || 0), 0) / wins.length 
        : 0,
      avgLoss: losses.length > 0 
        ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl_at_exit || 0), 0) / losses.length)
        : 0
    };
  }

  calculateTradesPerDay(trades) {
    if (trades.length === 0) return 0;
    
    const days = new Set();
    trades.forEach(t => {
      days.add(new Date(t.timestamp).toDateString());
    });
    
    return trades.length / days.size;
  }

  calculateConcentration(trades) {
    const symbolCounts = {};
    trades.forEach(t => {
      symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
    });
    
    const sorted = Object.entries(symbolCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const top5 = sorted.slice(0, 5);
    const top5Count = top5.reduce((sum, [_, count]) => sum + count, 0);
    
    return {
      uniqueSymbols: Object.keys(symbolCounts).length,
      top5: top5.map(([symbol, count]) => ({ symbol, count })),
      top5Percent: trades.length > 0 ? top5Count / trades.length : 0
    };
  }

  getStrategyMix(trades) {
    const strategies = {};
    let total = 0;
    
    trades.forEach(t => {
      const strategy = t.strategy || 'unknown';
      strategies[strategy] = (strategies[strategy] || 0) + 1;
      total++;
    });
    
    return {
      momentum: (strategies.momentum || 0) / total,
      meanReversion: (strategies.mean_reversion || 0) / total,
      other: 1 - ((strategies.momentum || 0) + (strategies.mean_reversion || 0)) / total
    };
  }
}

module.exports = { LearningInsights };
