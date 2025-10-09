import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "pending" | "completed" | "failed" | "new" | "contacted" | "qualified" | "won" | "lost";
  className?: string;
}

const statusConfig = {
  active: { label: "Active", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  completed: { label: "Completed", className: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20" },
  new: { label: "New", className: "bg-accent/10 text-accent border-accent/20" },
  contacted: { label: "Contacted", className: "bg-primary/10 text-primary border-primary/20" },
  qualified: { label: "Qualified", className: "bg-success/10 text-success border-success/20" },
  won: { label: "Won", className: "bg-success/10 text-success border-success/20" },
  lost: { label: "Lost", className: "bg-muted text-muted-foreground border-border" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
