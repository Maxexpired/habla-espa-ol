import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PanelTab {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

/**
 * Reusable tab system shared by dashboard modules (emails, settings) and
 * prepared for the Fase 3 editor panels.
 */
export const TabsPanel = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  className = "",
  listClassName = "",
}: {
  tabs: PanelTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  listClassName?: string;
}) => {
  if (tabs.length === 0) return null;
  const vertical = orientation === "vertical";

  return (
    <Tabs
      defaultValue={defaultValue ?? tabs[0].value}
      value={value}
      onValueChange={onValueChange}
      className={`${vertical ? "flex flex-col gap-4 md:flex-row md:items-start" : ""} ${className}`}
    >
      <TabsList
        className={`${
          vertical
            ? "flex h-auto w-full flex-row flex-wrap justify-start gap-1 rounded-2xl p-1 md:w-56 md:shrink-0 md:flex-col md:flex-nowrap"
            : "rounded-2xl"
        } ${listClassName}`}
      >
        {tabs.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={`gap-2 ${vertical ? "w-auto justify-start md:w-full" : ""}`}
          >
            {t.icon}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className={vertical ? "min-w-0 flex-1" : ""}>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0 animate-fade-in space-y-4">
            {t.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};
