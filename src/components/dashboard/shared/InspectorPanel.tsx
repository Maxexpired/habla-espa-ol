import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface InspectorTab {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

/**
 * Reusable right-hand inspector panel (properties / settings) with an optional
 * tab system. Currently used for record details; prepared as the inspector of
 * the upcoming visual course builder (Fase 3).
 */
export const InspectorPanel = ({
  title,
  tabs,
  footer,
  className = "",
}: {
  title?: string;
  tabs: InspectorTab[];
  footer?: ReactNode;
  className?: string;
}) => {
  if (tabs.length === 0) return null;
  return (
    <aside className={`flex flex-col rounded-3xl border bg-background ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
        </div>
      )}
      <Tabs defaultValue={tabs[0].value} className="flex-1 flex flex-col min-h-0">
        <TabsList className="m-3 rounded-2xl">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollArea className="flex-1">
          {tabs.map((t) => (
            <TabsContent key={t.value} value={t.value} className="px-4 pb-4 space-y-4 mt-0">
              {t.content}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
      {footer && <div className="border-t p-3">{footer}</div>}
    </aside>
  );
};
