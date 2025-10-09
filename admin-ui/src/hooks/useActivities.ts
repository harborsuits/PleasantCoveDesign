import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api/client';
import { getSocket } from '@/lib/ws/SocketService';

export interface Activity {
  id: number;
  type: string;
  description: string;
  companyId?: number;
  projectId?: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

export function useRecentActivities(limit = 20) {
  return useQuery({
    queryKey: ['activities', 'recent', limit],
    queryFn: async () => {
      const response = await api.get(`/api/activities/recent?limit=${limit}`);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useActivities(page = 1, limit = 50, type?: string) {
  return useQuery({
    queryKey: ['activities', { page, limit, type }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type) {
        params.append('type', type);
      }

      const response = await api.get(`/api/activities?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProjectActivities(projectId: number) {
  return useQuery({
    queryKey: ['activities', 'project', projectId],
    queryFn: async () => {
      const response = await api.get(`/api/projects/${projectId}/activities`);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCompanyActivities(companyId: number) {
  return useQuery({
    queryKey: ['activities', 'company', companyId],
    queryFn: async () => {
      const response = await api.get(`/api/companies/${companyId}/activities`);
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useActivitySubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const initSocket = async () => {
      try {
        const socket = await getSocket();

        const handleNewActivity = (activity: Activity) => {
          // Add to recent activities
          queryClient.setQueryData(['activities', 'recent', 20], (oldData: any) => {
            if (!oldData) return oldData;

            const newActivities = [activity, ...oldData.items.slice(0, 19)];
            return {
              ...oldData,
              items: newActivities,
            };
          });

          // Invalidate other activity queries to refresh
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        };

        socket.on('activity:new', handleNewActivity);

      } catch (error) {
        console.error('Failed to initialize socket for activities:', error);
      }
    };

    initSocket();
  }, [queryClient]);
}

// Hook for creating activities (usually done by backend, but useful for testing)
export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> => {
      const response = await api.post('/api/activities', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
