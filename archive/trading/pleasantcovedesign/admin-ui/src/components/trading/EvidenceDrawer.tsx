import { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { usePortfolioAllocations } from "@/hooks/usePortfolioAllocations";
import { makeNarrative, confidenceLabel } from "@/lib/evidence/humanize";
import { Badge } from "@/components/ui/Badge";
import type { EvidencePacket } from "@/contracts/evidence";

type Props = { open: boolean; onOpenChange: (v: boolean) => void; data: EvidencePacket | null };

export default function EvidenceDrawer({ open, onOpenChange, data }: Props) {
  const { data: alloc } = usePortfolioAllocations();
  const equity = alloc?.data?.equity;
  const narrativeLines = data ? makeNarrative({ symbol: data.symbol, packet: data, accountEquity: equity }) : [];
  if (!open || !data) return null;

  const gateChip = (g: boolean) => g ? "bg-green-600 text-white" : "bg-red-600 text-white";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="absolute right-0 top-0 h-full w-[720px] max-w-full bg-background border-l p-4 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xl font-semibold">
              <span>{data.symbol}</span>
              <Badge>{data.strategyName}</Badge>
              <Badge variant="secondary">{Math.round(data.confidence * 100)}% conf</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{data.tlDr}</p>
            <div className="flex flex-wrap gap-1 pt-2">
              {data.gates.map((g) => (
                <span key={g.name} className={`px-2 py-0.5 rounded text-xs ${gateChip(g.passed)}`}>
                  {g.name.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </div>
          <button className="text-sm underline" onClick={() => onOpenChange(false)}>Close</button>
        </div>

        <Tabs defaultValue="summary" className="mt-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="why">Why</TabsTrigger>
            <TabsTrigger value="prediction">Prediction</TabsTrigger>
            <TabsTrigger value="plan">Plan & Risk</TabsTrigger>
          </TabsList>
          <TabsContent value="story" className="space-y-4">
            <div className="rounded-2xl border p-3 bg-slate-900/40">
              <div className="text-sm leading-relaxed space-y-1">
                {narrativeLines.map((t,i)=>(<p key={i}>{t}</p>))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-2">
            <ul className="list-disc pl-5">{data.interpretation.map((b, i) => (<li key={i}>{typeof b === "string" ? b : JSON.stringify(b)}</li>))}</ul>
            <div className="text-xs text-muted-foreground">
              Regime {data.context.regime} • VIX {data.context.vix ?? "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Confidence {confidenceLabel(data.confidence)} (~{Math.round((data.confidence??0)*100)}%) • Cross-confirmations {data.crossConfirmations}
            </div>
            <div className="mt-2">
              <div className="text-xs font-medium mb-1">Gates</div>
              <ul className="text-xs space-y-1">
                {data.gates.map((g)=> (
                  <li key={g.name} className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded ${g.passed? 'bg-green-700/40':'bg-red-700/50'}`}>{g.passed? 'ok':'blocked'}</span>
                    <span className="uppercase tracking-wide text-[10px] text-muted-foreground">{g.name.replaceAll('_',' ')}</span>
                    {g.details && <span className="text-[11px]">• {g.details}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="sources" className="space-y-2">
            {data.sources.map((s) => (
              <div key={s.id} className="border rounded-xl p-3">
                <div className="flex justify-between gap-2">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    {typeof s.title === "string" ? s.title : JSON.stringify(s.title)}
                  </a>
                  <div className="flex gap-2">
                    <Badge variant="outline">{s.publisher}</Badge>
                    <Badge variant="secondary">{s.biasLean}</Badge>
                    <Badge>{s.credibility}/5</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  pub {new Date(s.publishedAt).toLocaleString()} • captured {new Date(s.capturedAt).toLocaleString()}
                </div>
                <div className="flex gap-2 mt-1 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800">sent {Math.round((s.sentiment ?? 0)*100)/100}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800">rel {Math.round((s.relevance ?? 0)*100)/100}</span>
                </div>
                {s.keyClaims?.length > 0 && (
                  <ul className="list-disc pl-5 mt-1 text-sm">{s.keyClaims.map((k, i) => (<li key={i}>{typeof k === "string" ? k : JSON.stringify(k)}</li>))}</ul>
                )}
                {s.passages?.length ? (
                  <div className="mt-2 space-y-1">
                    {s.passages.map((p)=> (
                      <div key={p.id} className="text-sm bg-slate-800/60 border border-slate-700/50 rounded p-2">
                        <span className="mr-2 text-[10px] uppercase tracking-wide text-slate-400">Evidence</span>
                        <span>{p.text}</span>
                        {p.labels?.length>0 && (
                          <div className="mt-1 flex flex-wrap gap-1">{p.labels.map((l)=> <span key={l} className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">{l}</span>)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ): null}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="why" className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Why this decision</div>
              <ul className="list-disc pl-5">{data.whyTree?.map((w,i)=>(<li key={i}>{w}</li>))}</ul>
            </div>

            {data.featureContribs?.length ? (
              <div>
                <div className="text-sm font-medium mb-1">Feature contributions</div>
                <div className="space-y-1">
                  {data.featureContribs.map(fc=> (
                    <div key={fc.key} className="text-xs">
                      <div className="flex justify-between"><span className="font-medium">{fc.key}</span><span>{typeof fc.value==="number"?fc.value.toFixed(2):String(fc.value)}</span></div>
                      <div className="h-1.5 bg-slate-800 rounded"><div className="h-1.5 bg-blue-600 rounded" style={{width: `${Math.max(0, Math.min(1, Number(fc.weight)||0))*100}%`}}/></div>
                      {fc.rationale && <div className="text-[11px] text-slate-400 mt-0.5">{fc.rationale}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ):null}
          </TabsContent>

          <TabsContent value="prediction" className="space-y-1 text-sm">
            <div>{data.prediction.thesis}</div>
            <div>Expected move {data.prediction.expectedMovePct}% • Horizon {data.prediction.horizonHours}h</div>
            <div>Prob {Math.round(data.prediction.prob * 100)}% ({confidenceLabel(data.prediction.prob)}) • p10/p50/p90 {data.prediction.bandsPct.p10}/{data.prediction.bandsPct.p50}/{data.prediction.bandsPct.p90}%</div>
            <div className="text-muted-foreground">Invalidation: {data.prediction.invalidation}</div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-2 text-sm">
            <div className="font-medium">{data.plan.strategyLabel}</div>
            <pre className="bg-muted/40 rounded p-2 overflow-x-auto text-xs">{JSON.stringify(data.plan.params, null, 2)}</pre>
            <div className="font-medium">Orders</div>
            {data.orders.map((o, i) => (
              <div key={i} className="flex flex-wrap gap-2 text-xs">
                <Badge>{o.venue}</Badge>
                <span>{o.instrument}</span>
                <span>{o.symbol}</span>
                <span>qty {o.quantity}</span>
                {o.limit && <span>limit {o.limit}</span>}
                <span>spr {Math.round(o.preTrade.spreadPct * 100) / 100}%</span>
              </div>
            ))}
            <div className="font-medium">Risk</div>
            <div>Max loss ${data.risk.maxLossUsd} • Heat after {Math.round(data.risk.maxPortfolioHeatAfter * 100)}%</div>
            {data.risk.stopPlan && (
              <div className="text-xs text-muted-foreground">Exit: {data.risk.stopPlan}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


