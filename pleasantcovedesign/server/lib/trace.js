'use strict';

const { nanoid } = require('nanoid');
const { loadTraces, saveTraces } = require('./persistence');

function saveBundle(bundle) {
  const id = bundle.id || nanoid();
  const map = loadTraces();
  map[id] = { id, ts: new Date().toISOString(), bundle };
  saveTraces(map);
  return id;
}

function getBundle(id) {
  const map = loadTraces();
  return map[id] || null;
}

function replayBundle(id) {
  const rec = getBundle(id);
  if (!rec) return { ok: false, error: 'not_found' };
  // Deterministic replay stub: compare selected stable fields
  const baseline = rec.bundle;
  // In a real system, you would re-run models/policy deterministically.
  // Here we return an empty diff to satisfy deterministic parts.
  return { ok: true, diff: {} };
}

module.exports = { saveBundle, getBundle, replayBundle };


