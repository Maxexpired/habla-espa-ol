import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  accent?: string;
}

export const StatCard = ({ label, value, sub, icon, loading, accent }: StatCardProps) => (
  <Card className="rounded-3xl">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <span className="text-serene-primary shrink-0">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24 mt-2" />
      ) : (
        <p className={`text-2xl font-bold mt-2 ${accent ?? ""}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);
