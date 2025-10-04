'use strict';

/**
 * Fitness Configuration for EvoTester Strategy Evaluation
 * Defines how strategies are scored and ranked in competitions
 */

const FITNESS_WEIGHTS = {
  // Sentiment weight (0.67 as requested)
  sentiment: 0.67,

  // PnL (Profit & Loss) weight
  pnl: 0.25,

  // Drawdown penalty weight (negative because higher drawdown = worse fitness)
  drawdown: -0.08,

  // Additional metrics that could be included
  sharpe_ratio: 0.05,
  win_rate: 0.03,
  max_drawdown: -0.02,

  // Volatility adjustment
  volatility_penalty: -0.01
};

/**
 * Calculate fitness score for a strategy
 * @param {Object} metrics - Strategy performance metrics
 * @param {number} metrics.sentiment_score - Sentiment analysis score (-1 to 1)
 * @param {number} metrics.total_return - Total return percentage
 * @param {number} metrics.max_drawdown - Maximum drawdown percentage (positive)
 * @param {number} metrics.sharpe_ratio - Sharpe ratio
 * @param {number} metrics.win_rate - Win rate (0-1)
 * @param {number} metrics.volatility - Strategy volatility
 * @returns {number} Fitness score
 */
function calculateFitness(metrics) {
  const {
    sentiment_score = 0,
    total_return = 0,
    max_drawdown = 0,
    sharpe_ratio = 0,
    win_rate = 0,
    volatility = 0
  } = metrics;

  // Normalize sentiment to 0-1 range (assuming input is -1 to 1)
  const normalizedSentiment = (sentiment_score + 1) / 2; // Convert -1..1 to 0..1

  // Normalize drawdown (higher drawdown = worse fitness)
  const normalizedDrawdown = Math.min(max_drawdown / 50, 1); // Cap at 50% drawdown

  // Normalize volatility penalty
  const normalizedVolatility = Math.min(volatility / 100, 1); // Cap at 100% volatility

  // Calculate fitness using weighted formula
  const fitness =
    FITNESS_WEIGHTS.sentiment * normalizedSentiment +
    FITNESS_WEIGHTS.pnl * (total_return / 100) + // Convert percentage to decimal
    FITNESS_WEIGHTS.drawdown * normalizedDrawdown + // Negative weight
    FITNESS_WEIGHTS.sharpe_ratio * sharpe_ratio +
    FITNESS_WEIGHTS.win_rate * win_rate +
    FITNESS_WEIGHTS.volatility_penalty * normalizedVolatility; // Negative weight

  // Ensure fitness is never negative (minimum 0)
  return Math.max(0, fitness);
}

/**
 * Get fitness configuration for transparency
 */
function getFitnessConfig() {
  return {
    weights: FITNESS_WEIGHTS,
    formula: 'fitness = 0.67 * sentiment + 0.25 * pnl - 0.08 * drawdown + 0.05 * sharpe + 0.03 * win_rate - 0.01 * volatility',
    normalization: {
      sentiment: '(-1 to 1) → (0 to 1)',
      pnl: 'percentage → decimal',
      drawdown: 'capped at 50%, higher = worse',
      volatility: 'capped at 100%, higher = worse'
    }
  };
}

/**
 * Test fitness calculation with deterministic inputs
 */
function testFitnessCalculation() {
  const testCases = [
    {
      name: 'Perfect Strategy',
      input: { sentiment_score: 1, total_return: 50, max_drawdown: 5, sharpe_ratio: 2.5, win_rate: 0.8, volatility: 10 },
      expected: 0.67 + 0.25 * 0.5 - 0.08 * 0.1 + 0.05 * 2.5 + 0.03 * 0.8 - 0.01 * 0.1
    },
    {
      name: 'Poor Strategy',
      input: { sentiment_score: -1, total_return: -20, max_drawdown: 40, sharpe_ratio: 0.2, win_rate: 0.4, volatility: 50 },
      expected: 0.67 * 0 + 0.25 * (-0.2) - 0.08 * 0.8 + 0.05 * 0.2 + 0.03 * 0.4 - 0.01 * 0.5
    }
  ];

  console.log('🧪 Fitness Calculation Tests:');
  testCases.forEach(testCase => {
    const actual = calculateFitness(testCase.input);
    const expected = testCase.expected;
    const diff = Math.abs(actual - expected);

    console.log(`${testCase.name}:`);
    console.log(`  Input: ${JSON.stringify(testCase.input)}`);
    console.log(`  Expected: ${expected.toFixed(4)}`);
    console.log(`  Actual: ${actual.toFixed(4)}`);
    console.log(`  Difference: ${diff.toFixed(6)} ${diff < 0.0001 ? '✅' : '❌'}`);
    console.log('');
  });
}

module.exports = {
  calculateFitness,
  getFitnessConfig,
  testFitnessCalculation,
  FITNESS_WEIGHTS
};
