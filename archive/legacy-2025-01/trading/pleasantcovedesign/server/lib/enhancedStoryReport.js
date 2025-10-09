'use strict';

/**
 * Enhanced Story Report Generator
 * Provides honest, actionable feedback for manual improvements
 * and tracks bot's self-improvement progress
 */

class EnhancedStoryReport {
  constructor(performanceRecorder, autoLoop, strategyManager, aiOrchestrator, brainIntegrator) {
    this.performanceRecorder = performanceRecorder;
    this.autoLoop = autoLoop;
    this.strategyManager = strategyManager;
    this.aiOrchestrator = aiOrchestrator;
    this.brainIntegrator = brainIntegrator;
  }

  async generateReport() {
    const today = new Date().toDateString();
    
    // Gather all data
    const trades = await this.getTodaysTrades();
    const decisions = await this.getTodaysDecisions();
    const rejections = await this.getRejectionReasons();
    const account = await this.getAccountStatus();
    const strategies = await this.getStrategyPerformance();
    const learningMetrics = await this.getLearningMetrics();
    
    // Calculate honest metrics
    const metrics = this.calculateHonestMetrics(trades, decisions, rejections, account);
    
    // Generate actionable feedback
    const feedback = this.generateActionableFeedback(metrics, rejections);
    
    return {
      title: "🤖 Trading Bot Daily Report - Honest Assessment",
      generated: new Date().toLocaleString(),
      quickNumbers: {
        grade: metrics.grade,
        bestDecision: metrics.bestDecision,
        worstDecision: metrics.worstDecision,
        luckFactor: metrics.luckFactor,
        smartFactor: metrics.smartFactor,
        honestPnL: metrics.pnl,
        honestPnLPercent: metrics.pnlPercent
      },
      sections: [
        this.generateMarketScanSection(decisions, rejections),
        this.generateTradingActivitySection(trades, account, metrics),
        this.generateWhyNoTradesSection(rejections, decisions),
        this.generateLearningProgressSection(learningMetrics, strategies),
        this.generateActionableInsightsSection(feedback),
        this.generateSystemHealthSection()
      ]
    };
  }

  async getTodaysTrades() {
    try {
      const response = await fetch('http://localhost:4000/api/trades');
      const data = await response.json();
      const trades = data.items || data || [];
      return trades.filter(t => new Date(t.ts_exec || t.timestamp).toDateString() === new Date().toDateString());
    } catch (error) {
      console.error('[StoryReport] Error getting trades:', error);
      return [];
    }
  }

  async getTodaysDecisions() {
    try {
      const response = await fetch('http://localhost:4000/api/decisions/recent?limit=1000');
      const decisions = await response.json();
      return decisions.filter(d => new Date(d.timestamp || d.ts).toDateString() === new Date().toDateString());
    } catch (error) {
      console.error('[StoryReport] Error getting decisions:', error);
      return [];
    }
  }

  async getRejectionReasons() {
    // Get from AutoLoop risk gate rejections
    const riskRejections = this.autoLoop?.getRiskRejections ? this.autoLoop.getRiskRejections(100) : [];
    
    // Get from brain scoring
    const brainActivity = await this.getBrainActivity();
    const lowScoreRejections = brainActivity.filter(a => a.final_score < 9.4);
    
    return {
      riskGate: riskRejections,
      lowScore: lowScoreRejections,
      noSignal: [] // Track when strategies found no signals
    };
  }

  async getAccountStatus() {
    try {
      const response = await fetch('http://localhost:4000/api/paper/account');
      const data = await response.json();
      return {
        cash: data.balances?.total_cash || 0,
        equity: data.balances?.total_equity || 100000,
        positions: data.balances?.market_value || 0
      };
    } catch (error) {
      return { cash: 100000, equity: 100000, positions: 0 };
    }
  }

  async getBrainActivity() {
    try {
      const response = await fetch('http://localhost:4000/api/brain/activity?limit=1000');
      const activity = await response.json();
      return activity.filter(a => new Date(a.ts).toDateString() === new Date().toDateString());
    } catch (error) {
      return [];
    }
  }

