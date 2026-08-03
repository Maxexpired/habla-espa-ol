import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Three-column editor shell (library / canvas / inspector).
 * Base layout for the Fase 3 visual course builder; usable today for any
 * full-screen editing experience inside the dashboard.
 */
export const EditorLayout = ({
  toolbar,
  left,
  children,
  right,
  leftTitle,
  className = "",
}: {
  toolbar?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  leftTitle?: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-4 ${className}`}>
    {toolbar}
    <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
      {left && (
        <aside className="hidden rounded-3xl border bg-background lg:block">
          {leftTitle && (
            <div className="border-b px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{leftTitle}</p>
            </div>
          )}
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-2 p-3">{left}</div>
          </ScrollArea>
        </aside>
      )}

      <section className="min-h-[60vh] rounded-3xl border bg-background p-4 lg:p-6">{children}</section>

      {right && <div className="hidden lg:block">{right}</div>}
    </div>
  </div>
);
