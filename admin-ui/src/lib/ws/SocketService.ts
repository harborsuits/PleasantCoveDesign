import { io, Socket } from "socket.io-client";
import { AuthService } from "../auth/AuthService";

let socket: Socket | null = null;
let reauthAttempted = false;

export async function getSocket() {
  if (socket) return socket;

  // Wait for auth token to be available (with timeout)
  let token = localStorage.getItem("auth_token") || localStorage.getItem("pcd_token") || "";
  if (!token) {
    console.log("🔌 [SOCKET] Waiting for auth token...");
    for (let i = 0; i < 50; i++) { // Wait up to 5 seconds
      await new Promise(resolve => setTimeout(resolve, 100));
      token = localStorage.getItem("auth_token") || localStorage.getItem("pcd_token") || "";
      if (token) break;
    }
  }
  if (token) {
    console.log("🔌 [SOCKET] Token found, connecting...");
  } else {
    console.warn("⏰ [SOCKET] Token wait timeout");
  }

  // Use environment variable for WebSocket URL
  let wsUrl = import.meta.env.VITE_WS_URL ||
              localStorage.getItem('pcd_ngrok_url');

  if (!wsUrl && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development: proxy through Vite dev server
      wsUrl = 'http://localhost:3000';
    }
  }

  // Fallback for production
  wsUrl = wsUrl || 'https://pleasantcovedesign-production.up.railway.app';

  console.log("🔌 [SOCKET] Connecting to:", wsUrl);

  socket = io(wsUrl, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    auth: { token },
  });

  // Optional verbose client logs while you test
  // Open devtools and run: localStorage.debug = 'socket.io-client:*,socket.io-parser'; location.reload();

  socket.on("connect", () => console.log("✅ [SOCKET] Connected:", socket?.id));
  socket.on("disconnect", (r) => console.log("🔌 [SOCKET] Disconnected:", r));
  socket.on("connect_error", async (e: any) => {
    const message = e?.message || "";
    console.warn("❌ [SOCKET] Connect error", message);
    if (!reauthAttempted && typeof message === 'string' && message.toLowerCase().includes("unauthorized")) {
      try {
        console.log("🔄 [SOCKET] Unauthorized. Re-authenticating...");
        reauthAttempted = true;
        const newToken = await AuthService.authenticate();
        socket!.auth = { token: newToken } as any;
        console.log("🔌 [SOCKET] Retrying connection with new token...");
        socket!.connect();
      } catch (err) {
        console.error("❌ [SOCKET] Re-authentication failed:", err);
      }
    }
  });

  // Global events you already emit
  socket.on("activity:new", (evt) => window.dispatchEvent(new CustomEvent("activity:new", { detail: evt })));
  socket.on("appointment.created", (evt) => window.dispatchEvent(new CustomEvent("appointment.created", { detail: evt })));
  socket.on("appointment.updated", (evt) => window.dispatchEvent(new CustomEvent("appointment.updated", { detail: evt })));
  socket.on("message:new", (evt) => window.dispatchEvent(new CustomEvent("message.new", { detail: evt })));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export const socketService = {
  connect: getSocket,
  getSocket,
  disconnect: disconnectSocket,
};

declare global {
  interface Window {
    socketService?: typeof socketService;
  }
}

if (typeof window !== 'undefined') {
  window.socketService = socketService;
}