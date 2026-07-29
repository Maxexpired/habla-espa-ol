import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { FAQsManager } from "@/components/dashboard/FAQsManager";
import { HelpCircle } from "lucide-react";

export default function FaqsPage() {
  return (
    <div>
      <PageHeader title="Preguntas frecuentes" description="Ayuda pública del sitio" icon={<HelpCircle className="h-5 w-5" />} />
      <FAQsManager />
    </div>
  );
}
