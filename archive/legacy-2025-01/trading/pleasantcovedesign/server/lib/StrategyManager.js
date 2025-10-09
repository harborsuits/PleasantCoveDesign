const { EventEmitter } = require('events');
const { PaperBroker } = require('./PaperBroker');

class StrategyManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.paperBroker = options.paperBroker || new PaperBroker();
    this.strategies = new Map();
    this.activeStrategies = new Set();
    this.intervals = new Map();

    // Strategy configuration
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.maxConcurrentStrategies = options.maxConcurrentStrategies || 5;
  }

  // Register a strategy
  registerStrategy(name, strategy) {
    if (typeof strategy.run !== 'function') {
      throw new Error(`Strategy ${name} must have a run() method`);
    }

    this.strategies.set(name, {
      name,
      instance: strategy,
      status: 'stopped',
      lastRun: null,
      errorCount: 0,
      config: strategy.config || {}
    });

    console.log(`[StrategyManager] Registered strategy: ${name}`);
  }

  // Start a strategy
  startStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Strategy ${name} not found`);
    }

    if (strategy.status === 'running') {
      return;
    }

    if (this.activeStrategies.size >= this.maxConcurrentStrategies) {
      throw new Error(`Maximum concurrent strategies (${this.maxConcurrentStrategies}) reached`);
    }

    strategy.status = 'running';
    this.activeStrategies.add(name);

    // Start the strategy interval
    const interval = setInterval(() => {
      this.runStrategy(name);
    }, this.checkInterval);

    this.intervals.set(name, interval);

    console.log(`[StrategyManager] Started strategy: ${name}`);
    this.emit('strategyStarted', { name, strategy });
  }

  // Stop a strategy
  stopStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      return;
    }

    if (strategy.status === 'running') {
      const interval = this.intervals.get(name);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(name);
      }

      strategy.status = 'stopped';
      this.activeStrategies.delete(name);

      console.log(`[StrategyManager] Stopped strategy: ${name}`);
      this.emit('strategyStopped', { name, strategy });
    }
  }

  // Run a strategy
  async runStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy || strategy.status !== 'running') {
      return;
    }

    try {
      const result = await strategy.instance.run({
        paperBroker: this.paperBroker,
        strategyName: name,
        timestamp: new Date()
      });

      strategy.lastRun = new Date();
      strategy.errorCount = 0;

      if (result && result.signal) {
        this.emit('strategySignal', {
          strategy: name,
          signal: result.signal,
          data: result.data,
          timestamp: new Date()
        });

        // Execute the signal if it's an order
        if (result.signal === 'BUY' || result.signal === 'SELL') {
          this.executeSignal(name, result);
        }
      }

    } catch (error) {
      strategy.errorCount++;
      console.error(`[StrategyManager] Error in strategy ${name}:`, error.message);

      this.emit('strategyError', {
        strategy: name,
        error: error.message,
        timestamp: new Date()
      });

      // Stop strategy if it has too many errors
      if (strategy.errorCount >= 5) {
        console.error(`[StrategyManager] Stopping strategy ${name} due to repeated errors`);
        this.stopStrategy(name);
      }
    }
  }

  // Execute a trading signal
  async executeSignal(strategyName, result) {
    try {
      const { signal, data } = result;

      if (!data || !data.symbol || !data.qty) {
        return;
      }

      const orderData = {
        symbol: data.symbol,
        side: signal.toLowerCase(),
        qty: data.qty,
        type: data.type || 'market',
        price: data.price
      };

      // Check if we have sufficient position for sell orders
      if (signal === 'SELL') {
        const positions = this.paperBroker.getPositions();
        const position = positions.find(p => p.symbol === data.symbol);
        if (!position || position.qty < data.qty) {
          console.log(`[StrategyManager] Insufficient position for ${strategyName} sell signal: ${data.symbol}`);
          return;
        }
      }

      const order = await this.paperBroker.submitOrder(orderData);

      this.emit('orderExecuted', {
        strategy: strategyName,
        order,
        timestamp: new Date()
      });

      console.log(`[StrategyManager] ${strategyName} executed ${signal} order: ${data.symbol} x${data.qty}`);

    } catch (error) {
      console.error(`[StrategyManager] Error executing signal for ${strategyName}:`, error.message);
    }
  }

  // Get strategy status
  getStrategyStatus(name) {
    return this.strategies.get(name) || null;
  }

  // Get all strategies
  getAllStrategies() {
    return Array.from(this.strategies.values());
  }

  // Get active strategies
  getActiveStrategies() {
    return Array.from(this.activeStrategies).map(name => this.strategies.get(name));
  }

  // Stop all strategies
  stopAllStrategies() {
    for (const name of this.activeStrategies) {
      this.stopStrategy(name);
    }
  }

  // Cleanup
  cleanup() {
    this.stopAllStrategies();
    this.strategies.clear();
    this.activeStrategies.clear();
  }

  // Methods required by AI Orchestrator
  getStrategiesByStatus(status) {
    return Array.from(this.strategies.values())
      .filter(s => s.status === status)
      .map(s => ({
        id: s.name,
        status: s.status,
        performance: s.performance || {},
        lastRun: s.lastRun
      }));
  }

  manualPromotion(strategyId) {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy ${strategyId} not found`);
    }
    
    strategy.status = 'promoted';
    strategy.promotedAt = new Date();
    
    this.emit('strategyPromoted', {
      strategyId,
      timestamp: new Date()
    });
    
    console.log(`[StrategyManager] Promoted strategy: ${strategyId}`);
    return true;
  }

  updateStrategyPerformance(strategyId, performance) {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      strategy.performance = { ...strategy.performance, ...performance };
      strategy.lastUpdated = new Date();
    }
  }

  // Support for tournament/evolution
  cloneStrategy(originalId, newId, modifications = {}) {
    const original = this.strategies.get(originalId);
    if (!original) {
      throw new Error(`Original strategy ${originalId} not found`);
    }
    
    const clonedStrategy = {
      ...original.instance,
      config: { ...original.config, ...modifications }
    };
    
    this.registerStrategy(newId, clonedStrategy);
    return newId;
  }
}

module.exports = { StrategyManager };
