'use strict';

const { CONFIG } = require('./config');

const state = {
  lastQuoteTs: Date.now(),
  lastBrokerTs: Date.now(),
  rollingErrorRate: 0,
  requestsInWindow: 0,
  errorsInWindow: 0,
  windowStart: Date.now(),
};

function noteRequest(ok) {
  const now = Date.now();
  if (now - state.windowStart > 60_000) {
    state.windowStart = now;
    state.requestsInWindow = 0;
    state.errorsInWindow = 0;
  }
  state.requestsInWindow += 1;
  if (!ok) state.errorsInWindow += 1;
  state.rollingErrorRate = state.requestsInWindow
    ? state.errorsInWindow / state.requestsInWindow
    : 0;
}

function setQuoteTouch() { state.lastQuoteTs = Date.now(); }
function setBrokerTouch() { state.lastBrokerTs = Date.now(); }

function currentHealth() {
  const now = Date.now();
  const quote_age_s = (now - state.lastQuoteTs) / 1000;
  const broker_age_s = (now - state.lastBrokerTs) / 1000;
  const slo_error_budget = state.rollingErrorRate;
  let breaker = 'GREEN';
  if (CONFIG.BREAKERS_ENABLED) {
    if (quote_age_s > CONFIG.QUOTE_STALE_SEC) breaker = 'RED';
    else if (broker_age_s > CONFIG.BROKER_STALE_SEC || slo_error_budget > CONFIG.SLO_ERROR_BUDGET) breaker = 'AMBER';
  }
  const ok = breaker !== 'RED';
  return { ok, quote_age_s, broker_age_s, slo_error_budget, breaker };
}

module.exports = { noteRequest, setQuoteTouch, setBrokerTouch, currentHealth };


