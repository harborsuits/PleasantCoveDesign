import { z } from 'zod';

// Base API response wrapper
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// Paginated response
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
    nextCursor: z.string().optional(),
  });

// Core entity schemas
export const CompanySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  title: z.string(),
  type: z.string().optional(),
  stage: z.string().optional(),
  status: z.string().optional(),
  totalAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  nextPayment: z.number().optional(),
  dueDate: z.string().optional(),
  accessToken: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const MessageSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  senderType: z.enum(['admin', 'client']),
  senderName: z.string(),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const AppointmentSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  projectId: z.number().optional(),
  datetime: z.string(),
  status: z.string(),
  notes: z.string().optional(),
  client_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  businessType: z.string().optional(),
  clientStage: z.string().optional(),
  clientScore: z.number().optional(),
});

export const ActivitySchema = z.object({
  id: z.number(),
  type: z.string(),
  description: z.string(),
  companyId: z.number().optional(),
  projectId: z.number().optional(),
  createdAt: z.string(),
});

// Authentication schemas
export const TokenRequestSchema = z.object({
  type: z.literal('admin'),
});

export const TokenResponseSchema = z.object({
  valid: z.boolean(),
  token: z.string(),
  expires: z.string().optional(),
});

// API response types
export type Company = z.infer<typeof CompanySchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type Activity = z.infer<typeof ActivitySchema>;

export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// API endpoint contracts
export interface ApiContract {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  auth: 'public' | 'admin' | 'none';
  requestSchema?: z.ZodType;
  responseSchema: z.ZodType;
  description: string;
}

// Contract registry for validation
export const API_CONTRACTS: Record<string, ApiContract> = {
  // Authentication
  'token': {
    route: '/token',
    method: 'POST',
    auth: 'none',
    requestSchema: TokenRequestSchema,
    responseSchema: TokenResponseSchema,
    description: 'Get authentication token',
  },

  // Companies
  'companies.list': {
    route: '/companies',
    method: 'GET',
    auth: 'admin',
    responseSchema: PaginatedResponseSchema(CompanySchema),
    description: 'List all companies',
  },

  'companies.get': {
    route: '/companies/:id',
    method: 'GET',
    auth: 'admin',
    responseSchema: CompanySchema,
    description: 'Get company by ID',
  },

  // Projects
  'projects.list': {
    route: '/projects',
    method: 'GET',
    auth: 'admin',
    responseSchema: PaginatedResponseSchema(ProjectSchema),
    description: 'List all projects',
  },

  'projects.get': {
    route: '/projects/:id',
    method: 'GET',
    auth: 'admin',
    responseSchema: ProjectSchema,
    description: 'Get project by ID',
  },

  'projects.messages': {
    route: '/projects/:id/messages',
    method: 'GET',
    auth: 'admin',
    responseSchema: PaginatedResponseSchema(MessageSchema),
    description: 'Get project messages',
  },

  'projects.sendMessage': {
    route: '/projects/:id/messages',
    method: 'POST',
    auth: 'admin',
    responseSchema: MessageSchema,
    description: 'Send message to project',
  },

  // Appointments
  'appointments.list': {
    route: '/appointments',
    method: 'GET',
    auth: 'admin',
    responseSchema: PaginatedResponseSchema(AppointmentSchema),
    description: 'List all appointments',
  },

  // Activities
  'activities.recent': {
    route: '/activities/recent',
    method: 'GET',
    auth: 'admin',
    responseSchema: PaginatedResponseSchema(ActivitySchema),
    description: 'Get recent activities',
  },

  // Public endpoints (for Squarespace widgets)
  'public.project': {
    route: '/public/project/:token',
    method: 'GET',
    auth: 'public',
    responseSchema: ProjectSchema,
    description: 'Get public project info',
  },

  'public.messages': {
    route: '/public/project/:token/messages',
    method: 'GET',
    auth: 'public',
    responseSchema: PaginatedResponseSchema(MessageSchema),
    description: 'Get public project messages',
  },

  'public.sendMessage': {
    route: '/public/project/:token/messages',
    method: 'POST',
    auth: 'public',
    responseSchema: MessageSchema,
    description: 'Send public message',
  },
};
