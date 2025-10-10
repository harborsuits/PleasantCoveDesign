import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// Shared handler for admin JWT generation
const adminHandler = (req: Request, res: Response) => {
  try {
    const adminKey = (req.body?.adminKey || "").toString();
    const expected = process.env.ADMIN_TOKEN ?? (process.env.NODE_ENV !== 'production' ? 'pleasantcove2024admin' : undefined);

    if (!expected) {
      console.error("❌ [AUTH] ADMIN_TOKEN not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (adminKey !== expected) {
      console.warn("❌ [AUTH] Invalid admin key attempt");
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const jwtSecret = process.env.JWT_SECRET ?? (process.env.NODE_ENV !== 'production' ? 'pleasantcove_dev_jwt_secret' : undefined);
    if (!jwtSecret) {
      console.error("❌ [AUTH] JWT_SECRET not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Create JWT valid for 365 days for long-term projects
    const token = jwt.sign(
      {
        userId: 1,
        businessId: 1,
        role: "admin",
        scope: "admin",
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { expiresIn: "365d" }
    );

    console.log("✅ [AUTH] Admin JWT issued successfully (365 days)");
    res.json({ 
      token, 
      expiresIn: "365d",
      userId: 1,
      email: "admin@pleasantcove.com",
      name: "Admin",
      role: "admin"
    });

  } catch (error) {
    console.error("❌ [AUTH] Token generation error:", error);
    res.status(500).json({ error: "Token generation failed" });
  }
};

// Multiple endpoints for compatibility
router.post("/token", adminHandler);        // Original endpoint (returns same 365d token now)
router.post("/auth/admin", adminHandler);   // New endpoint that frontend expects

export default router;
