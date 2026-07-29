import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { EnrollmentsManager } from "@/components/dashboard/EnrollmentsManager";
import { Users } from "lucide-react";

export default function EnrollmentsPage() {
  return (
    <div>
      <PageHeader
        title="Inscripciones"
        description="Alumnos inscritos y estado de sus cursos"
        icon={<Users className="h-5 w-5" />}
      />
      <EnrollmentsManager />
    </div>
  );
}
