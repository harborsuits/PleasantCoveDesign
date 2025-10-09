import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Pause, Play, Copy, Edit, Trash2, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";

export default function Outreach() {
  const [showCreator, setShowCreator] = useState(false);

  const campaigns = [
    { id: 1, name: "Summer Website Refresh", target: 45, sent: 45, opened: 32, clicked: 18, responses: 8, status: "active" },
    { id: 2, name: "New Business Outreach", target: 120, sent: 120, opened: 85, clicked: 42, responses: 15, status: "completed" },
    { id: 3, name: "Demo Follow-up", target: 28, sent: 15, opened: 12, clicked: 8, responses: 3, status: "active" },
    { id: 4, name: "Re-engagement Campaign", target: 67, sent: 0, opened: 0, clicked: 0, responses: 0, status: "paused" },
  ];

  const templates = [
    { id: 1, name: "Initial Outreach", channel: "email", opens: 245, clicks: 89, responses: 34 },
    { id: 2, name: "Demo Invitation", channel: "sms", opens: 156, clicks: 78, responses: 52 },
    { id: 3, name: "Follow-up Reminder", channel: "email", opens: 198, clicks: 67, responses: 28 },
    { id: 4, name: "Proposal Ready", channel: "sms", opens: 89, clicks: 56, responses: 41 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Outreach Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage marketing campaigns</p>
        </div>
        <Button onClick={() => setShowCreator(!showCreator)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {showCreator && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
            <CardDescription>Design a new outreach campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" placeholder="e.g., Spring Website Promotion" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-audience">Target Audience</Label>
              <Select>
                <SelectTrigger id="target-audience">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot Leads (Score 80+)</SelectItem>
                  <SelectItem value="new">New Leads</SelectItem>
                  <SelectItem value="contacted">Contacted Leads</SelectItem>
                  <SelectItem value="custom">Custom Filter...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Hi {name}, I noticed your business {business_name}..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">Use {`{name}, {business_name}, {location}`} for personalization</p>
            </div>
            <div className="flex gap-2">
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Send Now
              </Button>
              <Button variant="outline">Schedule</Button>
              <Button variant="ghost" onClick={() => setShowCreator(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
          <CardDescription>Monitor and manage your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead className="text-center">Target</TableHead>
                <TableHead className="text-center">Sent</TableHead>
                <TableHead className="text-center">Opened</TableHead>
                <TableHead className="text-center">Clicked</TableHead>
                <TableHead className="text-center">Responses</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-center">{campaign.target}</TableCell>
                  <TableCell className="text-center">{campaign.sent}</TableCell>
                  <TableCell className="text-center">{campaign.opened}</TableCell>
                  <TableCell className="text-center">{campaign.clicked}</TableCell>
                  <TableCell className="text-center font-semibold text-primary">{campaign.responses}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={campaign.status === "active" ? "default" : campaign.status === "completed" ? "secondary" : "outline"}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {campaign.status === "active" && (
                        <Button variant="ghost" size="icon"><Pause className="h-4 w-4" /></Button>
                      )}
                      {campaign.status === "paused" && (
                        <Button variant="ghost" size="icon"><Play className="h-4 w-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>Reusable templates for your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline" className="gap-1">
                      {template.channel === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {template.channel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{template.opens}</div>
                      <div className="text-xs text-muted-foreground">Opens</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{template.clicks}</div>
                      <div className="text-xs text-muted-foreground">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-primary">{template.responses}</div>
                      <div className="text-xs text-muted-foreground">Responses</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                      <Copy className="h-3 w-3" />
                      Clone
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
