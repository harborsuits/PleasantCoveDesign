import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <Card className="p-12 bg-gradient-card text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 rounded-full bg-primary/10">
            <Construction className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              This feature is under development and will be available soon. Check back later!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
