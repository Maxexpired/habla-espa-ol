import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { ProjectsManager } from "@/components/dashboard/ProjectsManager";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader title="Proyectos" description="Portfolio de proyectos publicados" icon={<FolderKanban className="h-5 w-5" />} />
      <ProjectsManager />
    </div>
  );
}
