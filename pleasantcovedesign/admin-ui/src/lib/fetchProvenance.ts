import { api } from './apiBase';

export type Meta = {
  source?: string; provider?: string; asof_ts?: string;
  latency_ms?: number; request_id?: string; status?: number;
};

export async function getJSON<T=any>(path: string): Promise<{ data: T; meta: Meta }> {
  const url = api(path);
  const r = await fetch(url);
  const hdrMeta: Meta = {
    source: r.headers.get('x-source') || undefined,
    provider: r.headers.get('x-provider') || undefined,
    asof_ts: r.headers.get('x-asof') || undefined,
    latency_ms: Number(r.headers.get('x-latency-ms') || 0),
    request_id: r.headers.get('x-request-id') || undefined,
    status: r.status,
  };

  let body: any = {};
  try { body = await r.json(); } catch {}

  const bodyMeta: Meta = {
    source: body?.source ?? hdrMeta.source,
    provider: body?.provider ?? hdrMeta.provider,
    asof_ts: body?.asof_ts ?? hdrMeta.asof_ts,
    latency_ms: body?.latency_ms ?? hdrMeta.latency_ms,
    request_id: body?.request_id ?? hdrMeta.request_id,
    status: hdrMeta.status,
  };

  // Attach provenance for UI chips
  const prov = r.headers.get('x-provenance') || undefined;
  if (prov) {
    (bodyMeta as any).provenance = prov;
  } else if (body && typeof body === 'object') {
    try {
      const src = (body as any).source;
      const broker = (body as any).broker;
      const env = (body as any).env;
      if (src === 'broker' && broker) (bodyMeta as any).provenance = `broker:${broker}:${env || 'unknown'}`;
    } catch {}
  }

  if (!r.ok) {
    throw Object.assign(new Error(body?.error || `HTTP ${r.status}`), { meta: bodyMeta, data: body });
  }
  return { data: body as T, meta: bodyMeta };
}


