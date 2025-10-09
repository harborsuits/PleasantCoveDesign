import { z } from "zod";

export const FileRecord = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  url: z.string(),
  projectId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  uploadedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FileList = z.object({
  items: z.array(FileRecord),
});

export const UploadConfig = z.object({
  method: z.string(),
  url: z.string(),
  fields: z.record(z.any()),
  headers: z.record(z.string()),
});

export type TFileRecord = z.infer<typeof FileRecord>;
export type TFileList = z.infer<typeof FileList>;
export type TUploadConfig = z.infer<typeof UploadConfig>;
