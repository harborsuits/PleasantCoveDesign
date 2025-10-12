import crypto from 'crypto';

const BASE = process.env.ACUITY_BASE || '';
const USER = process.env.ACUITY_USER || '';
const PASS = process.env.ACUITY_PASS || '';

async function acuity<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const auth = Buffer.from(`${USER}:${PASS}`).toString('base64');
  headers.set('Authorization', `Basic ${auth}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function getAvailability(calendarId: string, fromISO: string, toISO: string) {
  // Placeholder: return empty slots until wired
  return { slots: [] as Array<{ start: string; end: string }> };
}

export async function bookSlot(calendarId: string, start: string, end: string, visitor: { name: string; email: string }) {
  // Placeholder: mock success until wired
  return { success: true, appointmentId: `mock-${Date.now()}` };
}

export function verifyAcuityWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.ACUITY_WEBHOOK_SECRET || '';
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature || ''));
  } catch {
    return false;
  }
}


