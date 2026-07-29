import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FolderKanban,
  Newspaper,
  UserCog,
  HelpCircle,
  Wallet,
  Settings,
  Mail,
  BarChart3,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Cursos", url: "/dashboard/courses", icon: BookOpen },
  { title: "Inscripciones", url: "/dashboard/enrollments", icon: Users },
];

const contentItems = [
  { title: "Proyectos", url: "/dashboard/projects", icon: FolderKanban },
  { title: "Noticias", url: "/dashboard/news", icon: Newspaper },
  { title: "Equipo", url: "/dashboard/team", icon: UserCog },
  { title: "FAQs", url: "/dashboard/faqs", icon: HelpCircle },
];

const opsItems = [
  { title: "Finanzas", url: "/dashboard/finance", icon: Wallet },
  { title: "Estadísticas", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Correos", url: "/dashboard/emails", icon: Mail },
  { title: "Configuración", url: "/dashboard/settings", icon: Settings },
];

const footerItems = [{ title: "Ver sitio", url: "/", icon: Home }];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = item.end
              ? pathname === item.url
              : pathname === item.url || pathname.startsWith(item.url + "/");
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-4 border-b">
          {!collapsed ? (
            <div>
              <div className="text-lg font-bold text-serene-primary">Serene</div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Admin CMS
              </div>
            </div>
          ) : (
            <div className="text-lg font-bold text-serene-primary text-center">S</div>
          )}
        </div>
        {renderGroup("Principal", mainItems)}
        {renderGroup("Contenido", contentItems)}
        {renderGroup("Operaciones", opsItems)}
        {renderGroup("Sitio", footerItems)}
      </SidebarContent>
    </Sidebar>
  );
}
