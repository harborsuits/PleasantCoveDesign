import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "http";
import type { MessagingEvents, AppointmentEvents, SocketAuthPayload } from "./ws/contracts.js";
import { setIO } from './socketRef.js';

export function attachSocket(server: HttpServer) {
  const io = new Server(server, {
    path: "/socket.io",
    transports: ["websocket"],
    cors: {
      origin: [
        "http://localhost:5173",
        "https://pleasantcovedesign.com",
        "https://pleasantcovedesign-production.up.railway.app",
        "https://pleasantcove.squarespace.com"
      ],
      methods: ["GET","POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  console.log("✅ Socket.IO initialized with auth middleware and namespaces");

  // Top-level auth middleware (allows limited unauth for Squarespace if configured)
  io.use((socket, next) => {
    const { token, wsToken, orgId, visitorId } = (socket.handshake.auth || {}) as SocketAuthPayload;
    try {
      if (wsToken) {
        const p = jwt.verify(wsToken, process.env.JWT_SECRET!) as any;
        socket.data.scope = "public";
        socket.data.orgId = p.orgId || orgId;
        socket.data.visitorId = p.visitorId || visitorId;
        return next();
      }
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.scope = "admin";
        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        socket.data.orgId = decoded.orgId || orgId;
        return next();
      }
      // Optional relaxed path: allow Squarespace origin with orgId only
      const origin = socket.handshake.headers.origin as string | undefined;
      const allowedSq = origin?.includes("squarespace.com");
      if (allowedSq && orgId) {
        socket.data.scope = "public";
        socket.data.orgId = orgId;
        socket.data.visitorId = visitorId;
        return next();
      }
      return next(new Error("No auth"));
    } catch (e: any) {
      return next(new Error("Unauthorized"));
    }
  });

  // Namespaces
  const messaging = io.of<MessagingEvents>("/messaging");
  messaging.on("connection", (s) => {
    const { orgId, visitorId } = s.data || {};
    if (orgId) s.join(`org:${orgId}`);
    if (visitorId) s.join(`visitor:${visitorId}`);

    s.on("convo:join", ({ convoId }) => s.join(`convo:${convoId}`));
    s.on("convo:leave", ({ convoId }) => s.leave(`convo:${convoId}`));

    s.on("message:new", (payload) => {
      messaging.to(`convo:${payload.convoId}`).emit("message:new", payload);
      if (s.data?.orgId) messaging.to(`org:${s.data.orgId}`).emit("message:new", payload);
    });

    s.on("typing", (p) => messaging.to(`convo:${p.convoId}`).emit("typing", p));
  });

  const appts = io.of<AppointmentEvents>("/appointments");
  appts.on("connection", (s) => {
    const { orgId, visitorId } = s.data || {};
    if (orgId) s.join(`org:${orgId}`);
    if (visitorId) s.join(`visitor:${visitorId}`);

    s.on("availability:fetch", async ({ calendarId, fromISO, toISO }) => {
      // Placeholder: wire real adapter
      const slots: Array<{ start: string; end: string }> = [];
      s.emit("availability:data", { calendarId, slots });
    });

    s.on("book:request", async ({ calendarId, slotStart, slotEnd, visitor }) => {
      // Placeholder: wire real booking
      const res = { success: true, appointmentId: `apt_${Date.now()}` } as const;
      s.emit("book:result", res);
      if (res.success && res.appointmentId && s.data?.orgId) {
        appts.to(`org:${s.data.orgId}`).emit("appointment:update", { appointmentId: res.appointmentId, status: "booked" });
      }
    });
  });

  // expose io
  setIO(io);
  return io;
}
