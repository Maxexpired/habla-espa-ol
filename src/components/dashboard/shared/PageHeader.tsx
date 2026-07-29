import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export const PageHeader = ({ title, description, actions, icon }: PageHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
    <div className="flex items-start gap-3">
      {icon && (
        <div className="rounded-2xl bg-serene-primary/10 text-serene-primary p-2.5 shrink-0">
          {icon}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-serene-primary">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
