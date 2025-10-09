import { z } from "zod";

export const AppointmentSource = z.enum(["manual", "acuity", "squarespace", "calendar"]);
export const AppointmentType = z.enum(["consultation", "review", "meeting", "launch", "followup", "presentation"]);
export const AppointmentStatus = z.enum(["confirmed", "tentative", "cancelled", "completed"]);

export const Appointment = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  project_id: z.string().nullable().optional(),
  company_id: z.string().nullable().optional(),
  source: AppointmentSource,
  type: AppointmentType,
  status: AppointmentStatus,
  description: z.string().optional(),
  attendees: z.array(z.string()).default([]),
  location: z.string().optional(),
  acuity_id: z.string().optional(),
  calendar_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AppointmentList = z.object({
  items: z.array(Appointment),
});

export type TAppointment = z.infer<typeof Appointment>;
export type TAppointmentList = z.infer<typeof AppointmentList>;