  calculateHonestMetrics(trades, decisions, rejections, account) {
    const startEquity = 100000; // Should track from open
    const currentEquity = account.equity;
    const pnl = currentEquity - startEquity;
    const pnlPercent = (pnl / startEquity) * 100;
    
    // Calculate grade based on actual performance
    let grade = 'F';
    if (trades.length === 0) {
      grade = 'D'; // No trades = not failing but not succeeding
    } else {
      const winRate = trades.filter(t => t.pnl > 0).length / trades.length;
      if (pnlPercent > 1) grade = 'A+';
      else if (pnlPercent > 0.5) grade = 'A';
      else if (pnlPercent > 0) grade = 'B';
      else if (pnlPercent > -0.5) grade = 'C';
      else grade = 'D';
      
      // Adjust for win rate
      if (winRate > 0.6 && grade !== 'F') {
        // Bump up one level for good win rate
        const grades = ['F', 'D', 'C', 'B', 'A', 'A+'];
        const currentIndex = grades.indexOf(grade);
        if (currentIndex < grades.length - 1) {
          grade = grades[currentIndex + 1];
        }
      }
    }
    
    // Calculate smart vs luck factor
    const smartDecisions = decisions.filter(d => d.confidence > 0.7 && d.brain_score > 9);
    const smartFactor = Math.min(10, Math.round((smartDecisions.length / Math.max(1, decisions.length)) * 10));
    
    // Luck is inverse of rejection rate
    const totalOpportunities = decisions.length + Object.values(rejections).flat().length;
    const executionRate = trades.length / Math.max(1, totalOpportunities);
    const luckFactor = Math.round((1 - executionRate) * 5); // Higher rejection = less lucky
    
    // Find best/worst
    const sortedTrades = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const bestDecision = sortedTrades[0] ? `${sortedTrades[0].symbol} +$${sortedTrades[0].pnl?.toFixed(2) || '0'}` : 'No trades executed';
    const worstDecision = sortedTrades[sortedTrades.length - 1] && sortedTrades[sortedTrades.length - 1].pnl < 0 
      ? `${sortedTrades[sortedTrades.length - 1].symbol} -$${Math.abs(sortedTrades[sortedTrades.length - 1].pnl).toFixed(2)}` 
      : 'No losing trades';
    
    return {
      grade,
      bestDecision,
      worstDecision,
      smartFactor,
      luckFactor,
      pnl,
      pnlPercent,
      winRate: trades.length > 0 ? trades.filter(t => t.pnl > 0).length / trades.length : 0
    };
  }

  generateMarketScanSection(decisions, rejections) {
    const totalScanned = this.autoLoop?.symbols?.length || 0;
    const totalEvaluated = decisions.length + Object.values(rejections).flat().length;
    
    // Get current thresholds
    const tradingThresholds = require('../config/tradingThresholds');
    const thresholds = tradingThresholds.getAdjustedThresholds();
    
    return {
      title: "🔍 Market Scanning Activity",
      story: `Today your bot scanned ${totalScanned} symbols and evaluated ${totalEvaluated} potential opportunities.

Current Trading Thresholds:
- Buy Signal: Score ≥ ${(thresholds.buyThreshold * 100).toFixed(0)}%
- Sell Signal: Score < ${(thresholds.sellThreshold * 100).toFixed(0)}%
- Min Confidence: ${(thresholds.minConfidence * 100).toFixed(0)}%

Brain Scoring Results:
- Buy signals (>${(thresholds.buyThreshold * 100).toFixed(0)}%): ${decisions.filter(d => (d.brain_score || d.score) > thresholds.buyThreshold).length}
- Hold zone (${(thresholds.sellThreshold * 100).toFixed(0)}-${(thresholds.buyThreshold * 100).toFixed(0)}%): ${decisions.filter(d => (d.brain_score || d.score) >= thresholds.sellThreshold && (d.brain_score || d.score) <= thresholds.buyThreshold).length}
- Sell signals (<${(thresholds.sellThreshold * 100).toFixed(0)}%): ${decisions.filter(d => (d.brain_score || d.score) < thresholds.sellThreshold).length}

The bot is being ${totalEvaluated === 0 ? 'extremely cautious' : 'selective'} about trade entries.`,
      whatThisMeans: `The brain scoring system evaluates each opportunity on a 0-100% scale. Current thresholds: BUY at ${(thresholds.buyThreshold * 100).toFixed(0)}%, SELL at ${(thresholds.sellThreshold * 100).toFixed(0)}%. These can be adjusted in config/tradingThresholds.js`
    };
  }

