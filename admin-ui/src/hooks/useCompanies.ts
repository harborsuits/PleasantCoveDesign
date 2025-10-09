import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface Company {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  website?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  website?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  notes?: string;
}

export function useCompanies(search?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['companies', { search, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`/api/companies?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async (): Promise<Company> => {
      const response = await api.get(`/api/companies/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CompanyFormData): Promise<Company> => {
      const response = await api.post('/api/companies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CompanyFormData> }): Promise<Company> => {
      const response = await api.put(`/api/companies/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedCompany) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.setQueryData(['companies', updatedCompany.id], updatedCompany);
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useCompanyProjects(companyId: number) {
  return useQuery({
    queryKey: ['companies', companyId, 'projects'],
    queryFn: async () => {
      const response = await api.get(`/api/companies/${companyId}/projects`);
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
