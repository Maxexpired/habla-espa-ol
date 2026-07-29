import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { CoursesManager } from "@/components/dashboard/CoursesManager";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Gestiona el catálogo de cursos, precios y publicación"
        icon={<BookOpen className="h-5 w-5" />}
      />
      <CoursesManager />
    </div>
  );
}
