/**
 * Enhanced Intelligence Module
 * Integrates open source ML and analysis tools
 */

// Technical Indicators
const TI = require('technicalindicators');

// Sentiment Analysis
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

class EnhancedIntelligence {
  constructor(brainIntegrator, performanceRecorder) {
    this.brain = brainIntegrator;
    this.recorder = performanceRecorder;
    this.indicators = {};
    this.sentimentCache = new Map();
  }

  /**
   * Enhanced scoring with technical indicators
   */
  async enhancedScore(symbol, prices, volume, news = []) {
    // Get base score from existing brain
    const baseScore = await this.brain.scoreCandidate(symbol, { hasPosition: false });
    
    // Calculate technical indicators
    const technical = await this.calculateTechnicals(prices, volume);
    
    // Analyze news sentiment
    const sentimentScore = await this.analyzeSentiment(news);
    
    // Combine scores with weights
    const weights = {
      base: 0.4,
      technical: 0.4,
      sentiment: 0.2
    };
    
    const enhancedScore = (
      (baseScore?.score || 0.5) * weights.base +
      technical.score * weights.technical +
      sentimentScore * weights.sentiment
    );
    
    return {
      score: enhancedScore,
      confidence: this.calculateConfidence(technical, sentimentScore),
      signals: {
        rsi: technical.rsi,
        macd: technical.macdSignal,
        sentiment: sentimentScore,
        volumeAnomaly: technical.volumeAnomaly
      }
    };
  }

  /**
   * Calculate technical indicators
   */
  async calculateTechnicals(prices, volumes) {
    if (prices.length < 30) {
      return { score: 0.5, confidence: 0.3 };
    }
    
    // RSI - Oversold/Overbought
    const rsi = TI.RSI.calculate({
      period: 14,
      values: prices
    });
    const currentRSI = rsi[rsi.length - 1];
    
    // MACD - Momentum
    const macd = TI.MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: prices,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    const currentMACD = macd[macd.length - 1];
    
    // Bollinger Bands - Volatility
    const bb = TI.BollingerBands.calculate({
      period: 20,
      values: prices,
      stdDev: 2
    });
    const currentBB = bb[bb.length - 1];
    const currentPrice = prices[prices.length - 1];
    
    // Volume Analysis
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;
    
    // Score calculation
    let score = 0.5;
    let signals = 0;
    
    // RSI signals
    if (currentRSI < 30) {
      score += 0.15; // Oversold
      signals++;
    } else if (currentRSI > 70) {
      score -= 0.15; // Overbought
      signals--;
    }
    
    // MACD signals
    if (currentMACD && currentMACD.MACD > currentMACD.signal) {
      score += 0.1; // Bullish crossover
      signals++;
    } else if (currentMACD && currentMACD.MACD < currentMACD.signal) {
      score -= 0.1; // Bearish crossover
      signals--;
    }
    
    // Bollinger Band signals
    if (currentBB && currentPrice < currentBB.lower) {
      score += 0.1; // Below lower band
      signals++;
    } else if (currentBB && currentPrice > currentBB.upper) {
      score -= 0.1; // Above upper band
      signals--;
    }
    
    // Volume confirmation
    if (volumeRatio > 1.5 && signals > 0) {
      score += 0.05; // Volume confirms bullish signal
    }
    
    return {
      score: Math.max(0, Math.min(1, score)),
      rsi: currentRSI,
      macdSignal: currentMACD ? (currentMACD.MACD > currentMACD.signal ? 'bullish' : 'bearish') : 'neutral',
      bbPosition: currentBB ? 
        (currentPrice < currentBB.lower ? 'below' : 
         currentPrice > currentBB.upper ? 'above' : 'within') : 'unknown',
      volumeAnomaly: volumeRatio > 2
    };
  }

