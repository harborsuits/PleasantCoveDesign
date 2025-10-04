import { useEffect, useState } from 'react';
import { Quote, QuotesPayload } from '@/types/market';
import { pricesStream } from '@/lib/streams';
import { apiUrl } from '@/lib/httpBase';

export function useQuotes(symbols?: string[], pollMs = 5000) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [asOf, setAsOf] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  // HTTP seed + fallback
  useEffect(() => {
    let mounted = true; 
    let t: any;
    const tick = async () => {
      try {
        const url = symbols?.length
          ? apiUrl(`/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)
          : apiUrl('/api/quotes');
        const res = await fetch(url);
        const json = await res.json();
        if (!mounted) return;
        // Accept array shape or {quotes:Record}
        if (Array.isArray(json)) {
          const mapped = Object.fromEntries(json.map((q:any) => [String(q.symbol || '').toUpperCase(), {
            symbol: String(q.symbol || '').toUpperCase(),
            last: Number(q.last ?? q.price ?? q.close ?? 0),
            bid: Number(q.bid ?? 0),
            ask: Number(q.ask ?? 0),
            prevClose: Number(q.prevClose ?? q.previousClose ?? 0),
          }]));
          setQuotes(prev => ({ ...prev, ...mapped }));
        } else if (json?.quotes && typeof json.quotes === 'object') {
          setQuotes(prev => ({ ...prev, ...json.quotes }));
          if (json.asOf) setAsOf(json.asOf);
        }
      } catch (e: any) { 
        setError(e?.message || 'Failed to fetch quotes'); 
      }
      t = setTimeout(tick, pollMs);
    };
    tick();
    return () => { mounted = false; clearTimeout(t); };
  }, [pollMs]);

  // WS: subscribe once to stream singleton and request symbols
  useEffect(() => {
    const off = pricesStream.onMessage((msg) => {
      if (msg?.type === 'prices' && msg?.data) {
        // Accept both array and object payloads from the server
        try {
          if (Array.isArray(msg.data)) {
            const mapped = Object.fromEntries(msg.data.map((q:any) => [String(q.symbol || '').toUpperCase(), {
              symbol: String(q.symbol || '').toUpperCase(),
              last: Number(q.last ?? q.price ?? q.close ?? 0),
              bid: Number(q.bid ?? 0),
              ask: Number(q.ask ?? 0),
              prevClose: Number(q.prevClose ?? q.previousClose ?? 0),
            }]));
            setQuotes(prev => ({ ...prev, ...mapped }));
          } else if (typeof msg.data === 'object') {
            setQuotes(prev => ({ ...prev, ...msg.data }));
          }
        } catch {}
        if (msg.time) setAsOf(msg.time);
      }
    });
    
    // Subscribe to specific symbols if provided
    if (symbols?.length) {
      pricesStream.send({ 
        type: 'subscribe', 
        symbols: symbols.filter(Boolean), 
        ttlSec: 120 
      });
    }
    
    return () => { off && off(); };
  }, [symbols?.join(',')]);

  // optional symbol filter
  const filtered = symbols?.length
    ? Object.fromEntries(
        symbols
          .map((s) => s.toUpperCase())
          .filter((s) => quotes[s])
          .map((s) => [s, quotes[s]])
      )
    : quotes;

  return { quotes: filtered, asOf, error } as const;
}

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useQuotesQuery(symbols: string[]) {
  const validSymbols = symbols.filter(Boolean);
  const joined = validSymbols.slice().sort().join(",");
  
  return useQuery({
    queryKey: ["quotes", joined],
    queryFn: async () => {
      if (!joined) return [];
      const { data } = await axios.get(`/api/quotes?symbols=${joined}`);
      // Accept either {quotes:[...]} or [...]
      const quotes = Array.isArray(data) ? data : Array.isArray(data?.quotes) ? data.quotes : [];
      return quotes.map((r:any) => ({
        symbol: r.symbol,
        last: Number(r.last ?? r.price ?? r.close ?? 0),
        bid: Number(r.bid ?? 0),
        ask: Number(r.ask ?? 0),
        prevClose: Number(r.prevClose ?? r.previousClose ?? 0),
        change: Number(r.change ?? 0),
        pct: Number(r.pct ?? r.changePercent ?? 0),
        ts: r.ts ?? r.timestamp ?? null,
      }));
    },
    enabled: validSymbols.length > 0,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

// Alias for compatibility
export const usePrices = useQuotesQuery;

// Single quote hook
export function useQuote(symbol: string) {
  return useQuery({
    queryKey: ["quotes", symbol],
    queryFn: async () => {
      const response = await axios.get(`/api/quotes?symbols=${symbol}`);
      return response.data?.[0] || null;
    },
    refetchInterval: 15_000, 
    staleTime: 10_000,
  });
}