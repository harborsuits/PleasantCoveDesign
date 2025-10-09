import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAppointments, useDeleteAppointment } from "@/lib/api/useAppointments";
import { TAppointment } from "@/lib/api/schemas/appointment";
import AppointmentForm from "./AppointmentForm";
import { Plus, CalendarDays } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup the localizer for date-fns
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { enUS },
});

// Custom event component for the calendar
function EventComponent({ event }: { event: TAppointment & { resource?: any } }) {
  const getEventColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-gray-500';
    if (status === 'tentative') return 'bg-yellow-500';

    switch (type) {
      case 'consultation': return 'bg-blue-500';
      case 'review': return 'bg-green-500';
      case 'meeting': return 'bg-purple-500';
      case 'launch': return 'bg-orange-500';
      case 'followup': return 'bg-indigo-500';
      case 'presentation': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`text-white text-xs p-1 rounded ${getEventColor(event.type, event.status)}`}>
      <div className="font-medium truncate">{event.title}</div>
      <div className="opacity-90">{event.location}</div>
    </div>
  );
}

export default function AppointmentsPage() {
  const [currentView, setCurrentView] = useState(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TAppointment | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<TAppointment | null>(null);
  const { toast } = useToast();

  const { data: appointmentsData, isLoading } = useAppointments({
    startDate: format(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1), 'yyyy-MM-dd'),
    endDate: format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0), 'yyyy-MM-dd'),
  });

  const deleteAppointment = useDeleteAppointment();

  // Convert appointments to calendar events
  const events = useMemo(() => {
    if (!appointmentsData?.items) return [];

    return appointmentsData.items.map((appt: TAppointment) => ({
      ...appt,
      start: new Date(appt.start),
      end: new Date(appt.end),
    }));
  }, [appointmentsData]);

  const handleEventClick = (event: TAppointment) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Create new appointment with selected time slot
    const newAppointment: Partial<TAppointment> = {
      start: start.toISOString(),
      end: end.toISOString(),
      title: "New Appointment",
      type: "meeting",
      status: "confirmed",
      source: "manual",
    };
    setEditingAppointment(newAppointment as TAppointment);
    setShowCreateModal(true);
  };

  const handleEditAppointment = (appointment: TAppointment) => {
    setEditingAppointment(appointment);
    setShowEditModal(true);
  };

  const handleDeleteAppointment = async (appointment: TAppointment) => {
    if (confirm(`Are you sure you want to delete "${appointment.title}"?`)) {
      try {
        await deleteAppointment.mutateAsync(appointment.id);
        toast({ title: "Appointment deleted successfully" });
      } catch (error) {
        toast({ title: "Failed to delete appointment", variant: "destructive" });
      }
    }
  };

  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingAppointment(null);
    toast({ title: "Appointment saved successfully" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            Appointments & Schedule
          </h1>
          <p className="text-muted-foreground mt-1">Manage your appointments and client meetings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>
            Click on any appointment to view details, or click on empty time slots to create new appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectEvent={handleEventClick}
              onSelectSlot={handleSelectSlot}
              selectable
              components={{
                event: EventComponent,
              }}
              className="rbc-calendar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{selectedEvent.type}</Badge>
                  <Badge variant={selectedEvent.status === 'confirmed' ? 'default' : 'secondary'}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Start:</span>
                  <p>{format(new Date(selectedEvent.start), 'PPP p')}</p>
                </div>
                <div>
                  <span className="font-medium">End:</span>
                  <p>{format(new Date(selectedEvent.end), 'PPP p')}</p>
                </div>
              </div>

              {selectedEvent.location && (
                <div>
                  <span className="font-medium">Location:</span>
                  <p>{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.attendees.length > 0 && (
                <div>
                  <span className="font-medium">Attendees:</span>
                  <ul className="mt-1 list-disc list-inside">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <li key={index}>{attendee}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleEditAppointment(selectedEvent)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAppointment(selectedEvent)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editingAppointment}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={editingAppointment}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
