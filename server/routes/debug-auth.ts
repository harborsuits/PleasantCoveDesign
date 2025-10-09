import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.get("/debug/jwt", (_req: Request, res: Response) => {
  const hasSecret = Boolean(process.env.JWT_SECRET);
  const secretLength = process.env.JWT_SECRET?.length || 0;
  res.json({
    hasSecret,
    secretLength,
    adminTokenSet: Boolean(process.env.ADMIN_TOKEN)
  });
});

router.get("/debug/whoami", (req: Request, res: Response) => {
  const header = req.headers.authorization || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!raw) {
    return res.status(401).json({ ok: false, error: "NO_TOKEN", message: "No Bearer token provided" });
  }

  try {
    const payload = jwt.verify(raw, process.env.JWT_SECRET!, { algorithms: ["HS256"] }) as any;
    return res.json({
      ok: true,
      payload,
      tokenLength: raw.length,
      headerLength: header.length
    });
  } catch (e: any) {
    return res.status(401).json({
      ok: false,
      error: e?.name || "verify_fail",
      message: e?.message,
      tokenLength: raw.length,
      headerLength: header.length
    });
  }
});

export default router;
