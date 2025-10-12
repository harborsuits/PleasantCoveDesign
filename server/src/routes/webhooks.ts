import { Router } from 'express';
import { verifyAcuityWebhook } from '../appointments/acuity.js';
import { getIO } from '../socketRef.js';

export function webhooksRouter() {
  const r = Router();

  r.post('/acuity', expressRaw(), (req, res) => {
    const sig = (req.header('X-Acuity-Signature') || '').toString();
    const raw = (req as any).rawBody as string;
    if (!verifyAcuityWebhook(raw, sig)) return res.status(401).send('bad sig');

    const event = JSON.parse(raw || '{}');
    const orgRoom = `org:${event?.orgId ?? 'default'}`;
    const io = getIO();
    if (event?.type === 'appointment.scheduled') {
      io.of('/appointments').to(orgRoom).emit('appointment:update', { appointmentId: String(event.id || ''), status: 'booked' });
    } else if (event?.type === 'appointment.rescheduled') {
      io.of('/appointments').to(orgRoom).emit('appointment:update', { appointmentId: String(event.id || ''), status: 'rescheduled' });
    } else if (event?.type === 'appointment.canceled') {
      io.of('/appointments').to(orgRoom).emit('appointment:update', { appointmentId: String(event.id || ''), status: 'canceled' });
    }
    res.sendStatus(200);
  });

  return r;
}

function expressRaw() {
  const fn: any = (req: any, _res: any, next: any) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (ch: string) => (data += ch));
    req.on('end', () => { (req as any).rawBody = data; next(); });
  };
  return fn;
}


