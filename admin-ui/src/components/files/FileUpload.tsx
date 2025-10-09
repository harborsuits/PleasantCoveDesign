import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUploadFile } from "@/lib/api/useFiles";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, File, CheckCircle } from "lucide-react";

interface FileUploadProps {
  projectId?: string;
  companyId?: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ projectId, companyId, onUploadComplete }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<{ file: File; progress: number; status: 'uploading' | 'success' | 'error' }[]>([]);
  const uploadFile = useUploadFile();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const fileWithProgress = { file, progress: 0, status: 'uploading' as const };
      setUploadingFiles(prev => [...prev, fileWithProgress]);

      uploadFile.mutate(
        { file, projectId, companyId },
        {
          onSuccess: (data) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.file === file
                  ? { ...f, progress: 100, status: 'success' as const }
                  : f
              )
            );
            toast({ title: "File uploaded successfully", description: data.file.filename });
            onUploadComplete?.();
          },
          onError: (error) => {
            setUploadingFiles(prev =>
              prev.map(f =>
                f.file === file
                  ? { ...f, status: 'error' as const }
                  : f
              )
            );
            toast({ title: "Upload failed", variant: "destructive" });
          }
        }
      );
    });
  }, [uploadFile, projectId, companyId, toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">Upload files</p>
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: 50MB
            </p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading files</h4>
          {uploadingFiles.map(({ file, progress, status }) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center gap-3 p-3 border rounded">
              <File className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {status === 'uploading' && (
                  <Progress value={progress} className="mt-2" />
                )}
              </div>
              {status === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
              {status === 'error' && (
                <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              {(status === 'uploading' || status === 'error') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadingFile(file)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
