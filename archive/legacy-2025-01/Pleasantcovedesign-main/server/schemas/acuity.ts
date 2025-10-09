import { z } from "zod";

export const AcuityWebhook = z.object({
  id: z.number(),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  datetime: z.string(),          // ISO string
  duration: z.number().int(),    // minutes
  type: z.string(),              // appointment type name
  calendarID: z.number().optional(),
  location: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  email: z.string().email().optional(),   // Acuity can include email depending on setup
  phone: z.string().optional(),
  // accommodate unknown extra fields
}).passthrough();

export type TAcuityWebhook = z.infer<typeof AcuityWebhook>;

export function mapAcuityToAppointment(a: TAcuityWebhook) {
  const start = new Date(a.datetime);
  const end = new Date(start.getTime() + a.duration * 60 * 1000);
  const title = `${a.type} with ${(a.firstName || "").trim()} ${(a.lastName || "").trim()}`.trim();

  return {
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    acuity_id: String(a.id),
    kind: "acuity",                // for filtering
    type: a.type,
    location: a.location || "",
    notes: a.notes || "",
    email: a.email || "",
    phone: a.phone || "",
    calendar_id: a.calendarID ?? null,
    // linkages (to be resolved by your matching logic)
    company_id: null,
    project_id: null,
    source: "acuity",
  };
}
