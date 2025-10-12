import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "http";
import type { SocketAuthPayload } from "./ws/contracts.js";
import { setIO } from './socketRef.js';

export function attachSocket(server: HttpServer) {
  // Build a Socket.IO CORS allowlist aligned with HTTP CORS
  const ALLOWED_ORIGINS = new Set<string>([
    "http://localhost:5173",
    "https://pleasantcovedesign.com",
    "https://www.pleasantcovedesign.com",
    "https://pleasantcovedesign-production.up.railway.app",
  ]);
  const EXTRA_ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  for (const origin of EXTRA_ORIGINS) ALLOWED_ORIGINS.add(origin);

  const io = new Server(server, {
    path: "/socket.io",
    transports: ["websocket"],
    cors: {
      origin(origin, callback) {
        // Allow same-origin/no-origin (server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        return callback(null, ALLOWED_ORIGINS.has(origin));
      },
      methods: ["GET","POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  console.log("✅ Socket.IO initialized with auth middleware and namespaces");

  // Top-level auth middleware (allows limited unauth for Squarespace if configured)
  io.use((socket, next) => {
    const { token, wsToken, orgId, visitorId, userId } = (socket.handshake.auth || {}) as SocketAuthPayload & { userId?: string };
    // Always copy minimal identity for room joins/logs
    if (orgId) socket.data.orgId = socket.data.orgId || orgId;
    if (visitorId) socket.data.visitorId = socket.data.visitorId || visitorId;
    if (userId) socket.data.userId = socket.data.userId || userId;
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
  const messaging = io.of("/messaging");
  messaging.on("connection", (s) => {
    const { orgId, visitorId } = s.data || {};
    const origin = (s.handshake.headers.origin as string | undefined) || "";
    console.log('[WS:messaging] connect', { id: s.id, origin, orgId, visitorId });
    if (orgId) s.join(`org:${orgId}`);
    if (visitorId) s.join(`visitor:${visitorId}`);

    s.on("convo:join", ({ convoId }) => {
      console.log('[WS:messaging] join', { id: s.id, convo: `convo:${convoId}` });
      s.join(`convo:${convoId}`);
    });
    s.on("convo:leave", ({ convoId }) => s.leave(`convo:${convoId}`));

    s.on("message:new", (payload) => {
      console.log('[WS:messaging] message:new', { id: s.id, orgId: s.data?.orgId, convoId: payload?.convoId, len: (payload?.text || '').length });
      messaging.to(`convo:${payload.convoId}`).emit("message:new", payload);
      if (s.data?.orgId) messaging.to(`org:${s.data.orgId}`).emit("message:new", payload);
    });

    s.on("typing", (p) => messaging.to(`convo:${p.convoId}`).emit("typing", p));

    s.on("disconnect", (reason) => {
      console.log('[WS:messaging] disconnect', { id: s.id, reason });
    });
  });

  const appts = io.of("/appointments");
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
