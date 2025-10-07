import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "http";

export function attachSocket(http: HttpServer) {
  const io = new Server(http, {
    path: "/socket.io",
    transports: ["websocket"],     // force ws to avoid long-poll quirks behind proxies
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://your-crm-ui-domain.com",
        "https://your-squarespace-site.com",
        "https://www.pleasantcovedesign.com",
        "http://www.pleasantcovedesign.com",
        "https://pleasantcovedesign.com",
        "http://pleasantcovedesign.com",
      ],
      methods: ["GET","POST"],
      allowedHeaders: ["authorization"],
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
