'use strict';

const { CONFIG } = require('./config');

function preTradeGate({
  nav,
  portfolio_heat,
  strategy_heat,
  dd_mult,
  requested_qty,
  price,
  available_cash,
  quote_age_s,
  broker_age_s,
  stale,
  caps = CONFIG,
}) {
  if (
    stale ||
    quote_age_s > caps.QUOTE_STALE_SEC ||
    broker_age_s > caps.BROKER_STALE_SEC
  ) {
    return { decision: 'REJECT', reason: 'STALE_DATA', routed_qty: 0 };
  }
  if (portfolio_heat >= caps.MAX_PORTFOLIO_HEAT) {
    return { decision: 'REJECT', reason: 'PORTFOLIO_HEAT', routed_qty: 0 };
  }
  if (strategy_heat >= caps.MAX_STRATEGY_HEAT) {
    return { decision: 'REJECT', reason: 'STRATEGY_HEAT', routed_qty: 0 };
  }
  const notional = Math.abs(requested_qty * price);
  if (notional > available_cash) {
    return {
      decision: 'REJECT',
      reason: 'INSUFFICIENT_CASH',
      routed_qty: 0,
    };
  }
  const routed = Math.max(0, Math.min(requested_qty * dd_mult, requested_qty));
  if (routed <= 0) {
    return { decision: 'REJECT', reason: 'SIZE_ZERO', routed_qty: 0 };
  }
  return { decision: 'ACCEPT', reason: null, routed_qty: routed };
}

module.exports = { preTradeGate };


