/**
 * Enhanced Brain Integrator - Uses ALL tools to their fullest potential
 * The master orchestrator that leverages every available system
 */

const { EventEmitter } = require('events');

class EnhancedBrainIntegrator extends EventEmitter {
  constructor(existingBrain, additionalComponents = {}) {
    super();
    
    // Keep existing brain functionality
    this.brain = existingBrain;
    
    // Enhanced component registry - ALL our tools
    this.tools = {
      // Core decision making
      brainIntegrator: existingBrain,
      
      // Market analysis
      technicalIndicators: additionalComponents.technicalIndicators,
      enhancedIntelligence: additionalComponents.enhancedIntelligence,
      newsNudge: additionalComponents.newsNudge,
      diamondsScorer: additionalComponents.diamondsScorer,
      scanner: additionalComponents.scanner,
      
      // Risk & portfolio management
      riskManager: additionalComponents.riskManager,
      positionSizer: additionalComponents.positionSizer,
      evCalculator: additionalComponents.evCalculator,
      capitalTracker: additionalComponents.capitalTracker,
      
      // Learning & optimization
      learningInsights: additionalComponents.learningInsights,
      enhancedRecorder: additionalComponents.enhancedRecorder,
      performanceRecorder: additionalComponents.performanceRecorder,
      
      // Execution & safety
      paperBroker: additionalComponents.paperBroker,
      circuitBreaker: additionalComponents.circuitBreaker,
      aiOrchestrator: additionalComponents.aiOrchestrator,
      
      // Strategy management
      strategyManager: additionalComponents.strategyManager,
      decisionCoordinator: additionalComponents.decisionCoordinator
    };
    
    // Decision enhancement layers
    this.layers = {
      dataCollection: ['scanner', 'newsNudge', 'diamondsScorer'],
      analysis: ['technicalIndicators', 'enhancedIntelligence', 'evCalculator'],
      risk: ['riskManager', 'positionSizer', 'capitalTracker'],
      learning: ['learningInsights', 'enhancedRecorder'],
      execution: ['paperBroker', 'circuitBreaker']
    };
    
    // Cache for complex calculations
    this.cache = new Map();
    this.cacheExpiry = 10000; // 10 seconds
  }
  
  /**
   * Enhanced decision making that uses ALL available tools
   */
  async makeEnhancedDecision(context) {
    const { symbol, action, currentPrice } = context;
    console.log(`[EnhancedBrain] Making decision for ${symbol} (${action})`);
    
    try {
      // 1. Collect all available data
      const marketData = await this.collectMarketData(symbol);
      
      // 2. Run multi-layer analysis
      const analysis = await this.runAnalysisLayers(symbol, marketData);
      
      // 3. Calculate risk-adjusted position
      const riskMetrics = await this.assessRisk(symbol, currentPrice, analysis);
      
      // 4. Learn from similar past trades
      const learningContext = await this.applyLearning(symbol, analysis);
      
      // 5. Combine all inputs for final decision
      const decision = await this.synthesizeDecision({
        symbol,
        action,
        marketData,
        analysis,
        riskMetrics,
        learningContext,
        originalContext: context
      });
      
      // 6. Validate decision through safety checks
      const validatedDecision = await this.validateDecision(decision);
      
      console.log(`[EnhancedBrain] Final decision for ${symbol}: ${validatedDecision.action} (confidence: ${(validatedDecision.confidence * 100).toFixed(1)}%)`);
      
      return validatedDecision;
      
    } catch (error) {
      console.error(`[EnhancedBrain] Error in decision process:`, error);
      return this.brain.makeDecision(context); // Fallback to original brain
    }
  }
  
