import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labels: Record<string, string> = {
  dashboard: "Panel",
  courses: "Cursos",
  enrollments: "Inscripciones",
  projects: "Proyectos",
  news: "Noticias",
  team: "Equipo",
  faqs: "FAQs",
  finance: "Finanzas",
  analytics: "Estadísticas",
  emails: "Correos",
  settings: "Configuración",
};

/** Contextual breadcrumbs; also ready for nested Fase 3 builder routes. */
export const DashboardBreadcrumbs = () => {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {parts.map((part, i) => {
          const href = "/" + parts.slice(0, i + 1).join("/");
          const label = labels[part] || decodeURIComponent(part);
          const last = i === parts.length - 1;
          return (
            <BreadcrumbItem key={href}>
              {last ? (
                <BreadcrumbPage className="text-xs">{label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild className="text-xs">
                    <Link to={href}>{label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
