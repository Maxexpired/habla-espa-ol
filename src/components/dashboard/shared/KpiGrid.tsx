import { ReactNode } from "react";
import { StatCard } from "./StatCard";

export interface KpiItem {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: string;
}

/** Module level KPI strip rendered above every data table. */
export const KpiGrid = ({
  items,
  loading,
  columns = 4,
}: {
  items: KpiItem[];
  loading?: boolean;
  columns?: 3 | 4 | 5;
}) => {
  const cols =
    columns === 5
      ? "sm:grid-cols-3 lg:grid-cols-5"
      : columns === 3
      ? "sm:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-3 grid-cols-2 ${cols} mb-4 animate-fade-in`}>
      {items.map((k) => (
        <StatCard
          key={k.label}
          label={k.label}
          value={k.value}
          sub={k.sub}
          icon={k.icon}
          accent={k.accent}
          loading={loading}
        />
      ))}
    </div>
  );
};
