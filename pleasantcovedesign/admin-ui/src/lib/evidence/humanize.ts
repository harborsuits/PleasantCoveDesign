import type { EvidencePacket } from "@/contracts/evidence";
import type { DecisionRow } from "@/contracts/types";

export type Contrib = { key:string; display?:string; weight:number; rationale?:string };
export type RiskChip = { label:string; severity:"low"|"med"|"high" };

export function headline(p: EvidencePacket): string {
  const dir = p.prediction?.direction === "down" ? "short" : p.prediction?.direction === "volatile" ? "straddle" : "long";
  return `${p.symbol}: ${p.plan?.strategyLabel ?? "Plan"} → ${dir}, ${Math.round((p.confidence ?? 0)*100)}% conf`;
}

export function whyBullets(p: EvidencePacket): string[] {
  const base = p.whyTree ?? [];
  const extras = [
    p.crossConfirmations >= 2 ? "Multiple independent sources" : undefined,
    p.context?.regime ? `Regime ${p.context.regime}` : undefined,
  ].filter(Boolean) as string[];
  return [...base.slice(0,3), ...extras].slice(0,5);
}

export function contribs(p: EvidencePacket): Contrib[] {
  return (p.featureContribs ?? []).map((fc)=> ({ key: fc.key, weight: Number(fc.weight)||0, rationale: fc.rationale }));
}

export function risks(p: EvidencePacket): RiskChip[] {
  const out: RiskChip[] = [];
  if (typeof p.risk?.maxLossUsd === "number") {
    const sev = p.risk.maxLossUsd > 500 ? "high" : p.risk.maxLossUsd > 100 ? "med" : "low";
    out.push({ label: `Max loss $${p.risk.maxLossUsd}`, severity: sev });
  }
  if (typeof p.risk?.maxPortfolioHeatAfter === "number") {
    const heatPct = Math.round(p.risk.maxPortfolioHeatAfter*100);
    const sev = heatPct > 5 ? "high" : heatPct > 2 ? "med" : "low";
    out.push({ label: `Heat ${heatPct}%`, severity: sev });
  }
  return out;
}

export function dollars(amount?: number){ if(amount==null||isNaN(+amount)) return "—"; return `$${Math.round(+amount).toLocaleString()}`; }
export const pct = (x?: number)=> x==null? "—" : `${Math.round(x*100)/100}%`;
const clamp01 = (n:number)=> Math.max(0, Math.min(1, n));

export function confidenceLabel(p?: number){
  if(p==null) return "unknown";
  if(p<0.4) return "low";
  if(p<0.7) return "medium";
  return "high";
}

export function plainInstrument(label?: string){
  if(!label) return "a position";
  const L = label.toLowerCase();
  if(L.includes("debit") && L.includes("call")) return "a call spread (limited-risk bullish options bet)";
  if(L.includes("debit") && L.includes("put")) return "a put spread (limited-risk bearish options bet)";
  if(L.includes("call") && !L.includes("spread")) return "a call option (profits if price goes up)";
  if(L.includes("put") && !L.includes("spread")) return "a put option (profits if price goes down)";
  return label;
}

export function plainAction(decision?: DecisionRow){
  const a = (decision?.action||"BUY").toUpperCase();
  if(a==="BUY") return "bet on it going up";
  if(a==="SELL") return "bet on it going down";
  if(a==="HOLD") return "stay on the sidelines for now";
  return a.toLowerCase();
}

export function sizeInDollars({ equity, sizePct, maxLossUsd }:{ equity?: number; sizePct?: number; maxLossUsd?: number; }){
  const pos = equity && sizePct!=null ? Math.round(equity * (sizePct/100)) : undefined;
  const risk = maxLossUsd!=null ? Math.round(maxLossUsd) : undefined;
  const parts:string[] = [];
  if(pos!=null) parts.push(`about ${dollars(pos)} total`);
  if(risk!=null) parts.push(`with roughly ${dollars(risk)} at risk if the plan fails`);
  return parts.join(' ');
}

export function exitPlan(p: EvidencePacket){
  const stop = p.risk?.stopPlan ? p.risk.stopPlan : undefined;
  const invalid = p.prediction?.invalidation;
  if(stop && invalid) return `We’ll cut it if ${invalid} (stop rule: ${stop}).`;
  if(invalid) return `We’ll cut it if ${invalid}.`;
  if(stop) return `We’ll exit on ${stop}.`;
  return undefined;
}

export function makeNarrative({ symbol, packet, decision, accountEquity }:{ symbol:string; packet: EvidencePacket; decision?: DecisionRow; accountEquity?: number; }){
  const dir = packet.prediction?.direction ?? (decision?.action==='SELL'?'down':'up');
  const move = packet.prediction?.expectedMovePct ?? 5;
  const horizon = packet.prediction?.horizonHours ?? 48;
  const confPct = Math.round(clamp01(packet.confidence ?? ((decision?.score??60)/100))*100);
  const confWord = confidenceLabel((packet.confidence ?? ((decision?.score??60)/100)));

  const instr = plainInstrument(packet.plan?.strategyLabel || decision?.instrument || 'position');
  const sizing = sizeInDollars({ equity: accountEquity, sizePct: (decision?.size as any), maxLossUsd: packet.risk?.maxLossUsd });

  const lines:string[] = [];
  lines.push(`We’re ${plainAction(decision)} on ${symbol} with ${instr}.`);
  lines.push(`Why now: ${packet.tlDr || (packet.whyTree?.[0] ?? 'signal plus confirmation')}.`);
  lines.push(`What we expect: a ~${move}% move ${dir==='down'?'down':'up'} over ~${horizon} hours (confidence ${confWord} ~${confPct}%).`);
  if(sizing) lines.push(`How much: ${sizing}.`);
  const exit = exitPlan(packet); if(exit) lines.push(exit);
  return lines;
}

export function storyBullets(packet: EvidencePacket){
  const b:string[] = [];
  if(packet.tlDr) b.push(packet.tlDr);
  if(packet.whyTree?.length) b.push(...packet.whyTree.slice(0,3));
  return b;
}
