import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MessageSquare, FileText, Calendar, DollarSign, Clock, File, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api/ApiClient';
import { Project, Message, Company } from '@/lib/api/types';
import StatusBadge from '@/components/StatusBadge';
import { FileUpload } from '@/components/files/FileUpload';
import { FileList } from '@/components/files/FileList';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { useInfiniteMessages } from '@/hooks/useInfiniteMessages';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id) : null;
  const queryClient = useQueryClient();
  const { token } = useAuth();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiClient.get<Project>(`/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  // Fetch company data
  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', project?.companyId],
    queryFn: async () => {
      const response = await apiClient.get<Company>(`/companies/${project?.companyId}`);
      return response.data;
    },
    enabled: !!project?.companyId,
  });

  // Fetch messages using the authenticated hook
  const {
    messages,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteMessages(projectId || 0, token || undefined);

  if (projectLoading || companyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project || !company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Project not found</div>
      </div>
    );
  }

  const progressPercentage = project.totalAmount && project.totalAmount > 0
    ? (project.paidAmount || 0) / project.totalAmount * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
          <p className="text-muted-foreground mt-1">{company.name}</p>
        </div>
        <StatusBadge status={project.status as any} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Project Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${project.totalAmount?.toLocaleString() || '0'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${project.paidAmount?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {progressPercentage.toFixed(0)}% paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${project.nextPayment?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Due {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'TBD'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {messages?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Overall completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.stage || 'Not Started'}</span>
                </div>
                <Progress value={75} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact</label>
                  <div className="mt-1">
                    <p className="text-sm">{company.email || 'No email'}</p>
                    <p className="text-sm">{company.phone || 'No phone'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Details</label>
                  <div className="mt-1">
                    <p className="text-sm">{company.industry || 'No industry'}</p>
                    <p className="text-sm">{company.website || 'No website'}</p>
                  </div>
                </div>
              </div>
              {company.tags && company.tags.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex gap-2 mt-2">
                    {company.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>Communication with {company.name}</CardDescription>
                </div>
                <Link to={`/messages/${projectId}`}>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Full Messenger
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="text-center py-8">Loading messages...</div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.slice(-10).reverse().map((message) => (
                    <div key={message.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <Badge variant={message.senderType === 'admin' ? 'default' : 'secondary'}>
                            {message.senderType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {message.attachments.map((attachment, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                File {index + 1}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>Share deliverables, assets, and documents with {company.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                projectId={projectId?.toString()}
                onUploadComplete={() => {
                  // Files list will automatically refresh via React Query
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Files</CardTitle>
              <CardDescription>All files uploaded to this project</CardDescription>
            </CardHeader>
            <CardContent>
              <FileList projectId={projectId?.toString() || ''} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <ActivityTimeline projectId={projectId?.toString()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
