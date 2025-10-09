import { useUnifiedActivities } from "@/lib/api/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  MessageSquare,
  Calendar,
  File,
  Building2,
  FolderKanban,
  User,
  Clock
} from "lucide-react";

interface ActivityTimelineProps {
  projectId?: string;
  companyId?: string;
  limit?: number;
}

export function ActivityTimeline({ projectId, companyId, limit = 50 }: ActivityTimelineProps) {
  const { data: activitiesData, isLoading } = useUnifiedActivities(projectId, companyId, limit);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'file': return <File className="h-4 w-4" />;
      case 'company': return <Building2 className="h-4 w-4" />;
      case 'project': return <FolderKanban className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-500';
      case 'appointment': return 'bg-green-500';
      case 'file': return 'bg-purple-500';
      case 'company': return 'bg-orange-500';
      case 'project': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activitiesData?.items || activitiesData.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-muted-foreground">
              Activity from messages, appointments, and file uploads will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activitiesData.items.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{activity.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>

                  {activity.metadata && (
                    <div className="flex gap-2">
                      {activity.metadata.hasAttachments && (
                        <Badge variant="outline" className="text-xs">
                          Has attachments
                        </Badge>
                      )}
                      {activity.metadata.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.status}
                        </Badge>
                      )}
                      {activity.metadata.filename && (
                        <span className="truncate max-w-32">
                          {activity.metadata.filename}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
