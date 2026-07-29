import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Estadísticas" description="Métricas de alumnos, cursos y progreso" icon={<BarChart3 className="h-5 w-5" />} />
      <EmptyState
        title="Estadísticas avanzadas — Fase 2"
        description="Los gráficos interactivos de alumnos, finalización e ingresos se activan en la próxima fase, cuando se conecte el seguimiento de progreso."
      />
    </div>
  );
}
