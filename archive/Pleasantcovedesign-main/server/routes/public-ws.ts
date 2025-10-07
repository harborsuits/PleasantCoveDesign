import { Router } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage.js";

const r = Router();

r.post("/ws-exchange", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: "Missing token" });

    // Find project by access token
    const projects = await storage.getProjects({});
    const project = projects.find(p => p.accessToken === token);

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Sign a short-lived WS token that ONLY allows this project room
    const wsToken = jwt.sign(
      { scope: "public", projectId: project.id },
      process.env.JWT_SECRET || "fallback-secret-change-in-prod",
      { expiresIn: "15m" }
    );
    res.json({ wsToken, projectId: project.id });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Bad request" });
  }
});

export default r;