  generateTradingActivitySection(trades, account, metrics) {
    const story = trades.length === 0 
      ? `No trades were executed today. The bot maintained its discipline and didn't force any trades.

Account Status:
- Cash: $${account.cash.toFixed(2)}
- Positions: $${account.positions.toFixed(2)}
- Total Equity: $${account.equity.toFixed(2)}
- Day's P&L: $${metrics.pnl.toFixed(2)} (${metrics.pnlPercent.toFixed(2)}%)`
      : `Executed ${trades.length} trades today:
${trades.map(t => `- ${t.symbol}: ${t.side} ${t.qty} @ $${t.price} | P&L: $${(t.pnl || 0).toFixed(2)}`).join('\n')}

Account Performance:
- Starting Equity: $100,000
- Current Equity: $${account.equity.toFixed(2)}
- Day's P&L: $${metrics.pnl.toFixed(2)} (${metrics.pnlPercent.toFixed(2)}%)
- Win Rate: ${(metrics.winRate * 100).toFixed(1)}%`;

    return {
      title: "💰 Trading Activity & Performance",
      story: story,
      whatThisMeans: trades.length === 0 
        ? "No trades often means the bot is being cautious. This could be good (avoiding bad trades) or bad (missing opportunities). Check the rejection reasons below."
        : "Each trade is evaluated based on expected value calculations including costs. The bot aims for consistent small wins."
    };
  }

  generateWhyNoTradesSection(rejections, decisions) {
    const reasons = [];
    
    // Count rejection reasons
    const lowScoreCount = rejections.lowScore?.length || 0;
    const riskGateCount = rejections.riskGate?.length || 0;
    
    if (lowScoreCount > 0) {
      reasons.push(`- ${lowScoreCount} symbols had brain scores below 9.4 threshold`);
    }
    
    if (riskGateCount > 0) {
      const riskReasons = {};
      rejections.riskGate.forEach(r => {
        riskReasons[r.reason] = (riskReasons[r.reason] || 0) + 1;
      });
      Object.entries(riskReasons).forEach(([reason, count]) => {
        reasons.push(`- ${count} rejected by risk gate: ${reason}`);
      });
    }
    
    // Check for no signals
    const noSignalCount = decisions.filter(d => !d.side || d.side === null).length;
    if (noSignalCount > 0) {
      reasons.push(`- ${noSignalCount} symbols had no clear BUY/SELL signal`);
    }
    
    // Check for unprofitable EV
    const unprofitableCount = decisions.filter(d => d.analysis?.scores?.afterCostEV < 0).length;
    if (unprofitableCount > 0) {
      reasons.push(`- ${unprofitableCount} trades rejected due to negative expected value after costs`);
    }
    
    return {
      title: "🚫 Why No Trades Were Made",
      story: reasons.length > 0 
        ? `The bot evaluated opportunities but didn't trade because:\n\n${reasons.join('\n')}\n\nThis shows the bot is following its risk management rules.`
        : "All evaluated opportunities passed initial checks. The bot may need more aggressive settings or the market conditions aren't favorable.",
      whatThisMeans: "Understanding why trades are rejected helps tune the bot. Common issues: brain score thresholds too high, risk limits too tight, or market conditions not matching strategy requirements."
    };
  }

  generateLearningProgressSection(learningMetrics, strategies) {
    const activeStrategies = this.strategyManager?.getAllStrategies() || [];
    const evolvedCount = activeStrategies.filter(s => s.generation > 1).length;
    
    return {
      title: "🧬 Bot Learning & Evolution",
      story: `Self-Improvement Progress:
- Active Strategies: ${activeStrategies.length}
- Evolved Strategies: ${evolvedCount}
- Generations Tested: ${Math.max(...activeStrategies.map(s => s.generation || 1))}
- Win Rate Trend: ${learningMetrics.winRateTrend || 'Calculating...'}

The bot ${evolvedCount > 0 ? 'is actively evolving' : 'needs more data to start evolving'} its strategies.`,
      whatThisMeans: "The bot uses genetic algorithms to evolve strategies. Winners reproduce, losers are replaced. Each generation should perform better than the last."
    };
  }

  generateActionableInsightsSection(feedback) {
    return {
      title: "🎯 Actionable Insights for Improvement",
      story: feedback.join('\n\n'),
      whatThisMeans: "These are specific actions you can take to improve bot performance. The bot will also self-adjust based on results."
    };
  }

