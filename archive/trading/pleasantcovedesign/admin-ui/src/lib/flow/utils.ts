import type { IngestEvent, DecisionRow } from "@/contracts/types";

export const STAGES = [
  "INGEST",
  "CONTEXT",
  "CANDIDATES",
  "GATES",
  "PLAN",
  "ROUTE",
  "MANAGE",
  "LEARN",
] as const;
export type StageKey = typeof STAGES[number];

export function latestEventsByTrace(events: IngestEvent[]): Record<string, IngestEvent> {
  const map = new Map<string, IngestEvent>();
  for (const e of events || []) {
    const k = `${e.symbol}|${e.trace_id ?? ""}`;
    const prev = map.get(k);
    if (!prev || new Date(e.ts) > new Date(prev.ts)) map.set(k, e);
  }
  return Object.fromEntries(Array.from(map.entries()));
}

export function enrichDecisionsWithStage(
  decisions: DecisionRow[],
  events: IngestEvent[]
) {
  const latest = latestEventsByTrace(events);
  return decisions.map((d) => {
    const key = `${d.symbol}|${d.trace_id ?? ""}`;
    const ev = latest[key];
    const stageIndex = ev ? STAGES.indexOf(ev.stage as StageKey) : -1;
    const stage = ev?.stage as StageKey | undefined;
    const stageStatus = ev?.status ?? "pending";
    return { ...(d as any), stageIndex, stage, stageStatus } as any;
  });
}


