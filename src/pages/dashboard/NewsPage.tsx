import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { NewsManager } from "@/components/dashboard/NewsManager";
import { Newspaper } from "lucide-react";

export default function NewsPage() {
  return (
    <div>
      <PageHeader title="Noticias" description="Publicaciones y anuncios" icon={<Newspaper className="h-5 w-5" />} />
      <NewsManager />
    </div>
  );
}