  generateActionableFeedback(metrics, rejections) {
    const feedback = [];
    
    // Get current thresholds
    const tradingThresholds = require('../config/tradingThresholds');
    const thresholds = tradingThresholds.getAdjustedThresholds();
    
    // No trades feedback
    if (metrics.grade === 'D' && rejections.lowScore?.length > 0) {
      feedback.push(`📉 **Brain Score Threshold**: Current BUY threshold is ${(thresholds.buyThreshold * 100).toFixed(0)}%. If many symbols score 50-${((thresholds.buyThreshold - 0.05) * 100).toFixed(0)}%, consider lowering the threshold in config/tradingThresholds.js`);
    }
    
    // Risk gate feedback
    if (rejections.riskGate?.some(r => r.reason.includes('CAPITAL'))) {
      feedback.push("💰 **Capital Limits Reached**: The bot hit capital limits. Consider increasing position limits or enabling more exits to free up capital.");
    }
    
    // Position management feedback
    const hasPositions = metrics.pnl !== 0;
    if (hasPositions && metrics.grade <= 'C') {
      feedback.push("⏱️ **Position Management**: Existing positions aren't being monitored for exits. Ensure brain integrator is running to score positions for exits.");
    }
    
    // Strategy feedback
    if (this.strategyManager?.getAllStrategies().filter(s => s.trades === 0).length > 0) {
      feedback.push("🎲 **Unused Strategies**: Some strategies have 0 trades. They may have incompatible parameters or the market conditions don't match their requirements.");
    }
    
    // Market conditions
    feedback.push("📊 **Market Conditions**: Check if the market regime (trending/ranging) matches your active strategies. Mean reversion works in ranging markets, momentum in trending.");
    
    // Positive feedback
    if (metrics.smartFactor >= 7) {
      feedback.push("✅ **Good Decision Quality**: High smart factor shows the bot is making well-reasoned decisions when it does trade.");
    }
    
    return feedback;
  }

  generateSystemHealthSection() {
    return {
      title: "🏥 System Health Check",
      story: `Component Status:
- AutoLoop: ${this.autoLoop?.isRunning ? '✅ Running' : '❌ Stopped'}
- Brain Integrator: ${this.brainIntegrator?.isRunning ? '✅ Monitoring positions' : '❌ Not monitoring'}
- AI Orchestrator: ${this.aiOrchestrator?.isActive ? '✅ Active' : '❌ Inactive'}
- Strategy Manager: ${this.strategyManager ? '✅ Loaded' : '❌ Not loaded'}

All systems should show ✅ for proper operation.`,
      whatThisMeans: "Each component has a specific role. AutoLoop finds opportunities, Brain scores them, AI Orchestrator manages strategies, Brain Integrator monitors positions for exits."
    };
  }

  async getLearningMetrics() {
    // Calculate win rate trend over time
    try {
      const allTrades = this.performanceRecorder?.trades || [];
      if (allTrades.length < 10) {
        return { winRateTrend: 'Need more trades for trend analysis' };
      }
      
      // Compare first half vs second half win rates
      const midPoint = Math.floor(allTrades.length / 2);
      const firstHalf = allTrades.slice(0, midPoint);
      const secondHalf = allTrades.slice(midPoint);
      
      const firstWinRate = firstHalf.filter(t => t.pnl > 0).length / firstHalf.length;
      const secondWinRate = secondHalf.filter(t => t.pnl > 0).length / secondHalf.length;
      
      const trend = secondWinRate > firstWinRate ? '📈 Improving' : secondWinRate < firstWinRate ? '📉 Declining' : '➡️ Stable';
      
      return {
        winRateTrend: `${trend} (${(firstWinRate * 100).toFixed(1)}% → ${(secondWinRate * 100).toFixed(1)}%)`
      };
    } catch (error) {
      return { winRateTrend: 'Error calculating trend' };
    }
  }

  async getStrategyPerformance() {
    const strategies = this.strategyManager?.getAllStrategies() || [];
    return strategies.map(s => ({
      id: s.id,
      trades: s.trades || 0,
      winRate: s.winRate || 0,
      pnl: s.totalPnL || 0
    }));
  }
}

module.exports = { EnhancedStoryReport };
