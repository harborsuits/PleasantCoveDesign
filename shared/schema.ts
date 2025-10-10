export interface Business {
  id?: number;
  name: string;
  industry: string;
  stage: 'lead' | 'contacted' | 'demo' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  score: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}
export type NewBusiness = Omit<Business, 'id' | 'createdAt' | 'updatedAt'>;

export interface Activity {
  id?: number;
  businessId: number;
  type: 'note' | 'call' | 'email' | 'meeting';
  content: string;
  timestamp?: string;
}
export type NewActivity = Omit<Activity, 'id' | 'timestamp'>;

export interface Company {
  id?: number;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: string;
}
export type NewCompany = Omit<Company, 'id' | 'createdAt'>;

export interface Project {
  id?: number;
  companyId: number;
  title: string;
  status: 'active' | 'completed' | 'paused';
  accessToken: string;
  createdAt?: string;
  updatedAt?: string;
}
export type NewProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export interface ProjectMessage {
  id?: number;
  projectId: number;
  senderType: 'client' | 'admin';
  senderName: string;
  content: string;
  attachments?: string[];
  createdAt?: string;
}

export interface ProjectFile {
  id?: number;
  projectId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: 'client' | 'admin';
  createdAt?: string;
}
