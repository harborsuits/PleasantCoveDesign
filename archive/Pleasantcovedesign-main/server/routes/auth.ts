import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// Exchange an admin key for a short-lived JWT
router.post("/token", (req: Request, res: Response) => {
  try {
    const adminKey = (req.body?.adminKey || "").toString();
    const expected = process.env.ADMIN_TOKEN; // e.g., pleasantcove2024admin

    if (!expected) {
      console.error("❌ [AUTH] ADMIN_TOKEN not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (adminKey !== expected) {
      console.warn("❌ [AUTH] Invalid admin key attempt");
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ [AUTH] JWT_SECRET not set in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Create JWT valid for 90 days (business communication relationships)
    const token = jwt.sign(
      {
        role: "admin",
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { expiresIn: "90d" }
    );

    console.log("✅ [AUTH] Admin JWT issued successfully");
    res.json({ token, expiresIn: "90d" });

  } catch (error) {
    console.error("❌ [AUTH] Token generation error:", error);
    res.status(500).json({ error: "Token generation failed" });
  }
});

export default router;
