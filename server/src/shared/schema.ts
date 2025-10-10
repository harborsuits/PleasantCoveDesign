import { z } from "zod";

/** Align statuses to what storage.ts compares against */
export const StatusEnum = z.enum(["lead","contacted","demo","won","lost","sold","delivered"]);
export type Status = z.infer<typeof StatusEnum>;

export const PriorityEnum = z.enum(["low","medium","high"]);
export type Priority = z.infer<typeof PriorityEnum>;

/** Company / Business models as used in storage.ts and db.ts */
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** optional fields the code reads */
  email: z.string().email().optional(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  /** totals the code accesses */
  totalAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  createdAt: z.string().or(z.date()).optional(),
});
export type Company = z.infer<typeof CompanySchema>;

/** Some code refers to Business with the same optional fields */
export const BusinessSchema = CompanySchema.extend({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const ActivitySchema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.string().or(z.date()).optional(), // code reads createdAt
});
export type Activity = z.infer<typeof ActivitySchema>;

/** Message is imported in db.ts; make sure it's exported */
export const MessageSchema = z.object({
  id: z.string().optional(),
  projectToken: z.string(),
  role: z.enum(["user","assistant","system"]).default("user"),
  content: z.string(),
  createdAt: z.string().or(z.date()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

/** NewCompany/NewProject used by seed-production.ts */
export const NewCompanySchema = CompanySchema.partial({ id: true });
export type NewCompany = z.infer<typeof NewCompanySchema>;

export const ProjectSchema = z.object({
  id: z.string().optional(),
  token: z.string(),
  name: z.string(),
  /** seed uses this; make it optional */
  type: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
export type NewProject = Omit<Project, "id"> & { id?: string };
