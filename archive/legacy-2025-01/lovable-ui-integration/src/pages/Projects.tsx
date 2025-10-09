import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderKanban, Clock, DollarSign, User, FileText, CheckCircle2, Circle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';

interface Project {
  id: number;
  title: string;
  type?: string;
  stage?: string;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  dueDate?: string;
  companyId?: number;
}

export default function Projects() {
  const navigate = useNavigate();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
  });

  const projects = projectsData?.items || [];

  // Mock milestones data for the timeline example
  const milestones = [
    { id: 1, title: "Initial Consultation", completed: true, date: "2025-01-15" },
    { id: 2, title: "Design Mockups", completed: true, date: "2025-01-22" },
    { id: 3, title: "Client Review", completed: true, date: "2025-01-29" },
    { id: 4, title: "Development", completed: false, date: "2025-02-15" },
    { id: 5, title: "Launch", completed: false, date: "2025-02-28" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Track and manage client projects</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">Due Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">$42k</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects.length > 0 ? (
            projects.map((project: Project) => (
              <Card key={project.id} className="bg-gradient-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Project #{project.id}
                        <span className="text-muted-foreground/50">•</span>
                        {project.type || 'Website'}
                      </CardDescription>
                    </div>
                    <StatusBadge status={project.status === 'active' ? 'active' : project.status === 'completed' ? 'completed' : 'pending'} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stage</span>
                      <span className="font-semibold text-foreground">{project.stage || 'Planning'}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Status: {project.status}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium text-foreground">${project.totalAmount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Due:</span>
                      <span className="font-medium text-foreground">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FileText className="h-3 w-3" />
                      Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No projects found
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <p className="text-muted-foreground text-center py-8">Active projects view</p>
        </TabsContent>

        <TabsContent value="completed">
          <p className="text-muted-foreground text-center py-8">Completed projects view</p>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>Project Timeline Example</CardTitle>
          <CardDescription>Harbor View Restaurant Website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, idx) => (
              <div key={milestone.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  {idx < milestones.length - 1 && (
                    <div className={`w-px h-12 ${milestone.completed ? "bg-success" : "bg-border"}`} />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${milestone.completed ? "text-foreground" : "text-muted-foreground"}`}>
                        {milestone.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{milestone.date}</p>
                    </div>
                    {milestone.completed && (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
