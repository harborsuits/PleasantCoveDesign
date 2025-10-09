import { z } from "zod";

export const CompanyStatus = z.enum(["lead", "prospect", "active", "paused", "lost"]);

export const Company = z.object({
  id: z.string(),
  name: z.string(),
  contact_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  status: CompanyStatus,
  tags: z.array(z.string()).default([]),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CompanyList = z.object({
  items: z.array(Company),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasMore: z.boolean(),
});

export type TCompany = z.infer<typeof Company>;
export type TCompanyList = z.infer<typeof CompanyList>;