  /**
   * Collect comprehensive market data using all scanners
   */
  async collectMarketData(symbol) {
    const data = {
      timestamp: new Date(),
      symbol
    };
    
    // Use scanner for market opportunities
    if (this.tools.scanner) {
      try {
        const scanResults = await this.tools.scanner.scanSymbol(symbol);
        data.scannerSignals = scanResults;
      } catch (e) {
        console.log(`[EnhancedBrain] Scanner unavailable for ${symbol}`);
      }
    }
    
    // Get news sentiment
    if (this.tools.newsNudge) {
      try {
        const newsScore = await this.tools.newsNudge.getScore(symbol);
        data.newsSentiment = newsScore;
      } catch (e) {
        data.newsSentiment = { score: 0.5, articles: 0 };
      }
    }
    
    // Check if it's a diamond (high-potential penny stock)
    if (this.tools.diamondsScorer) {
      try {
        const diamondScore = await this.tools.diamondsScorer.scoreSymbol(symbol);
        data.isDiamond = diamondScore > 0.7;
        data.diamondScore = diamondScore;
      } catch (e) {
        data.isDiamond = false;
      }
    }
    
    // Get current positions
    if (this.tools.paperBroker) {
      try {
        const positions = await this.tools.paperBroker.getPositions();
        const position = positions.find(p => p.symbol === symbol && p.qty > 0);
        data.hasPosition = !!position;
        data.position = position;
      } catch (e) {
        data.hasPosition = false;
      }
    }
    
    return data;
  }
  
  /**
   * Run multiple analysis layers in parallel
   */
  async runAnalysisLayers(symbol, marketData) {
    const analyses = {};
    
    // Technical analysis with enhanced intelligence
    if (this.tools.enhancedIntelligence) {
      try {
        // Get price history (mock for now, would connect to real data)
        const prices = await this.getPriceHistory(symbol);
        const volumes = await this.getVolumeHistory(symbol);
        const news = marketData.newsSentiment?.articles || [];
        
        const enhanced = await this.tools.enhancedIntelligence.enhancedScore(
          symbol,
          prices,
          volumes,
          news
        );
        
        analyses.technical = enhanced;
      } catch (e) {
        console.log(`[EnhancedBrain] Enhanced intelligence error:`, e.message);
      }
    }
    
    // Expected value calculation
    if (this.tools.evCalculator) {
      try {
        const ev = await this.tools.evCalculator.calculateExpectedValue({
          symbol,
          side: marketData.hasPosition ? 'sell' : 'buy',
          quantity: 100, // Placeholder
          price: marketData.currentPrice || 100,
          expectedMove: 0.1,
          confidence: 0.6
        });
        
        analyses.expectedValue = ev;
      } catch (e) {
        analyses.expectedValue = { ev: 0, profitable: false };
      }
    }
    
    // Get strategy signals
    if (this.tools.strategyManager) {
      try {
        const strategies = await this.tools.strategyManager.getAllStrategies();
        const signals = [];
        
        for (const strategy of strategies) {
          if (strategy.isActive && strategy.symbols?.includes(symbol)) {
            signals.push({
              name: strategy.name,
              signal: strategy.lastSignal,
              confidence: strategy.confidence || 0.5
            });
          }
        }
        
        analyses.strategySignals = signals;
      } catch (e) {
        analyses.strategySignals = [];
      }
    }
    
    return analyses;
  }
  
  /**
   * Comprehensive risk assessment
   */
  async assessRisk(symbol, currentPrice, analysis) {
    const risk = {
      canTrade: true,
      reasons: [],
      sizing: null
    };
    
    // Check risk limits
    if (this.tools.riskManager) {
      try {
        // Check overall risk status
        const riskStatus = await this.tools.riskManager.checkRiskLimits();
        if (!riskStatus.withinLimits) {
          risk.canTrade = false;
          risk.reasons = risk.reasons.concat(riskStatus.restrictions);
        }
        
        // Calculate optimal position size
        const confidence = analysis.technical?.confidence || 0.5;
        const sizing = await this.tools.riskManager.calculateOptimalSize(
          symbol,
          currentPrice,
          confidence
        );
        
        risk.sizing = sizing;
        
        if (sizing.shares === 0) {
          risk.canTrade = false;
          risk.reasons.push(sizing.reason);
        }
      } catch (e) {
        console.log(`[EnhancedBrain] Risk assessment error:`, e.message);
      }
    }
    
    // Check capital availability
    if (this.tools.capitalTracker) {
      try {
        const capital = await this.tools.capitalTracker.getAvailableCapital();
        if (capital < (risk.sizing?.positionValue || 0)) {
          risk.canTrade = false;
          risk.reasons.push('Insufficient capital');
        }
      } catch (e) {
        // Continue without capital check
      }
    }
    
    // Circuit breaker check
    if (this.tools.circuitBreaker) {
      try {
        const canExecute = this.tools.circuitBreaker.canExecute('trade');
        if (!canExecute.allowed) {
          risk.canTrade = false;
          risk.reasons.push(`Circuit breaker: ${canExecute.reason}`);
        }
      } catch (e) {
        // Continue without circuit breaker
      }
    }
    
    return risk;
  }
  
