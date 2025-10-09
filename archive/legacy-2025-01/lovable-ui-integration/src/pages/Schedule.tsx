import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, Video, Phone, MapPin, Plus, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function Schedule() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const appointments = [
    {
      id: 1,
      title: "Discovery Call - Harbor View",
      client: "Harbor View Restaurant",
      time: "10:00 AM - 11:00 AM",
      type: "video",
      status: "confirmed",
      date: "Today",
      link: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: 2,
      title: "Design Review - Coastal Cafe",
      client: "Coastal Cafe",
      time: "2:00 PM - 3:00 PM",
      type: "video",
      status: "confirmed",
      date: "Today",
      link: "https://meet.google.com/xyz-uvwx-yzz",
    },
    {
      id: 3,
      title: "Project Kickoff - Seaside Boutique",
      client: "Seaside Boutique",
      time: "11:00 AM - 12:00 PM",
      type: "phone",
      status: "pending",
      date: "Tomorrow",
      link: null,
    },
    {
      id: 4,
      title: "Follow-up - Marina Yoga",
      client: "Marina Yoga Studio",
      time: "3:00 PM - 3:30 PM",
      type: "video",
      status: "confirmed",
      date: "Dec 20",
      link: "https://meet.google.com/abc-defg-hij",
    },
  ];

  const availabilitySlots = [
    { day: "Monday", slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
    { day: "Tuesday", slots: ["10:00 AM", "1:00 PM", "3:00 PM"] },
    { day: "Wednesday", slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
    { day: "Thursday", slots: ["10:00 AM", "1:00 PM", "3:00 PM"] },
    { day: "Friday", slots: ["9:00 AM", "11:00 AM", "1:00 PM"] },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage appointments and bookings</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled meetings and calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{apt.title}</h3>
                      <p className="text-sm text-muted-foreground">{apt.client}</p>
                    </div>
                    <Badge variant={apt.status === "confirmed" ? "default" : "outline"}>
                      {apt.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{apt.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{apt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {apt.type === "video" ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      <span className="capitalize">{apt.type} call</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {apt.link && (
                      <Button size="sm" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Join Meeting
                      </Button>
                    )}
                    <Button variant="outline" size="sm">Reschedule</Button>
                    <Button variant="outline" size="sm">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="text-xl font-bold text-foreground">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-xl font-bold text-foreground">34</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="text-xl font-bold text-warning">5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="availability" className="space-y-4">
        <TabsList>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="widget">Booking Widget</TabsTrigger>
        </TabsList>

        <TabsContent value="availability">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>Set your available time slots for client bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availabilitySlots.map((day) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <div className="w-32 font-medium text-foreground">{day.day}</div>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {day.slots.map((slot, idx) => (
                        <Badge key={idx} variant="outline" className="px-3 py-1">
                          {slot}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widget">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Client Booking Widget</CardTitle>
              <CardDescription>Share this link with clients to let them book appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border border-border rounded-lg bg-accent/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Book a Consultation</h3>
                      <p className="text-sm text-muted-foreground">Pleasant Cove Design</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">Discovery Call - 30min</Button>
                    <Button variant="outline" size="sm">Design Review - 45min</Button>
                    <Button variant="outline" size="sm">Project Kickoff - 60min</Button>
                    <Button variant="outline" size="sm">Follow-up - 15min</Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Input value="https://booking.pleasantcove.com/schedule" readOnly />
                <Button variant="outline">Copy Link</Button>
              </div>
              <Button className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Booking Page
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
