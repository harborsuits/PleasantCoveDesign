import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "http";

// Import the CORS allowlist
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://pleasantcovedesign.com",
  "https://pleasantcovedesign-production.up.railway.app",
  "https://nectarine-sparrow-dwsp.squarespace.com", // Adjust to your Squarespace domain
  "https://www.pleasantcovedesign.com", // If using custom domain
]);

export function attachSocket(http: HttpServer) {
  const io = new Server(http, {
    path: "/socket.io",
    transports: ["websocket"],     // force ws to avoid long-poll quirks behind proxies
    pingInterval: 20000,           // 20s ping for proxy-friendly connections
    pingTimeout: 20000,            // 20s timeout
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true); // allow curl / server-to-server
        callback(null, ALLOWED_ORIGINS.has(origin));
      },
      methods: ["GET","POST"],
      credentials: false,
    },
  });

  // Auth middleware: separate admin vs public connections
  io.use((socket, next) => {
    try {
      const { token, wsToken } = (socket.handshake.auth || {}) as { token?: string; wsToken?: string };

      // Admin path: verify your admin token/JWT if present
      if (token) {
        // TODO: replace with your admin token/JWT verification
        socket.data.scope = "admin";
        return next();
      }

      // Public path: verify wsToken (required)
      if (!wsToken) return next(new Error("Missing wsToken"));
      const payload = jwt.verify(wsToken, process.env.JWT_SECRET || "fallback-secret-change-in-prod") as any;
      if (payload.scope !== "public" || !payload.projectId) return next(new Error("Bad token"));
      socket.data.scope = "public";
      socket.data.projectId = payload.projectId;
      return next();
    } catch (e) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.data.scope})`);

    // Public sockets auto-join their project room
    if (socket.data.scope === "public" && socket.data.projectId) {
      socket.join(`project:${socket.data.projectId}`);
      console.log(`📍 Public socket ${socket.id} auto-joined project:${socket.data.projectId}`);
    }

    // optional heartbeat
    const ping = setInterval(() => socket.emit("sys:ping", Date.now()), 15000);
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      clearInterval(ping);
    });

    socket.on("join", ({ projectId }) => {
      if (socket.data.scope === "admin" && projectId) {
        socket.join(`project:${projectId}`);
        console.log(`📍 Admin socket ${socket.id} joined project:${projectId}`);
      }
    });
  });

  return io;
}
