import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({
  title = "Sin datos todavía",
  description = "Cuando exista información aparecerá aquí.",
  icon,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 py-14 px-6 text-center">
    <div className="rounded-full bg-background p-4 text-muted-foreground shadow-sm mb-4">
      {icon ?? <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="text-base font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
