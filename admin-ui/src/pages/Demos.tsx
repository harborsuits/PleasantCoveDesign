import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, Edit, Trash2, TrendingUp, Presentation } from "lucide-react";

const mockDemos = [
  { 
    id: 1, 
    business: "Ocean View Restaurant", 
    created: "2 days ago",
    views: 12,
    converted: true,
    template: "Restaurant Premium"
  },
  { 
    id: 2, 
    business: "Coastal Cafe & Bakery", 
    created: "1 week ago",
    views: 8,
    converted: false,
    template: "Cafe Modern"
  },
  { 
    id: 3, 
    business: "Harbor Grill", 
    created: "2 weeks ago",
    views: 24,
    converted: true,
    template: "Restaurant Premium"
  },
  { 
    id: 4, 
    business: "Bay Side Bistro", 
    created: "3 days ago",
    views: 5,
    converted: false,
    template: "Restaurant Classic"
  },
];

export default function Demos() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Demo Gallery</h1>
          <p className="text-muted-foreground mt-1">Showcase websites for potential clients</p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow transition-all">
          <Presentation className="h-4 w-4 mr-2" />
          Generate New Demo
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Presentation className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Demos</p>
              <p className="text-2xl font-bold text-foreground">{mockDemos.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold text-foreground">50%</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent/10">
              <Eye className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold text-foreground">49</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Demo Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockDemos.map((demo) => (
          <Card key={demo.id} className="overflow-hidden bg-gradient-card hover:shadow-lg transition-all group">
            {/* Demo Preview */}
            <div className="aspect-video bg-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-primary opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Presentation className="h-12 w-12 text-primary opacity-50" />
              </div>
              {demo.converted && (
                <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                  Converted
                </Badge>
              )}
            </div>

            {/* Demo Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{demo.business}</h3>
                <p className="text-xs text-muted-foreground mt-1">{demo.template}</p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{demo.views}</span>
                  </div>
                  <span className="text-muted-foreground">{demo.created}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
