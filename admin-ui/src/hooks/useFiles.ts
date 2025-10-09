import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  signedUrl?: string;
  projectId?: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function useProjectFiles(projectId: number) {
  return useQuery({
    queryKey: ['files', 'project', projectId],
    queryFn: async () => {
      const response = await api.get(`/api/projects/${projectId}/files`);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUploadUrl(projectId: number, filename: string) {
  return useQuery({
    queryKey: ['files', 'uploadUrl', projectId, filename],
    queryFn: async () => {
      const response = await api.get(`/api/projects/${projectId}/upload-url`, {
        params: { filename },
      });
      return response.data;
    },
    enabled: !!(projectId && filename),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      onProgress,
    }: {
      projectId: number;
      file: File;
      onProgress?: (progress: UploadProgress) => void;
    }): Promise<FileUpload> => {
      // First get the upload URL
      const uploadUrlResponse = await api.get(`/api/projects/${projectId}/upload-url`, {
        params: { filename: file.name },
      });

      const { uploadUrl, fileId } = uploadUrlResponse.data;

      // Upload the file directly to R2/signed URL
      const formData = new FormData();
      // Add any required form fields based on your backend
      formData.append('file', file);

      const uploadResponse = await api.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
            };
            onProgress(progress);
          }
        },
      });

      // Register the file with the backend
      const fileData = {
        id: fileId,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: uploadResponse.data.url,
        projectId,
      };

      const registerResponse = await api.post(`/api/projects/${projectId}/files`, fileData);
      return registerResponse.data;
    },
    onSuccess: (uploadedFile) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['files', 'project', uploadedFile.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', uploadedFile.projectId] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, fileId }: { projectId: number; fileId: string }): Promise<void> => {
      await api.delete(`/api/projects/files/${fileId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files', 'project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
    },
  });
}

export function useFileDownload(fileId: string) {
  return useQuery({
    queryKey: ['files', 'download', fileId],
    queryFn: async () => {
      const response = await api.get(`/api/files/${fileId}/download`);
      return response.data;
    },
    enabled: !!fileId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Utility hook for multiple file uploads with progress tracking
export function useBatchUpload(projectId: number) {
  const uploadFile = useUploadFile();

  const uploadFiles = async (
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, file: FileUpload) => void
  ): Promise<FileUpload[]> => {
    const results: FileUpload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadFile.mutateAsync({
          projectId,
          file,
          onProgress: onProgress ? (progress) => onProgress(i, progress) : undefined,
        });
        results.push(result);
        onFileComplete?.(i, result);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  };

  return {
    uploadFiles,
    isUploading: uploadFile.isPending,
    error: uploadFile.error,
  };
}
