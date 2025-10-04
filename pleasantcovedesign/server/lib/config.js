'use strict';

const path = require('path');

try {
  // Load local .env if present
  require('dotenv').config();
  // Try to load parent-level .env.paper if present
  require('dotenv').config({ path: path.resolve(__dirname, '../.env.paper') });
} catch {
  // dotenv is optional; env vars can be provided by the environment
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  const s = String(value).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function toNum(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}

const CONFIG = {
  FALLBACKS_ENABLED: toBool(process.env.FALLBACKS_ENABLED, false),
  FAIL_CLOSE: toBool(process.env.FAIL_CLOSE, true),
  PER_TRADE_CAP: toNum(process.env.PER_TRADE_CAP, 0.02),
  MAX_PORTFOLIO_HEAT: toNum(process.env.MAX_PORTFOLIO_HEAT, 0.30),
  MAX_STRATEGY_HEAT: toNum(process.env.MAX_STRATEGY_HEAT, 0.12),
  DD_FLOOR: toNum(process.env.DD_FLOOR, 0.15),
  DD_MIN_MULT: toNum(process.env.DD_MIN_MULT, 0.40),
  QUOTE_STALE_SEC: toNum(process.env.QUOTE_STALE_SEC, 10),
  BROKER_STALE_SEC: toNum(process.env.BROKER_STALE_SEC, 60),
  RATE_LIMIT_QPS: toNum(process.env.RATE_LIMIT_QPS, 4),
  SLO_ERROR_BUDGET: toNum(process.env.SLO_ERROR_BUDGET, 0.25),
  BREAKERS_ENABLED: toBool(process.env.BREAKERS_ENABLED, false),
  ALLOW_OFFHOURS: toBool(process.env.ALLOW_OFFHOURS, false),
  ALLOW_UNSAFE_MIGRATIONS: toBool(process.env.ALLOW_UNSAFE_MIGRATIONS, false),
  PRICES_WS_ENABLED: toBool(process.env.PRICES_WS_ENABLED, true),
};

module.exports = { CONFIG, toBool, toNum };


