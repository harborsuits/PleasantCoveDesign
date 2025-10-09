import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface DashboardKPIs {
  totalLeads: number;
  totalRevenue: number;
  activeProjects: number;
  totalDemos: number;
  conversionRate: number;
  avgProjectValue: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface LeadDataPoint {
  week: string;
  leads: number;
}

export interface LeadSourceData {
  source: string;
  count: number;
  percentage: number;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['stats', 'kpis'],
    queryFn: async (): Promise<DashboardKPIs> => {
      const response = await api.get('/api/stats/kpis');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useRevenueChart() {
  return useQuery({
    queryKey: ['stats', 'revenue'],
    queryFn: async (): Promise<RevenueDataPoint[]> => {
      const response = await api.get('/api/stats/revenueByMonth');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useLeadChart() {
  return useQuery({
    queryKey: ['stats', 'leads'],
    queryFn: async (): Promise<LeadDataPoint[]> => {
      const response = await api.get('/api/stats/leadsBySource');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useLeadSources() {
  return useQuery({
    queryKey: ['stats', 'leadSources'],
    queryFn: async (): Promise<LeadSourceData[]> => {
      const response = await api.get('/api/stats/leadSources');
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
