'use strict';

const { nanoid } = require('nanoid');
const { TokenBucketLimiter } = require('./rateLimiter');
const { CONFIG } = require('./config');
const { loadIdempotency, saveIdempotency } = require('./persistence');
const { preTradeGate } = require('./gate');
const { currentHealth } = require('./health');

const limiter = new TokenBucketLimiter(CONFIG.RATE_LIMIT_QPS, Math.ceil(CONFIG.RATE_LIMIT_QPS));

async function placeOrderAdapter({ request, idempotencyKey }) {
  // Check kill switch
  if (global.killSwitchEnabled) {
    const err = new Error('KILL_SWITCH_ENABLED');
    err.code = 'KILL_SWITCH_ENABLED';
    throw err;
  }

  // Defense-in-depth: enforce gate here too
  const h = currentHealth();
  const gate = preTradeGate({
    nav: 50_000,
    portfolio_heat: 0.05,
    strategy_heat: 0.03,
    dd_mult: Math.max(CONFIG.DD_MIN_MULT, 1 - CONFIG.DD_FLOOR),
    requested_qty: request.qty,
    quote_age_s: h.quote_age_s,
    broker_age_s: h.broker_age_s,
    stale: !h.ok,
  });
  if (gate.decision !== 'ACCEPT') {
    const err = new Error(gate.reason || 'REJECTED');
    err.code = gate.reason || 'REJECTED';
    throw err;
  }

  // Idempotency: if exists, return stored result
  const idemp = loadIdempotency();
  if (idempotencyKey && idemp[idempotencyKey]) {
    return idemp[idempotencyKey];
  }

  // Rate limit
  if (!limiter.tryRemoveToken()) {
    const e = new Error('RATE_LIMIT');
    e.code = 'RATE_LIMIT';
    throw e;
  }

  // Simulate broker call; retry/backoff on transient (simple loop)
  let attempt = 0;
  while (attempt < 3) {
    attempt += 1;
    try {
      // Success path: return real-like broker id
      const brokerOrderId = 'paper_' + nanoid();
      const result = {
        id: brokerOrderId,
        status: 'filled',
        avgPrice: request.price || 100,
        filledQty: gate.routed_qty,
      };
      if (idempotencyKey) {
        idemp[idempotencyKey] = result;
        saveIdempotency(idemp);
      }
      return result;
    } catch (err) {
      // Treat as transient for 429/5xx (simulated)
      await new Promise(r => setTimeout(r, 50 * attempt));
      if (attempt >= 3) throw err;
    }
  }
}

module.exports = { placeOrderAdapter };


