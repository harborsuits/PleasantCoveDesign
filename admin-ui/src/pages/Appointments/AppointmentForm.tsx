import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAppointment, useUpdateAppointment } from "@/lib/api/useAppointments";
import { TAppointment } from "@/lib/api/schemas/appointment";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const Schema = z.object({
  title: z.string().min(1, "Title is required"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  type: z.enum(["consultation", "review", "meeting", "launch", "followup", "presentation"]),
  status: z.enum(["confirmed", "tentative", "cancelled", "completed"]),
  source: z.enum(["manual", "acuity", "squarespace", "calendar"]),
  location: z.string().optional(),
  description: z.string().optional(),
  attendees: z.string().optional(), // Comma-separated for UI
});

type FormData = z.infer<typeof Schema>;

interface AppointmentFormProps {
  appointment?: TAppointment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AppointmentForm({ appointment, onSuccess, onCancel }: AppointmentFormProps) {
  const { toast } = useToast();
  const create = useCreateAppointment();
  const update = useUpdateAppointment(appointment?.id || "");

  const form = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      title: appointment?.title || "",
      start: appointment?.start ? format(new Date(appointment.start), "yyyy-MM-dd'T'HH:mm") : "",
      end: appointment?.end ? format(new Date(appointment.end), "yyyy-MM-dd'T'HH:mm") : "",
      type: appointment?.type || "meeting",
      status: appointment?.status || "confirmed",
      source: appointment?.source || "manual",
      location: appointment?.location || "",
      description: appointment?.description || "",
      attendees: appointment?.attendees?.join(", ") || "",
    },
  });

  const onSubmit = async (values: FormData) => {
    const payload = {
      ...values,
      attendees: values.attendees ? values.attendees.split(",").map(s => s.trim()).filter(Boolean) : [],
      start: new Date(values.start).toISOString(),
      end: new Date(values.end).toISOString(),
    };

    try {
      if (appointment?.id) {
        await update.mutateAsync(payload);
        toast({ title: "Appointment updated successfully" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Appointment created successfully" });
      }
      onSuccess();
    } catch (error) {
      toast({ title: "Error saving appointment", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input placeholder="Appointment title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Start Time *</label>
          <Input type="datetime-local" {...form.register("start")} />
          {form.formState.errors.start && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.start.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">End Time *</label>
          <Input type="datetime-local" {...form.register("end")} />
          {form.formState.errors.end && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.end.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="launch">Launch</SelectItem>
              <SelectItem value="followup">Follow-up</SelectItem>
              <SelectItem value="presentation">Presentation</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="tentative">Tentative</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Source</label>
          <Select
            value={form.watch("source")}
            onValueChange={(value) => form.setValue("source", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="acuity">Acuity</SelectItem>
              <SelectItem value="squarespace">Squarespace</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Location</label>
          <Input placeholder="Meeting location" {...form.register("location")} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Attendees</label>
        <Input placeholder="Comma separated names" {...form.register("attendees")} />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea placeholder="Appointment details..." {...form.register("description")} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={create.isPending || update.isPending}
        >
          {appointment?.id ? "Update Appointment" : "Create Appointment"}
        </Button>
      </div>
    </form>
  );
}
