import { WebSocketService } from '@/lib/websocket';

// Singletons for the app
export const pricesStream = new WebSocketService('/ws/prices');
export const decisionsStream = new WebSocketService('/ws/decisions');
