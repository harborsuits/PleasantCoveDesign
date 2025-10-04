import type { EvidencePacket, SourceDoc } from "@/contracts/evidence";
import type { DecisionRow, ContextRow } from "@/contracts/types";

// Minimal domain → bias/cred map (replace later with YAML/DB)
const REPUTATION: Record<string,{biasLean:"left"|"center"|"right"|"unknown"; credibility:1|2|3|4|5}> = {
  "reuters.com":   { biasLean:"center", credibility:5 },
  "wsj.com":       { biasLean:"right",  credibility:5 },
  "bloomberg.com": { biasLean:"center", credibility:5 },
};

export function buildEvidenceFromUi({
  decision,
  context,
  newsBySymbol,
}: {
  decision: DecisionRow | any; // Allow any to handle DecisionTrace objects
  context?: ContextRow;
  newsBySymbol?: Record<string, any[]>;
}): EvidencePacket {
  const toText = (v: any): string => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return v.description ?? v.text ?? v.message ?? JSON.stringify(v);
  };

  const id = decision.trace_id ?? decision.id ?? crypto.randomUUID();
  const createdAt = decision.createdAt ?? decision.as_of ?? new Date().toISOString();
  const symbol = decision.symbol;

  // Check if this is a full DecisionTrace with rich content
  const isDecisionTrace = decision.explain_layman !== undefined;

  // Use news evidence from DecisionTrace if available, otherwise fallback to newsBySymbol
  let sources: SourceDoc[] = [];
  if (isDecisionTrace && decision.news_evidence) {
    sources = decision.news_evidence.slice(0, 5).map((e: any, i: number) => ({
      id: `${id}-src-${i}`,
      url: e.url,
      title: e.headline,
      publisher: e.url ? new URL(e.url).hostname.replace('www.', '') : 'Unknown',
      publishedAt: createdAt,
      capturedAt: createdAt,
      biasLean: "unknown" as const,
      credibility: e.credibility === 'high' ? 5 : e.credibility === 'medium' ? 3 : 2,
      sentiment: e.sentiment === 'positive' ? 0.8 : e.sentiment === 'negative' ? -0.8 : 0,
      relevance: 0.7,
      keyClaims: [e.snippet],
    }));
  } else {
    const news = newsBySymbol?.[symbol] ?? [];
    sources = news.slice(0,5).map((n:any, i:number) => {
      const url = n.url ?? n.link ?? "";
      const host = (url.split("/")[2] ?? "").replace(/^www\./, "");
      const rep = REPUTATION[host] ?? { biasLean:"unknown", credibility:3 };
      return {
        id: `${id}-src-${i}`,
        url,
        title: toText(n.title ?? "(untitled)"),
        publisher: host || toText(n.publisher || ""),
        publishedAt: n.published_at ?? n.time ?? createdAt,
        capturedAt: createdAt,
        biasLean: rep.biasLean,
        credibility: rep.credibility,
        sentiment: n.sentiment ?? 0,
        relevance: n.relevance ?? 0.5,
        keyClaims: (n.key_points ?? n.highlights ?? []).map((k:any)=> toText(k)),
      };
    });
  }

  // Use rich content from DecisionTrace if available
  const confidence = isDecisionTrace
    ? (decision.candidate_score?.alpha ?? 0.7)
    : (decision.score ?? 70) / 100;

  const tlDr = isDecisionTrace
    ? decision.explain_layman
    : toText(decision.one_liner ?? decision.reason ?? "Signal + confirmation → structured long.");

  const interpretation = isDecisionTrace
    ? decision.explain_detail
    : [
        toText(decision.one_liner ?? decision.reason ?? ""),
        ...(decision.rr ? ["Risk/Reward " + decision.rr] : []),
      ].filter(Boolean);

  const planParams = isDecisionTrace ? {
    entry: decision.plan?.entry,
    exits: decision.plan?.exits,
    sizing: decision.plan?.sizing,
    expected_move: decision.plan?.expected_move,
  } : {
    entry: decision.entry, stop: decision.stop, target: decision.target,
    rr: decision.rr, size: decision.size,
    optionSymbol: decision.optionSymbol, qty: decision.qty,
  };

  return {
    id,
    createdAt,
    strategyId: decision.strategyId ?? "news-momo-v2",
    strategyName: decision.strategy ?? decision.plan?.strategyLabel ?? "News Momentum v2",
    symbol,
    context: {
      regime: isDecisionTrace
        ? decision.market_context?.regime?.label ?? "Unknown"
        : context?.regime ?? "Unknown",
      vix: isDecisionTrace
        ? decision.market_context?.volatility?.vix
        : context?.vix,
      marketBias: isDecisionTrace
        ? decision.market_context?.sentiment?.label ?? "neutral"
        : context?.bias ?? "neutral",
    },
    tlDr,
    confidence,
    sources,
    crossConfirmations: new Set(sources.map(s=>s.publisher)).size,
    interpretation,
    prediction: {
      thesis: tlDr,
      direction: decision.action?.includes('LONG') || decision.side === 'buy' ? "up" : "down",
      horizonHours: 48,
      expectedMovePct: 5,
      prob: confidence,
      bandsPct: { p10: -3, p50: 4, p90: 9 },
      invalidation: "Close below stop or news reversal",
    },
    plan: {
      strategyLabel: decision.strategy ?? decision.plan?.strategyLabel ?? "Cash Equity",
      params: planParams,
      alternatives: [],
    },
    risk: {
      maxLossUsd: decision.maxLoss ?? 0,
      maxPortfolioHeatAfter: 0.02,
      stopPlan: isDecisionTrace ? "Based on risk gates" : "ATR×1.2, time-box 2 days",
      rollOrHedgeRules: ["tighten if IV expands 20%+"],
      greeks: decision.greeks ?? undefined,
    },
    gates: isDecisionTrace && decision.risk_gate ? [
      {
        name: "position_limits" as any,
        passed: decision.risk_gate.position_limits_ok ?? true,
        details: decision.risk_gate.notes?.join(", ") ?? "",
      },
      {
        name: "portfolio_heat" as any,
        passed: decision.risk_gate.portfolio_heat_ok ?? true,
        details: "",
      },
      {
        name: "drawdown" as any,
        passed: decision.risk_gate.drawdown_ok ?? true,
        details: "",
      },
    ] : (decision.gates ?? []).map((g:any)=>({
      name: (g?.name ?? "unknown") as any,
      passed: Boolean(g?.passed),
      details: toText(g?.details ?? ""),
    }))?.length
      ? (decision.gates as any).map((g:any)=>({ name: (g?.name ?? "unknown") as any, passed: Boolean(g?.passed), details: toText(g?.details ?? "") }))
      : [ { name: "fresh_news" as any, passed: sources.length>0, details: `${sources.length} sources` } ],
    orders: [{
      venue: "paper",
      instrument: decision.instrument ?? decision.plan?.action ?? "equity",
      symbol: decision.optionSymbol ?? decision.symbol,
      quantity: decision.qty ?? decision.quantity ?? 1,
      timeInForce: "day",
      preTrade: { mid: decision.mid ?? 3.00, spreadPct: decision.spreadPct ?? 0.5, iv: decision.iv },
      idempotencyKey: `${id}-0`,
    }],
    execution: { status: decision.execution?.status ?? "pending" },
    monitoring: [],
  };
}


