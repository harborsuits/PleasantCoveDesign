import { wsUrl } from '@/lib/wsUrl';

type WSState = 'idle'|'connecting'|'open'|'closed'|'error';
type Listener = (msg: any) => void;

const REFRESH_MS = Number(import.meta.env.VITE_QUOTES_REFRESH_MS || 5000);
// stale if no frames in ~2.5× backend refresh
const STALE_MS = Math.max(REFRESH_MS * 2.5, 12000);

export class WebSocketService {
  private url: string;
  private ws?: WebSocket;
  private state: WSState = 'idle';
  private listeners = new Set<Listener>();
  private backoff = 1000;
  private lastMessageAt = 0;
  private beat?: number;

  constructor(path: string) { this.url = wsUrl(path); }

  getState() { return this.state; }
  getLastMessageAgeMs() { return Date.now() - this.lastMessageAt; }

  start() {
    if (this.state === 'open' || this.state === 'connecting') return;
    this.state = 'connecting';
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.state = 'open';
      this.backoff = 1000;
      this.lastMessageAt = Date.now();
      this.beat = window.setInterval(() => {
        if (this.getLastMessageAgeMs() > STALE_MS) {
          try { this.ws?.close(); } catch {}
        }
      }, Math.min(REFRESH_MS, 5000));
    };

    ws.onmessage = (ev) => {
      this.lastMessageAt = Date.now();
      try {
        const msg = JSON.parse(ev.data);
        this.listeners.forEach(l => l(msg));
      } catch {}
    };

    ws.onerror = () => { this.state = 'error'; };

    ws.onclose = () => {
      if (this.beat) { clearInterval(this.beat); this.beat = undefined; }
      if (this.state !== 'closed') this.reconnect();
    };
  }

  private reconnect() {
    this.state = 'closed';
    setTimeout(() => this.start(), Math.min(this.backoff *= 2, 15000) + Math.floor(Math.random()*250));
  }

  stop() {
    this.state = 'closed';
    if (this.beat) { clearInterval(this.beat); this.beat = undefined; }
    try { this.ws?.close(); } catch {}
  }

  onMessage(cb: Listener) { this.listeners.add(cb); return () => this.listeners.delete(cb); }
  send(obj: any) { if (this.state !== 'open') return false; try { this.ws?.send(JSON.stringify(obj)); return true; } catch { return false; } }
}
