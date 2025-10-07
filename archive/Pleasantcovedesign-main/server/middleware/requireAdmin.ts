import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    console.warn("[AUTH] missing/invalid Authorization header:", header.substring(0, 50) + "...");
    return res.status(401).json({ error: "Unauthorized. Admin access required.", code: "NO_BEARER" });
  }

  const raw = header.slice(7).trim();
  try {
    const payload = jwt.verify(raw, process.env.JWT_SECRET!, { algorithms: ["HS256"] }) as any;
    (req as any).admin = payload;
    console.log("✅ [AUTH] JWT admin access granted for:", payload.role);
    return next();
  } catch (err: any) {
    console.warn("[AUTH] jwt.verify failed:", err?.name, err?.message, "Token:", raw.substring(0, 20) + "...");
    // Legacy fallback if you still support a static admin token (optional)
    if (process.env.ADMIN_TOKEN && raw === process.env.ADMIN_TOKEN) {
      (req as any).admin = { role: "admin", legacy: true };
      console.log("⚠️ [AUTH] Legacy admin token accepted (development only)");
      return next();
    }
    return res.status(401).json({ error: "Unauthorized. Admin access required.", code: err?.name || "VERIFY_FAIL" });
  }
}
