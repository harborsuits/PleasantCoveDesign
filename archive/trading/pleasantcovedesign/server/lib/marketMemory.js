
/**
 * Market Memory System
 * Remembers what works in different market conditions
 */

class MarketMemory {
  constructor() {
    this.memories = new Map(); // regime -> successful strategies
    this.regimeHistory = [];
    this.maxMemories = 1000;
  }
  
  recordSuccess(regime, strategy, outcome) {
    const key = `${regime.trend}_${regime.volatility}`;
    if (!this.memories.has(key)) {
      this.memories.set(key, []);
    }
    
    const memories = this.memories.get(key);
    memories.push({
      strategy,
      outcome,
      timestamp: new Date(),
      confidence: outcome.profitFactor || 1.0
    });
    
    // Keep only recent memories
    if (memories.length > 100) {
      memories.shift();
    }
  }
  
  getBestStrategiesForRegime(regime) {
    const key = `${regime.trend}_${regime.volatility}`;
    const memories = this.memories.get(key) || [];
    
    // Group by strategy and calculate average performance
    const strategyPerformance = {};
    memories.forEach(memory => {
      if (!strategyPerformance[memory.strategy]) {
        strategyPerformance[memory.strategy] = {
          count: 0,
          totalConfidence: 0
        };
      }
      strategyPerformance[memory.strategy].count++;
      strategyPerformance[memory.strategy].totalConfidence += memory.confidence;
    });
    
    // Sort by average confidence
    return Object.entries(strategyPerformance)
      .map(([strategy, stats]) => ({
        strategy,
        avgConfidence: stats.totalConfidence / stats.count,
        sampleSize: stats.count
      }))
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .slice(0, 5);
  }
}

module.exports = MarketMemory;
