import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { AppointmentList, Appointment, TAppointment } from "./schemas/appointment";

export function useAppointments(params?: {
  startDate?: string;
  endDate?: string;
  project_id?: string;
  company_id?: string;
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: async () => {
      const { data } = await api.get("/api/appointments/calendar", { params });
      return AppointmentList.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });
}

export function useAppointment(id?: string) {
  return useQuery({
    queryKey: ["appointment", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/api/appointments/${id}`);
      return Appointment.parse(data);
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post(`/api/appointments`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useUpdateAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.put(`/api/appointments/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment", id] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/appointments/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}
