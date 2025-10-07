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

  io.use((socket, next) => {
    const { token, wsToken } = (socket.handshake.auth || {}) as any;
    try {
      if (wsToken) {
        const p = jwt.verify(wsToken, process.env.JWT_SECRET!) as any;
        socket.data.scope = "public";
        socket.data.projectId = p.projectId;
        return next();
      }
      if (token) { // admin JWT
        jwt.verify(token, process.env.JWT_SECRET!);
        socket.data.scope = "admin";
        return next();
      }
      return next(new Error("No auth"));
    } catch (e) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (s) => {
    if (s.data.scope === "public" && s.data.projectId) {
      const room = `project:${s.data.projectId}`;
      s.join(room);
      console.log("[WS] public joined", room, s.id);
    }

    s.on("join", ({ projectId }) => {
      if (s.data.scope === "admin" && projectId) {
        const room = `project:${projectId}`;
        s.join(room);
        console.log("[WS] admin joined", room, s.id);
      }
    });

    s.on("leave", ({ projectId }) => {
      const room = `project:${projectId}`;
      s.leave(room);
    });
  });

  return io;
}
