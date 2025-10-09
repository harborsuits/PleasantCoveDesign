import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export default function MetricCard({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) {
  return (
    <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold", variantStyles[variant])}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-sm font-medium flex items-center gap-1",
              trend.positive ? "text-success" : "text-destructive"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          variant === "primary" && "bg-primary/10",
          variant === "success" && "bg-success/10",
          variant === "warning" && "bg-warning/10",
          variant === "destructive" && "bg-destructive/10",
          variant === "default" && "bg-muted"
        )}>
          <Icon className={cn("h-6 w-6", variantStyles[variant])} />
        </div>
      </div>
    </Card>
  );
}
