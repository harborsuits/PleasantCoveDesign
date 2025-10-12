import { io, Socket } from 'socket.io-client';

type MessagingOpts = {
  apiBase: string;
  socketUrl: string;
  orgId: string;
  mount: string | HTMLElement;
  token?: string;
  visitorId?: string;
};

type AppointmentOpts = {
  apiBase: string;
  socketUrl: string;
  orgId: string;
  calendarId: string;
  mount: string | HTMLElement;
  token?: string;
  visitorId?: string;
};

function getEl(mount: string | HTMLElement): HTMLElement {
  if (typeof mount === 'string') {
    const el = document.querySelector<HTMLElement>(mount);
    if (!el) throw new Error(`PCD mount not found: ${mount}`);
    return el;
  }
  return mount;
}

export function initMessagingWidget(opts: MessagingOpts) {
  const mount = getEl(opts.mount);
  const socket: Socket = io(`${opts.socketUrl}/messaging`, {
    transports: ['websocket'],
    auth: { token: opts.token, orgId: opts.orgId, visitorId: opts.visitorId },
    reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000
  });

  const wrap = document.createElement('div');
  wrap.style.cssText = 'border:1px solid #ddd;padding:12px;border-radius:12px;max-width:420px;';
  const list = document.createElement('div');
  list.style.cssText = 'min-height:120px;max-height:240px;overflow:auto;margin-bottom:8px;';
  const input = document.createElement('input');
  input.placeholder = 'Type a message…';
  input.style.cssText = 'width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;';
  wrap.appendChild(list); wrap.appendChild(input); mount.appendChild(wrap);

  const convoId = `visitor:${opts.visitorId ?? 'anon'}`;
  socket.emit('convo:join', { convoId });

  input.addEventListener('input', () => {
    socket.emit('typing', { convoId, role: 'visitor', isTyping: true });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const msgId = String(Date.now());
      const text = input.value.trim();
      socket.emit('message:new', { convoId, messageId: msgId, role: 'visitor', text, ts: Date.now() });
      const bubble = document.createElement('div');
      bubble.textContent = `You: ${text}`;
      bubble.style.cssText = 'margin:6px 0;text-align:right;';
      list.appendChild(bubble);
      list.scrollTop = list.scrollHeight;
      input.value = '';
    }
  });

  socket.on('message:new', payload => {
    if (payload.convoId !== convoId || payload.role === 'visitor') return;
    const bubble = document.createElement('div');
    bubble.textContent = `Agent: ${payload.text}`;
    bubble.style.cssText = 'margin:6px 0;text-align:left;';
    list.appendChild(bubble);
    list.scrollTop = list.scrollHeight;
  });

  return socket;
}

export function initAppointmentWidget(opts: AppointmentOpts) {
  const mount = getEl(opts.mount);
  const socket: Socket = io(`${opts.socketUrl}/appointments`, {
    transports: ['websocket'],
    auth: { token: opts.token, orgId: opts.orgId, visitorId: opts.visitorId },
    reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000
  });

  const box = document.createElement('div');
  box.style.cssText = 'border:1px solid #ddd;padding:12px;border-radius:12px;max-width:420px;';
  box.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input id="from" type="date" />
      <input id="to" type="date" />
      <button id="fetch">Find slots</button>
    </div>
    <div id="slots" style="display:grid;gap:6px;"></div>
  `;
  mount.appendChild(box);

  const fetchBtn = box.querySelector<HTMLButtonElement>('#fetch')!;
  const fromEl = box.querySelector<HTMLInputElement>('#from')!;
  const toEl = box.querySelector<HTMLInputElement>('#to')!;
  const slotsEl = box.querySelector<HTMLDivElement>('#slots')!;

  fetchBtn.onclick = () => {
    const fromISO = new Date(fromEl.value).toISOString();
    const toISO = new Date(toEl.value).toISOString();
    socket.emit('availability:fetch', { calendarId: opts.calendarId, fromISO, toISO });
  };

  socket.on('availability:data', ({ slots }) => {
    slotsEl.innerHTML = '';
    slots.forEach((s: { start: string; end: string }) => {
      const btn = document.createElement('button');
      btn.textContent = new Date(s.start).toLocaleString();
      btn.onclick = () => {
        const name = prompt('Your name?') || 'Visitor';
        const email = prompt('Your email?') || '';
        socket.emit('book:request', { calendarId: opts.calendarId, slotStart: s.start, slotEnd: s.end, visitor: { name, email } });
      };
      slotsEl.appendChild(btn);
    });
  });

  socket.on('book:result', (res) => {
    alert(res.success ? 'Booked!' : `Booking failed: ${res.error ?? ''}`);
  });

  return socket;
}

// UMD export
// @ts-ignore
if (typeof window !== 'undefined') (window as any).PCD = { initMessagingWidget, initAppointmentWidget };


