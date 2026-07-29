import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { TeamManager } from "@/components/dashboard/TeamManager";
import { UserCog } from "lucide-react";

export default function TeamPage() {
  return (
    <div>
      <PageHeader title="Equipo" description="Miembros que aparecen en el sitio" icon={<UserCog className="h-5 w-5" />} />
      <TeamManager />
    </div>
  );
}
