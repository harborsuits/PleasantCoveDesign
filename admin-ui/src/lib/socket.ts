import { io, Socket } from 'socket.io-client';

let messagingSocket: Socket | null = null;
let apptSocket: Socket | null = null;

function getBaseUrl(): string {
  const ws = import.meta.env.VITE_WS_URL || window.location.origin;
  return ws.replace(/^http/, 'ws');
}

export function getMessagingSocket(): Socket {
  if (messagingSocket) return messagingSocket;
  const token = localStorage.getItem('auth_token') || localStorage.getItem('pcd_token') || '';
  const orgId = localStorage.getItem('pcd_org_id') || 'default-org';
  messagingSocket = io(`${getBaseUrl()}/messaging`, {
    transports: ['websocket'],
    auth: { token, orgId },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  return messagingSocket;
}

export function getApptSocket(): Socket {
  if (apptSocket) return apptSocket;
  const token = localStorage.getItem('auth_token') || localStorage.getItem('pcd_token') || '';
  const orgId = localStorage.getItem('pcd_org_id') || 'default-org';
  apptSocket = io(`${getBaseUrl()}/appointments`, {
    transports: ['websocket'],
    auth: { token, orgId },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  return apptSocket;
}
