'use strict';

const { CONFIG } = require('./config');

/**
 * Creates a complete, plain-English trade plan based on a candidate and risk policy.
 * @param {object} candidate - The trade candidate from the scanner.
 * @param {object} policy - The risk policy settings.
 * @param {number} policy.max_risk_dollars - Max $ to risk per trade.
 * @param {number} policy.equity - Total portfolio equity.
 * @param {number} policy.risk_pct_equity - Max % of equity to risk.
 * @param {number} policy.atr_stop_mult - ATR multiplier for stop loss.
 * @param {number} policy.target_r_mult - Target profit in R-multiples.
 * @returns {object} A structured trade plan.
 */
function buildTradePlan(candidate, policy) {
  const { entry = candidate.last, atr = 0.5 } = candidate.plan || {};
  
  const risk_dollars = Math.min(
    policy.max_risk_dollars,
    policy.equity * policy.risk_pct_equity
  );

  const stop_price = candidate.side === 'buy'
    ? entry - policy.atr_stop_mult * atr
    : entry + policy.atr_stop_mult * atr;
    
  const target_price = candidate.side === 'buy'
    ? entry + (risk_dollars * policy.target_r_mult) / (risk_dollars / (entry - stop_price))
    : entry - (risk_dollars * policy.target_r_mult) / (risk_dollars / (stop_price - entry));

  const position_size = Math.floor(risk_dollars / Math.abs(entry - stop_price));

  const expected_cost_per_100 =
    (((candidate.explain?.feeBps || 5) + (candidate.explain?.slipBps || 4)) / 10000) * 100;

  const rationale_text = `Risk ${risk_dollars.toFixed(2)} (R). Stop ~${policy.atr_stop_mult}×ATR, target +${policy.target_r_mult}R. Time-box 2 days. Cash-only.`;

  return {
    risk_dollars: +risk_dollars.toFixed(2),
    stop_price: +stop_price.toFixed(2),
    target_price: +target_price.toFixed(2),
    position_size: position_size,
    expected_cost_per_100: +expected_cost_per_100.toFixed(2),
    timebox_days: 2,
    rationale_text,
  };
}

/**
 * Calculates the performance of a trade in R-units.
 * @param {number} pnl - The realized or unrealized profit and loss.
 * @param {number} risk_dollars - The initial amount risked on the trade.
 * @returns {number} The performance in R-units.
 */
function calculateResultInR(pnl, risk_dollars) {
  if (!risk_dollars || risk_dollars === 0) {
    return 0;
  }
  return pnl / risk_dollars;
}

module.exports = {
  buildTradePlan,
  calculateResultInR,
};
