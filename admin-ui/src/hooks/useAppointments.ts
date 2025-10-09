import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface Appointment {
  id: number;
  companyId: number;
  projectId?: number;
  datetime: string;
  status: string;
  notes?: string;
  client_name?: string;
  phone?: string;
  email?: string;
  businessType?: string;
  clientStage?: string;
  clientScore?: number;
  duration?: number;
  serviceType?: string;
  appointmentTypeId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentFormData {
  companyId: number;
  projectId?: number;
  datetime: string;
  duration?: number;
  serviceType?: string;
  notes?: string;
  client_name?: string;
  phone?: string;
  email?: string;
}

export function useAppointments(startDate?: string, endDate?: string, status?: string) {
  return useQuery({
    queryKey: ['appointments', { startDate, endDate, status }],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status) params.append('status', status);

      const response = await api.get(`/api/appointments?${params}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: async (): Promise<Appointment> => {
      const response = await api.get(`/api/appointments/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AppointmentFormData): Promise<Appointment> => {
      const response = await api.post('/api/appointments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AppointmentFormData> }): Promise<Appointment> => {
      const response = await api.put(`/api/appointments/${id}`, data);
      return response.data;
    },
    onSuccess: (updatedAppointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.setQueryData(['appointments', updatedAppointment.id], updatedAppointment);
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.post(`/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newDateTime }: { id: number; newDateTime: string }): Promise<Appointment> => {
      const response = await api.post(`/api/appointments/${id}/reschedule`, { datetime: newDateTime });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAppointmentAvailability(date: string) {
  return useQuery({
    queryKey: ['appointments', 'availability', date],
    queryFn: async () => {
      const response = await api.get(`/api/availability/${date}`);
      return response.data;
    },
    enabled: !!date,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