  /**
   * Analyze news sentiment
   */
  async analyzeSentiment(newsItems) {
    if (!newsItems || newsItems.length === 0) {
      return 0.5; // Neutral
    }
    
    let totalScore = 0;
    let weightSum = 0;
    
    for (const news of newsItems) {
      // Check cache first
      const cacheKey = news.title + news.summary;
      if (this.sentimentCache.has(cacheKey)) {
        const cached = this.sentimentCache.get(cacheKey);
        totalScore += cached.score * cached.weight;
        weightSum += cached.weight;
        continue;
      }
      
      // Analyze sentiment
      const titleSentiment = sentiment.analyze(news.title || '');
      const summarySentiment = sentiment.analyze(news.summary || '');
      
      // Financial-specific keywords
      const positiveKeywords = ['beat', 'exceed', 'upgrade', 'breakthrough', 'surge', 'rally'];
      const negativeKeywords = ['miss', 'downgrade', 'lawsuit', 'investigation', 'plunge', 'crash'];
      
      let keywordBoost = 0;
      const text = (news.title + ' ' + news.summary).toLowerCase();
      
      positiveKeywords.forEach(word => {
        if (text.includes(word)) keywordBoost += 0.1;
      });
      
      negativeKeywords.forEach(word => {
        if (text.includes(word)) keywordBoost -= 0.1;
      });
      
      // Combine scores
      const combinedScore = (
        titleSentiment.comparative * 0.6 + 
        summarySentiment.comparative * 0.4 +
        keywordBoost
      );
      
      // Normalize to 0-1
      const normalizedScore = (combinedScore + 5) / 10; // Assuming -5 to 5 range
      const boundedScore = Math.max(0, Math.min(1, normalizedScore));
      
      // Weight by recency
      const hoursAgo = (Date.now() - new Date(news.published_at || news.timestamp).getTime()) / (1000 * 60 * 60);
      const recencyWeight = Math.exp(-hoursAgo / 24); // Exponential decay over 24 hours
      
      // Cache result
      this.sentimentCache.set(cacheKey, {
        score: boundedScore,
        weight: recencyWeight
      });
      
      totalScore += boundedScore * recencyWeight;
      weightSum += recencyWeight;
    }
    
    // Clean cache periodically
    if (this.sentimentCache.size > 1000) {
      const oldestAllowed = Date.now() - 24 * 60 * 60 * 1000;
      for (const [key, value] of this.sentimentCache) {
        if (value.timestamp < oldestAllowed) {
          this.sentimentCache.delete(key);
        }
      }
    }
    
    return weightSum > 0 ? totalScore / weightSum : 0.5;
  }

  /**
   * Calculate confidence based on signal alignment
   */
  calculateConfidence(technical, sentimentScore) {
    const signals = [];
    
    // Technical signals
    if (technical.rsi < 30 || technical.rsi > 70) signals.push(1);
    if (technical.macdSignal !== 'neutral') signals.push(1);
    if (technical.bbPosition !== 'within') signals.push(1);
    if (technical.volumeAnomaly) signals.push(1);
    
    // Sentiment signal
    if (Math.abs(sentimentScore - 0.5) > 0.2) signals.push(1);
    
    // More aligned signals = higher confidence
    const confidence = 0.5 + (signals.length * 0.1);
    return Math.min(0.95, confidence);
  }

  /**
   * Risk-adjusted position sizing using Kelly Criterion
   */
  calculateOptimalPosition(winRate, avgWin, avgLoss, accountBalance) {
    if (avgLoss === 0) return 0;
    
    const b = avgWin / avgLoss;
    const p = winRate;
    const q = 1 - p;
    
    // Kelly formula: f = (p*b - q) / b
    const kelly = (p * b - q) / b;
    
    // Conservative Kelly (25% of full Kelly)
    const conservativeKelly = kelly * 0.25;
    
    // Cap at 5% of account
    const maxPosition = 0.05;
    
    const optimalFraction = Math.max(0, Math.min(maxPosition, conservativeKelly));
    return Math.floor(accountBalance * optimalFraction);
  }

  /**
   * Pattern recognition
   */
  async detectPatterns(prices) {
    const patterns = [];
    
    // Double bottom
    const doubleBottom = TI.predictPattern({ values: prices });
    if (doubleBottom.patternname === 'DoubleBottom') {
      patterns.push({
        name: 'Double Bottom',
        bullish: true,
        confidence: 0.7
      });
    }
    
    // Head and Shoulders
    if (this.detectHeadAndShoulders(prices)) {
      patterns.push({
        name: 'Head and Shoulders',
        bullish: false,
        confidence: 0.8
      });
    }
    
    return patterns;
  }

  detectHeadAndShoulders(prices) {
    // Simplified H&S detection
    if (prices.length < 50) return false;
    
    // Find peaks and valleys
    const peaks = [];
    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
        peaks.push({ index: i, price: prices[i] });
      }
    }
    
    // Look for pattern: peak, higher peak, lower peak
    if (peaks.length >= 3) {
      const recent = peaks.slice(-3);
      if (recent[1].price > recent[0].price && 
          recent[1].price > recent[2].price &&
          Math.abs(recent[0].price - recent[2].price) / recent[0].price < 0.03) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = { EnhancedIntelligence };
