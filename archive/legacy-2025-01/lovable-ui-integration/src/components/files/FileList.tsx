import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProjectFiles, useDeleteFile } from "@/lib/api/useFiles";
import { useToast } from "@/components/ui/use-toast";
import { File, Download, Trash2, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { TFileRecord } from "@/lib/api/schemas/file";

interface FileListProps {
  projectId: string;
}

export function FileList({ projectId }: FileListProps) {
  const { data: filesData, isLoading } = useProjectFiles(projectId);
  const deleteFile = useDeleteFile();
  const { toast } = useToast();

  const handleDelete = async (fileId: string, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await deleteFile.mutateAsync({ projectId, fileId });
        toast({ title: "File deleted successfully" });
      } catch (error) {
        toast({ title: "Failed to delete file", variant: "destructive" });
      }
    }
  };

  const handleDownload = (file: TFileRecord) => {
    // In a real app, this would construct the proper download URL
    // For now, we'll open the file in a new tab
    window.open(file.url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('text')) return '📝';
    return '📄';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!filesData?.items || filesData.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No files uploaded</h3>
          <p className="text-muted-foreground">
            Files uploaded to this project will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filesData.items.map((file) => (
        <Card key={file.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {getFileIcon(file.mimeType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium truncate">{file.filename}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(file.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {file.uploadedBy}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="gap-2"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(file.id, file.filename)}
                  className="text-red-600 hover:text-red-700 gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
