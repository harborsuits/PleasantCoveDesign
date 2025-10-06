import { Server } from "socket.io";
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

  // Auth middleware (reads token from handshake.auth.token)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    // For admin dashboard connections, allow with any token or no token for now
    // TODO: Implement proper admin authentication
    if (!token) {
      console.log('🔐 [WS AUTH] No token provided, allowing admin connection');
    } else {
      console.log('🔐 [WS AUTH] Token provided, allowing connection');
    }

    socket.data.user = { id: "admin", type: "admin" };
    return next();
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // optional heartbeat
    const ping = setInterval(() => socket.emit("sys:ping", Date.now()), 15000);
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      clearInterval(ping);
    });

    socket.on("join", ({ projectId }) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        console.log(`📍 Socket ${socket.id} joined project:${projectId}`);
      }
    });
  });

  return io;
}
