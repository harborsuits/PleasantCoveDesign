import { z } from "zod";

/** Align statuses to what storage.ts compares against */
export const StatusEnum = z.enum(["lead","contacted","demo","won","lost","sold","delivered"]);
export type Status = z.infer<typeof StatusEnum>;

export const PriorityEnum = z.enum(["low","medium","high"]);
export type Priority = z.infer<typeof PriorityEnum>;

/** Company / Business models as used in storage.ts and db.ts */
export const CompanySchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  /** optional fields the code reads */
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  priority: PriorityEnum.optional(),
  /** totals the code accesses */
  totalAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type Company = z.infer<typeof CompanySchema>;

/** Some code refers to Business with the same optional fields plus status/priority/score/stage */
export const BusinessSchema = CompanySchema.extend({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  score: z.number().optional(),
  stage: z.string().optional(),
  businessType: z.string().optional(),
});
export type Business = z.infer<typeof BusinessSchema>;

export const ActivitySchema = z.object({
  id: z.number().optional(),
  type: z.string(),
  description: z.string().optional(),
  businessId: z.number().optional(),
  createdAt: z.string().or(z.date()).optional(), // code reads createdAt
});
export type Activity = z.infer<typeof ActivitySchema>;

/** Message is imported in db.ts; make sure it's exported */
export const MessageSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  projectId: z.number().optional(),
  projectToken: z.string().optional(),
  role: z.enum(["user","assistant","system"]).default("user"),
  senderType: z.enum(["client","admin"]).optional(),
  senderName: z.string().optional(),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

/** Files */
export const ProjectFileSchema = z.object({
  id: z.number().optional(),
  projectId: z.number(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  uploadedBy: z.enum(["client","admin"]).optional(),
  createdAt: z.string().or(z.date()).optional(),
});
export type ProjectFile = z.infer<typeof ProjectFileSchema>;

/** NewCompany/NewProject used by seed-production.ts */
export const NewCompanySchema = CompanySchema.partial({ id: true, createdAt: true, updatedAt: true });
export type NewCompany = z.infer<typeof NewCompanySchema>;

export const ProjectSchema = z.object({
  id: z.number().optional(),
  companyId: z.number().optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  token: z.string().optional(),
  accessToken: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  score: z.number().optional(),
  notes: z.string().optional(),
  totalAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  paymentStatus: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
export type NewProject = Omit<Project, "id"> & { id?: number };

/** Convenience aliases expected in some imports */
export type ProjectMessage = Message;

/** New types used in Storage */
export type NewBusiness = Omit<Business, 'id' | 'createdAt' | 'updatedAt'>;
export type NewActivity = Omit<Activity, 'id' | 'createdAt'>;
