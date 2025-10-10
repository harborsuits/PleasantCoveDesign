import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "http";

export function attachSocket(server: HttpServer) {
  const io = new Server(server, {
    path: "/socket.io",
    transports: ["websocket"],
    cors: {
      origin: [
        "http://localhost:5173",
        "https://pleasantcovedesign.com",
        "https://pleasantcovedesign-production.up.railway.app",
        "https://pleasantcove.squarespace.com" // your SQ site (or custom)
      ],
      methods: ["GET","POST"],
    },
    pingInterval: 20000,
    pingTimeout: 20000,
  });

  console.log("✅ Socket.IO initialized with auth middleware");

  io.use((socket, next) => {
    const { token, wsToken } = (socket.handshake.auth || {}) as any;
    console.log("🔑 Socket auth attempt:");
    console.log("   Token received:", token ? token.substring(0, 20) + "..." : "none");
    console.log("   Token type:", typeof token);
    
    try {
      if (wsToken) {
        const p = jwt.verify(wsToken, process.env.JWT_SECRET!) as any;
        socket.data.scope = "public";
        socket.data.projectId = p.projectId;
        console.log("[WS AUTH] ✅ Public access granted for project:", p.projectId);
        return next();
      }
      if (token) { // admin JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.scope = "admin";
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        console.log("✅ Socket authenticated:", decoded.userId);
        return next();
      }
      return next(new Error("No auth"));
    } catch (e: any) {
      console.error("[WS AUTH] ❌ JWT verification failed:", e.message);
      console.error("[WS AUTH] JWT_SECRET exists:", !!process.env.JWT_SECRET);
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (s) => {
    console.log(`✅ Authenticated user connected: ${s.data.userId || 'public'} (${s.data.scope})`);
    
    if (s.data.scope === "public" && s.data.projectId) {
      const room = `project:${s.data.projectId}`;
      s.join(room);
      console.log("[WS] public joined", room, s.id);
    }

    s.on("join", (projectToken, callback) => {
      if (s.data.scope === "admin" && projectToken) {
        const room = `project:${projectToken}`;
        s.join(room);
        console.log("[WS] admin joined", room, s.id);
        
        // Send acknowledgment with user info
        if (callback) {
          callback({ 
            success: true, 
            projectToken,
            userId: s.data.userId,
            role: s.data.role
          });
        }
      } else if (callback) {
        callback({ success: false, error: 'Insufficient permissions' });
      }
    });

    s.on("leave", ({ projectId }) => {
      const room = `project:${projectId}`;
      s.leave(room);
      console.log("[WS] left room", room, s.id);
    });
    
    s.on("disconnect", () => {
      console.log(`❌ User disconnected: ${s.data.userId || 'public'} (${s.id})`);
    });
  });

  return io;
}
