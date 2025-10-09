import { useEffect } from 'react';
import { toast } from 'sonner';
import { useActivitySubscription } from '@/hooks/useActivities';
import { Activity } from '@/hooks/useActivities';
import { getSocket } from '@/lib/ws/SocketService';

export function ActivityToastSystem() {
  useActivitySubscription();

  useEffect(() => {
    console.log('🎧 ActivityToastSystem listening for events');

    const initSocket = async () => {
      try {
        const socket = await getSocket();
        console.log('🔌 ActivityToastSystem got socket:', !!socket, socket?.connected);

        // Listen for different types of activity events from the backend
        const handleLeadNew = (data: any) => {
          console.log('📨 Received lead.new event:', data);
          const activity: Activity = {
            id: Date.now(),
            type: 'lead:new',
            description: `New lead: ${data.lead?.first_name || 'Unknown'} ${data.lead?.last_name || ''}`.trim(),
            companyId: data.company_id,
            createdAt: new Date().toISOString(),
          };
          showActivityToast(activity);
        };

        const handleAppointmentCreated = (appointment: any) => {
          console.log('📅 Received appointment.created event:', appointment);
          const activity: Activity = {
            id: Date.now(),
            type: 'appointment:created',
            description: `New appointment: ${appointment.title || 'Untitled'}`,
            companyId: appointment.company_id,
            createdAt: new Date().toISOString(),
          };
          showActivityToast(activity);
        };

        const handleActivityNew = (activityData: any) => {
          console.log('📢 Received activity.new event:', activityData);
          // Convert backend activity format to frontend format
          const activity: Activity = {
            id: activityData.id || Date.now(),
            type: activityData.type || 'activity:new',
            description: activityData.message || activityData.description || 'New activity',
            companyId: activityData.company_id,
            projectId: activityData.project_id,
            createdAt: new Date().toISOString(),
          };
          showActivityToast(activity);
        };

        // Listen for all relevant events
        socket.on('lead.new', handleLeadNew);
        socket.on('appointment.created', handleAppointmentCreated);
        socket.on('appointment:new', handleAppointmentCreated);
        socket.on('activity:new', handleActivityNew);

        console.log('🎧 ActivityToastSystem listening for events');

      } catch (error) {
        console.error('Failed to initialize socket for ActivityToastSystem:', error);
      }
    };

    initSocket();
  }, []);

  return null; // This component doesn't render anything
}

function showActivityToast(activity: Activity) {
  const icon = getActivityIcon(activity.type);
  const title = getActivityTitle(activity.type);
  const description = activity.description;

  toast(title, {
    description,
    icon,
    duration: 5000,
    action: {
      label: 'View',
      onClick: () => {
        // Navigate to relevant page based on activity type
        handleActivityClick(activity);
      },
    },
  });
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'lead:new':
      return '🎯';
    case 'demo:viewed':
      return '👁️';
    case 'project:created':
      return '📁';
    case 'message:new':
      return '💬';
    case 'payment:received':
      return '💰';
    case 'appointment:created':
      return '📅';
    case 'appointment.updated':
      return '🔄';
    case 'appointment.deleted':
      return '❌';
    case 'file.uploaded':
      return '📎';
    case 'file.deleted':
      return '🗑️';
    case 'company.created':
      return '🏢';
    case 'company.updated':
      return '📝';
    case 'company.deleted':
      return '🗑️';
    default:
      return '📢';
  }
}

function getActivityTitle(type: string): string {
  switch (type) {
    case 'lead:new':
      return 'New Lead!';
    case 'demo:viewed':
      return 'Demo Viewed';
    case 'project:created':
      return 'Project Created';
    case 'message:new':
      return 'New Message';
    case 'payment:received':
      return 'Payment Received';
    case 'appointment:created':
      return 'Appointment Scheduled';
    case 'appointment.updated':
      return 'Appointment Updated';
    case 'appointment.deleted':
      return 'Appointment Cancelled';
    case 'file.uploaded':
      return 'File Uploaded';
    case 'file.deleted':
      return 'File Deleted';
    case 'company.created':
      return 'Company Added';
    case 'company.updated':
      return 'Company Updated';
    case 'company.deleted':
      return 'Company Removed';
    default:
      return 'Activity Update';
  }
}

function handleActivityClick(activity: Activity) {
  // Navigate to relevant page based on activity
  if (activity.projectId) {
    window.location.href = `/projects/${activity.projectId}`;
  } else if (activity.id && activity.type.startsWith('company.')) {
    // Navigate to companies page for company activities
    window.location.href = `/companies`;
  } else if (activity.id && activity.type.startsWith('appointment.')) {
    // Navigate to schedule/appointments page for appointment activities
    window.location.href = `/schedule`;
  }
}
