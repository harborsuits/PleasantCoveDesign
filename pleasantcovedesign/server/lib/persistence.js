'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const POSITIONS_FILE = path.join(DATA_DIR, 'positions.json');
const IDEMPOTENCY_FILE = path.join(DATA_DIR, 'idempotency.json');
const TRACES_FILE = path.join(DATA_DIR, 'traces.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(file, obj) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

function loadOrders() { return readJSON(ORDERS_FILE, []); }
function saveOrders(arr) { writeJSON(ORDERS_FILE, arr); }
function loadPositions() { return readJSON(POSITIONS_FILE, []); }
function savePositions(arr) { writeJSON(POSITIONS_FILE, arr); }
function loadIdempotency() { return readJSON(IDEMPOTENCY_FILE, {}); }
function saveIdempotency(map) { writeJSON(IDEMPOTENCY_FILE, map); }
function loadTraces() { return readJSON(TRACES_FILE, {}); }
function saveTraces(map) { writeJSON(TRACES_FILE, map); }

module.exports = {
  loadOrders, saveOrders, loadPositions, savePositions,
  loadIdempotency, saveIdempotency, loadTraces, saveTraces,
  DATA_DIR
};


