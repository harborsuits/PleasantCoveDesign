import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { CompanyList, Company, TCompany } from "./schemas/company";

export function useCompanyList(params: {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}) {
  return useQuery({
    queryKey: ["companies", params],
    queryFn: async () => {
      const { data } = await api.get("/api/companies", { params });
      return CompanyList.parse(data);
    },
    staleTime: 15_000,
    keepPreviousData: true,
  });
}

export function useCompany(id?: string) {
  return useQuery({
    queryKey: ["company", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(`/api/companies/${id}`);
      return Company.parse(data);
    },
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post(`/api/companies`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useUpdateCompany(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.put(`/api/companies/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company", id] });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/companies/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });
}