  /**
   * Apply learning from past trades
   */
  async applyLearning(symbol, analysis) {
    const learning = {
      adjustments: {},
      insights: []
    };
    
    if (this.tools.learningInsights) {
      try {
        // Get insights about this type of trade
        const insights = await this.tools.learningInsights.generateInsights();
        
        // Find relevant patterns
        const relevantPatterns = insights.patterns.filter(p => {
          // Morning trade pattern
          const hour = new Date().getHours();
          if (p.pattern === 'morning_bias' && hour >= 9 && hour < 11) {
            return true;
          }
          
          // Symbol concentration
          if (p.pattern === 'symbol_bias' && p.description.includes(symbol)) {
            return true;
          }
          
          return false;
        });
        
        learning.insights = relevantPatterns;
        
        // Apply confidence adjustments based on patterns
        relevantPatterns.forEach(pattern => {
          if (pattern.confidence > 0.7) {
            learning.adjustments[pattern.type] = pattern.confidence;
          }
        });
        
      } catch (e) {
        console.log(`[EnhancedBrain] Learning insights error:`, e.message);
      }
    }
    
    // Get performance-based adjustments
    if (this.tools.enhancedRecorder) {
      try {
        const strategyName = analysis.strategySignals?.[0]?.name || 'unknown';
        const baseConfidence = analysis.technical?.confidence || 0.5;
        
        const adjustedConfidence = this.tools.enhancedRecorder.getAdjustedConfidence(
          symbol,
          strategyName,
          baseConfidence
        );
        
        learning.adjustments.performance = adjustedConfidence / baseConfidence;
        
      } catch (e) {
        // Continue without performance adjustment
      }
    }
    
    return learning;
  }
  
  /**
   * Synthesize all inputs into final decision
   */
  async synthesizeDecision(inputs) {
    const {
      symbol,
      action,
      marketData,
      analysis,
      riskMetrics,
      learningContext
    } = inputs;
    
    // Start with base brain decision
    const baseDecision = await this.brain.makeDecision(inputs.originalContext);
    
    // Enhanced scoring with all factors
    let enhancedScore = baseDecision.score || 0.5;
    let confidence = baseDecision.confidence || 0.5;
    
    // Technical analysis contribution
    if (analysis.technical) {
      enhancedScore = enhancedScore * 0.4 + analysis.technical.score * 0.6;
      confidence = Math.max(confidence, analysis.technical.confidence);
    }
    
    // News sentiment impact
    if (marketData.newsSentiment) {
      const newsImpact = (marketData.newsSentiment.score - 0.5) * 0.2;
      enhancedScore += newsImpact;
    }
    
    // Diamond boost for penny stocks
    if (marketData.isDiamond) {
      enhancedScore *= 1.2; // 20% boost for diamonds
      confidence *= 1.1;
    }
    
    // Learning adjustments
    Object.values(learningContext.adjustments).forEach(adj => {
      confidence *= adj;
    });
    
    // Normalize scores
    enhancedScore = Math.max(0, Math.min(1, enhancedScore));
    confidence = Math.max(0, Math.min(1, confidence));
    
    // Determine action based on enhanced scoring
    let finalAction = baseDecision.action;
    
    if (!marketData.hasPosition && enhancedScore >= 0.42 && confidence >= 0.6) {
      finalAction = 'buy';
    } else if (marketData.hasPosition && enhancedScore <= 0.38) {
      finalAction = 'sell';
    } else if (riskMetrics.canTrade === false) {
      finalAction = 'reject';
    }
    
    return {
      symbol,
      action: finalAction,
      score: enhancedScore,
      confidence: confidence,
      reasoning: this.generateReasoning(inputs, finalAction),
      metadata: {
        baseScore: baseDecision.score,
        technicalScore: analysis.technical?.score,
        newsScore: marketData.newsSentiment?.score,
        isDiamond: marketData.isDiamond,
        riskOk: riskMetrics.canTrade,
        sizing: riskMetrics.sizing,
        learningInsights: learningContext.insights.length
      }
    };
  }
  
