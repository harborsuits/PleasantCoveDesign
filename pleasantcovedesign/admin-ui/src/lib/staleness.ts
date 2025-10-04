export type Staleness = 'active' | 'degraded' | 'stale';

export function computeStaleness(
  asOfISO?: string | number | Date,
  now: number = Date.now(),
  warnAfterMs: number = 60_000, // Increased to 60 seconds for warning
  staleAfterMs: number = 300_000 // Increased to 5 minutes for stale
): Staleness {
  if (!asOfISO) return 'stale';
  const t =
    typeof asOfISO === 'string'
      ? Date.parse(asOfISO)
      : asOfISO instanceof Date
      ? asOfISO.getTime()
      : asOfISO;
  if (!Number.isFinite(t)) return 'stale';
  const age = now - t;
  if (age < warnAfterMs) return 'active';
  if (age < staleAfterMs) return 'degraded';
  return 'stale';
}

export function formatAsOf(asOfISO?: string | number | Date): string {
  if (!asOfISO) return '—';
  const d =
    typeof asOfISO === 'string'
      ? new Date(asOfISO)
      : asOfISO instanceof Date
      ? asOfISO
      : new Date(asOfISO);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}


