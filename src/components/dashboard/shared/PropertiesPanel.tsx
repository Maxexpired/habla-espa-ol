import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/**
 * Generic properties panel: a vertical stack of labelled fields used inside
 * the inspector. Prepared as the property editor of the Fase 3 course builder.
 */
export const PropertyGroup = ({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="space-y-3">
    {title && (
      <div className="space-y-0.5">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    )}
    <div className="space-y-3">{children}</div>
  </section>
);

export const PropertyRow = ({
  label,
  hint,
  children,
  inline,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  inline?: boolean;
}) => (
  <div className={inline ? "flex items-center justify-between gap-3" : "space-y-1.5"}>
    <div className="min-w-0">
      <Label className="text-xs">{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
    <div className={inline ? "shrink-0" : ""}>{children}</div>
  </div>
);

export const PropertyDivider = () => <Separator className="my-1" />;

/** Read-only key/value line, used for metadata blocks. */
export const PropertyMeta = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="truncate font-medium">{value}</span>
  </div>
);
