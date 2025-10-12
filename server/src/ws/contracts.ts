export type MessagingEvents = {
  'message:new': { convoId: string; messageId: string; role: 'visitor' | 'agent'; text: string; ts: number };
  'message:ack': { convoId: string; messageId: string; ts: number };
  'typing': { convoId: string; role: 'visitor' | 'agent'; isTyping: boolean };
  'convo:list': { status?: 'open' | 'closed' };
  'convo:join': { convoId: string };
  'convo:leave': { convoId: string };
};

export type AppointmentEvents = {
  'availability:fetch': { calendarId: string; fromISO: string; toISO: string };
  'availability:data': { calendarId: string; slots: Array<{ start: string; end: string }> };
  'book:request': { calendarId: string; slotStart: string; slotEnd: string; visitor: { name: string; email: string } };
  'book:result': { success: boolean; appointmentId?: string; error?: string };
  'appointment:update': { appointmentId: string; status: 'booked' | 'rescheduled' | 'canceled' };
};

export interface SocketAuthPayload {
  token?: string;
  wsToken?: string;
  orgId?: string;
  userId?: string;
  visitorId?: string;
}

