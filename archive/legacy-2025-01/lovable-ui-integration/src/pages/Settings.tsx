import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, Key, Mail, MessageSquare, MapPin, CreditCard, Users, Shield, Plus, Edit, Trash2 } from "lucide-react";

export default function Settings() {
  const teamMembers = [
    { id: 1, name: "John Doe", email: "john@pleasantcove.com", role: "Admin", status: "active" },
    { id: 2, name: "Sarah Miller", email: "sarah@pleasantcove.com", role: "Designer", status: "active" },
    { id: 3, name: "Alex Lee", email: "alex@pleasantcove.com", role: "Developer", status: "active" },
  ];

  const templates = [
    { id: 1, name: "Initial Outreach", type: "Email", lastEdited: "2 days ago" },
    { id: 2, name: "Demo Follow-up", type: "SMS", lastEdited: "1 week ago" },
    { id: 3, name: "Proposal Ready", type: "Email", lastEdited: "3 days ago" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your system</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-lg bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  PC
                </div>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input id="company" defaultValue="Pleasant Cove Design" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="admin@pleasantcove.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://pleasantcove.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue="123 Harbor Street, Coastal City, CA 90210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Company Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={4}
                  defaultValue="Pleasant Cove Design creates beautiful, modern websites for coastal businesses. We specialize in helping restaurants, boutiques, and service businesses establish a strong online presence."
                />
              </div>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-4">
            <Card className="bg-gradient-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Stripe</CardTitle>
                    <CardDescription>Accept payments and manage subscriptions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-key">API Key</Label>
                  <Input id="stripe-key" type="password" placeholder="sk_live_..." />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch id="stripe-enabled" />
                    <Label htmlFor="stripe-enabled">Enable Stripe Integration</Label>
                  </div>
                  <Button variant="outline">Test Connection</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Twilio</CardTitle>
                    <CardDescription>Send SMS messages to leads and clients</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilio-sid">Account SID</Label>
                    <Input id="twilio-sid" placeholder="AC..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twilio-token">Auth Token</Label>
                    <Input id="twilio-token" type="password" placeholder="..." />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="twilio-enabled" />
                  <Label htmlFor="twilio-enabled">Enable Twilio Integration</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>SendGrid</CardTitle>
                    <CardDescription>Send email campaigns and notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sendgrid-key">API Key</Label>
                  <Input id="sendgrid-key" type="password" placeholder="SG..." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="sendgrid-enabled" defaultChecked />
                  <Label htmlFor="sendgrid-enabled">Enable SendGrid Integration</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Google Maps</CardTitle>
                    <CardDescription>Enable location-based lead scraping</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maps-key">API Key</Label>
                  <Input id="maps-key" type="password" placeholder="AIza..." />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="maps-enabled" defaultChecked />
                  <Label htmlFor="maps-enabled">Enable Google Maps Integration</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage your team and permissions</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant={member.role === "Admin" ? "default" : "secondary"}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{member.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card mt-4">
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Configure what each role can access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Admin</p>
                    <p className="text-sm text-muted-foreground">Full access to all features</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Designer</p>
                    <p className="text-sm text-muted-foreground">Can manage projects and demos</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Developer</p>
                    <p className="text-sm text-muted-foreground">Can manage projects and technical settings</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Message Templates</CardTitle>
                  <CardDescription>Create and manage email/SMS templates</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Edited</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{template.lastEdited}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage authentication and access control</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Login Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified of new logins</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Label>Change Password</Label>
                <div className="space-y-3">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                  <Input type="password" placeholder="Confirm new password" />
                  <Button className="gap-2">
                    <Key className="h-4 w-4" />
                    Update Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
