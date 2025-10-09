import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { FileList, UploadConfig, TFileRecord } from "./schemas/file";

export function useUploadConfig(filename: string, contentType?: string) {
  return useQuery({
    queryKey: ["upload-config", filename, contentType],
    queryFn: async () => {
      const { data } = await api.get("/api/upload", {
        params: { filename, contentType }
      });
      return UploadConfig.parse(data);
    },
    enabled: !!filename,
  });
}

export function useProjectFiles(projectId: string) {
  return useQuery({
    queryKey: ["project-files", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/api/projects/${projectId}/files`);
      return FileList.parse(data);
    },
    enabled: !!projectId,
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      projectId,
      companyId
    }: {
      file: File;
      projectId?: string;
      companyId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) formData.append('projectId', projectId);
      if (companyId) formData.append('companyId', companyId);

      const { data } = await api.post('/api/upload/direct', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      if (variables.projectId) {
        qc.invalidateQueries({ queryKey: ["project-files", variables.projectId] });
      }
      if (variables.companyId) {
        // Invalidate company files if we had that endpoint
      }
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, fileId }: { projectId: string; fileId: string }) => {
      await api.delete(`/api/projects/${projectId}/files/${fileId}`);
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["project-files", variables.projectId] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
