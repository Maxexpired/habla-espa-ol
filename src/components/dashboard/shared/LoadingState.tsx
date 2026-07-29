import { Skeleton } from "@/components/ui/skeleton";

export const LoadingState = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
    ))}
  </div>
);