// Optional enrichment: add plain-English reasons, simple feature contributions and rule audit.
export function enrichWithWhy(packet: EvidencePacket, rawArticles?: Array<{ url:string; content?:string }>, decisionTrace?: any): EvidencePacket {
  // Enhanced feature contributions based on DecisionTrace if available
  let featureContribs = [
    { key: "Publisher credibility", value: packet.sources[0]?.credibility ?? 3, weight: ((packet.sources[0]?.credibility ?? 3) as number)/10, rationale: "Higher credibility increases trust" },
    { key: "Cross confirmations", value: packet.crossConfirmations, weight: Math.min(0.25, (packet.crossConfirmations||0)*0.05), rationale: "Multiple sources reduce error" },
  ];

  // Add DecisionTrace-specific features if available
  if (decisionTrace) {
    if (decisionTrace.signals?.length) {
      featureContribs.push({
        key: "Signal strength",
        value: decisionTrace.signals.length,
        weight: Math.min(0.3, decisionTrace.signals.length * 0.1),
        rationale: "More signals increase confidence"
      });
    }

    if (decisionTrace.market_context?.regime) {
      featureContribs.push({
        key: "Market regime alignment",
        value: decisionTrace.market_context.regime.confidence ?? 0.5,
        weight: (decisionTrace.market_context.regime.confidence ?? 0.5),
        rationale: "Market regime affects trade probability"
      });
    }

    if (decisionTrace.candidate_score?.rank_in_universe) {
      featureContribs.push({
        key: "Universe rank",
        value: decisionTrace.candidate_score.rank_in_universe,
        weight: Math.max(0, 1 - (decisionTrace.candidate_score.rank_in_universe / 100)),
        rationale: "Higher rank means stronger opportunity"
      });
    }
  }

  const whyTree: string[] = [
    packet.tlDr,
    packet.crossConfirmations>=2 ? "Multiple independent sources corroborate the claim" : undefined,
    decisionTrace?.market_context?.regime ? `Market regime: ${decisionTrace.market_context.regime.label} (${Math.round((decisionTrace.market_context.regime.confidence ?? 0)*100)}% confidence)` : undefined,
    decisionTrace?.risk_gate ? "Risk gates checked and passed" : undefined,
    decisionTrace?.candidate_score ? `Alpha score: ${Math.round((decisionTrace.candidate_score.alpha ?? 0)*100)}%` : undefined,
  ].filter(Boolean) as string[];

  return { ...packet, featureContribs, whyTree };
}


