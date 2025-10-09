import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/StatusBadge";
import { Play, Search, Star, Globe, Phone, MapPin, Flame, Eye, Mail, Presentation } from "lucide-react";

interface Lead {
  id: number;
  name: string;
  phone: string;
  website: "NO_SITE" | "HAS_SITE" | "SOCIAL_ONLY";
  rating: number;
  reviewCount: number;
  priority: "hot" | "warm" | "cold";
  stage: "new" | "contacted" | "qualified" | "won" | "lost";
  lastContact: string;
  location: string;
}

const mockLeads: Lead[] = [
  { 
    id: 1, 
    name: "Ocean View Restaurant", 
    phone: "(555) 123-4567",
    website: "NO_SITE",
    rating: 4.8,
    reviewCount: 234,
    priority: "hot",
    stage: "new",
    lastContact: "Never",
    location: "Monterey, CA"
  },
  { 
    id: 2, 
    name: "Coastal Cafe & Bakery", 
    phone: "(555) 234-5678",
    website: "SOCIAL_ONLY",
    rating: 4.6,
    reviewCount: 156,
    priority: "hot",
    stage: "contacted",
    lastContact: "2 days ago",
    location: "Santa Cruz, CA"
  },
  { 
    id: 3, 
    name: "Harbor Grill", 
    phone: "(555) 345-6789",
    website: "HAS_SITE",
    rating: 4.9,
    reviewCount: 412,
    priority: "warm",
    stage: "qualified",
    lastContact: "1 week ago",
    location: "San Francisco, CA"
  },
  { 
    id: 4, 
    name: "Bay Side Bistro", 
    phone: "(555) 456-7890",
    website: "NO_SITE",
    rating: 4.7,
    reviewCount: 89,
    priority: "hot",
    stage: "new",
    lastContact: "Never",
    location: "Carmel, CA"
  },
  { 
    id: 5, 
    name: "Lighthouse Tavern", 
    phone: "(555) 567-8901",
    website: "SOCIAL_ONLY",
    rating: 4.4,
    reviewCount: 67,
    priority: "warm",
    stage: "contacted",
    lastContact: "5 days ago",
    location: "Half Moon Bay, CA"
  },
];

const websiteStatusConfig = {
  NO_SITE: { label: "No Website", color: "bg-destructive/10 text-destructive border-destructive/20" },
  SOCIAL_ONLY: { label: "Social Only", color: "bg-warning/10 text-warning border-warning/20" },
  HAS_SITE: { label: "Has Website", color: "bg-success/10 text-success border-success/20" },
};

export default function Leads() {
  const [maxResults, setMaxResults] = useState([50]);
  const [scraping, setScraping] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lead Management</h1>
        <p className="text-muted-foreground mt-1">Discover and manage potential clients</p>
      </div>

      {/* Scraping Control Panel */}
      <Card className="p-6 bg-gradient-card border-primary/20">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Lead Scraper</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Business Type</label>
            <Select defaultValue="restaurant">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="cafe">Cafe</SelectItem>
                <SelectItem value="retail">Retail Store</SelectItem>
                <SelectItem value="service">Service Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Input placeholder="City, State" defaultValue="Monterey, CA" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Max Results: {maxResults[0]}
            </label>
            <Slider
              value={maxResults}
              onValueChange={setMaxResults}
              max={100}
              min={10}
              step={10}
              className="mt-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Action</label>
            <Button 
              className="w-full bg-gradient-primary hover:shadow-glow transition-all"
              onClick={() => {
                setScraping(true);
                setTimeout(() => setScraping(false), 3000);
              }}
              disabled={scraping}
            >
              <Play className="h-4 w-4 mr-2" />
              {scraping ? "Scraping..." : "Start Scraping"}
            </Button>
          </div>
        </div>

        {scraping && (
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary animate-pulse" style={{ width: "60%" }} />
              </div>
              <span className="text-sm font-medium text-primary">Finding leads...</span>
            </div>
          </div>
        )}
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden bg-gradient-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Leads ({mockLeads.length})</h2>
            <div className="flex gap-2">
              <Input 
                placeholder="Search leads..." 
                className="w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Website
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{lead.name}</p>
                        {lead.priority === "hot" && <Flame className="h-4 w-4 text-warning" />}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {lead.location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {lead.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={websiteStatusConfig[lead.website].color}>
                      <Globe className="h-3 w-3 mr-1" />
                      {websiteStatusConfig[lead.website].label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium text-foreground">{lead.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({lead.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      className={
                        lead.priority === "hot" 
                          ? "bg-warning/10 text-warning border-warning/20" 
                          : "bg-primary/10 text-primary border-primary/20"
                      }
                    >
                      {lead.priority.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lead.stage} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Presentation className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
