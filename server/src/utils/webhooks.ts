import crypto from 'crypto';
import getRawBody from 'raw-body';

export function verifyHmacSha256(raw: Buffer, headerSig: string | undefined, secret: string | undefined): boolean {
  if (!secret) return true; // allow if unset (dev)
  if (!headerSig) return false;

  // Handle different signature formats
  const sig = headerSig.replace(/^sha256=/, '').replace(/^sha256:/, '');
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(raw);
  const expected = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

export function isTrustedIp(ip: string | undefined, allowlist: string | undefined): boolean {
  if (!allowlist) return true;
  const allowed = allowlist.split(",").map(s => s.trim()).filter(Boolean);
  if (!ip) return false;
  const clean = ip.replace("::ffff:", "");
  return allowed.includes(clean);
}

export async function parseRawJson(req: any, res: any, next: any) {
  try {
    // For webhook signatures, we need raw body, but for now use parsed JSON
    req.rawBody = Buffer.from(JSON.stringify(req.body));
    req.rawJson = req.body;
    next();
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON" });
  }
}
