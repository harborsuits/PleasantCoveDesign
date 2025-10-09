import { Router } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage.js";

const r = Router();

r.post("/ws-exchange", async (req, res) => {
  console.log("🔗 [WS-EXCHANGE] Request received:", req.method, req.path, req.body);

  try {
    const { token } = req.body || {};
    if (!token) {
      console.log("❌ [WS-EXCHANGE] Missing token");
      return res.status(400).json({ error: "Missing token" });
    }

    console.log("🔍 [WS-EXCHANGE] Looking up project with token:", token.substring(0, 8) + "...");

    // Find project by access token
    const projects = await storage.getProjects({});
    const project = projects.find(p => p.accessToken === token);

    if (!project) {
      console.log("❌ [WS-EXCHANGE] Project not found for token");
      return res.status(404).json({ error: "Project not found" });
    }

    console.log("✅ [WS-EXCHANGE] Found project:", project.id);

    // Sign a short-lived WS token that ONLY allows this project room
    const wsToken = jwt.sign(
      { scope: "public", projectId: project.id },
      process.env.JWT_SECRET || "fallback-secret-change-in-prod",
      { expiresIn: "15m" }
    );

    console.log("🎫 [WS-EXCHANGE] Issued wsToken for project:", project.id);
    res.json({ wsToken, projectId: project.id });
  } catch (e: any) {
    console.error("❌ [WS-EXCHANGE] Error:", e);
    res.status(400).json({ error: e?.message || "Bad request" });
  }
});

export default r;
