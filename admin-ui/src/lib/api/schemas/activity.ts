import { z } from "zod";

export const ActivityItem = z.object({
  id: z.string(),
  type: z.enum(["message", "appointment", "file", "company", "project"]),
  title: z.string(),
  description: z.string(),
  createdAt: z.string(),
  projectId: z.string().optional(),
  companyId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const ActivityList = z.object({
  items: z.array(ActivityItem),
});

export type TActivityItem = z.infer<typeof ActivityItem>;
export type TActivityList = z.infer<typeof ActivityList>;
