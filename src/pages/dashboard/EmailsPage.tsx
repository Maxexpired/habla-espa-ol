import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Mail } from "lucide-react";

export default function EmailsPage() {
  return (
    <div>
      <PageHeader title="Correos" description="Plantillas y registro de envíos" icon={<Mail className="h-5 w-5" />} />
      <EmptyState
        title="Módulo de correos — Fase 2"
        description="Aquí administrarás plantillas, previsualización, envíos de prueba e historial. Se habilita cuando se integre el proveedor de email."
      />
    </div>
  );
}