  /**
   * Final validation layer
   */
  async validateDecision(decision) {
    // Check with decision coordinator for conflicts
    if (this.tools.decisionCoordinator && decision.action === 'buy') {
      try {
        const conflicts = await this.tools.decisionCoordinator.checkConflicts(decision);
        if (conflicts.length > 0) {
          decision.action = 'reject';
          decision.reasoning += ` Rejected due to conflicts: ${conflicts.join(', ')}`;
        }
      } catch (e) {
        // Continue without conflict check
      }
    }
    
    // Record the decision
    if (this.tools.performanceRecorder) {
      try {
        await this.tools.performanceRecorder.recordDecision(decision);
      } catch (e) {
        console.log(`[EnhancedBrain] Failed to record decision:`, e.message);
      }
    }
    
    return decision;
  }
  
  /**
   * Generate human-readable reasoning
   */
  generateReasoning(inputs, action) {
    const reasons = [];
    
    // Base reasoning
    reasons.push(`Action: ${action}`);
    
    // Technical reasoning
    if (inputs.analysis.technical) {
      const tech = inputs.analysis.technical;
      if (tech.signals.rsi < 30) reasons.push('RSI oversold');
      if (tech.signals.rsi > 70) reasons.push('RSI overbought');
      if (tech.signals.macd === 'bullish') reasons.push('MACD bullish crossover');
      if (tech.signals.volumeAnomaly) reasons.push('Unusual volume detected');
    }
    
    // News reasoning
    if (inputs.marketData.newsSentiment?.score > 0.7) {
      reasons.push('Positive news sentiment');
    } else if (inputs.marketData.newsSentiment?.score < 0.3) {
      reasons.push('Negative news sentiment');
    }
    
    // Risk reasoning
    if (!inputs.riskMetrics.canTrade) {
      reasons.push(`Risk blocked: ${inputs.riskMetrics.reasons.join(', ')}`);
    } else if (inputs.riskMetrics.sizing) {
      reasons.push(`Position size: ${inputs.riskMetrics.sizing.shares} shares (${inputs.riskMetrics.sizing.percentOfEquity.toFixed(1)}% of equity)`);
    }
    
    // Learning insights
    if (inputs.learningContext.insights.length > 0) {
      inputs.learningContext.insights.forEach(insight => {
        reasons.push(`Pattern: ${insight.description}`);
      });
    }
    
    return reasons.join('. ');
  }
  
  /**
   * Helper methods to get market data
   */
  async getPriceHistory(symbol, days = 30) {
    // In production, this would fetch from your data provider
    // For now, return mock data
    const prices = [];
    let basePrice = 100;
    
    for (let i = 0; i < days; i++) {
      basePrice += (Math.random() - 0.5) * 2;
      prices.push(Math.max(1, basePrice));
    }
    
    return prices;
  }
  
  async getVolumeHistory(symbol, days = 30) {
    // Mock volume data
    const volumes = [];
    const baseVolume = 1000000;
    
    for (let i = 0; i < days; i++) {
      volumes.push(baseVolume * (0.5 + Math.random()));
    }
    
    return volumes;
  }
  
  /**
   * Get current status of all tools
   */
  getToolsStatus() {
    const status = {};
    
    Object.entries(this.tools).forEach(([name, tool]) => {
      status[name] = {
        available: !!tool,
        type: tool ? tool.constructor.name : 'Not connected'
      };
    });
    
    return status;
  }
}

module.exports = { EnhancedBrainIntegrator };
