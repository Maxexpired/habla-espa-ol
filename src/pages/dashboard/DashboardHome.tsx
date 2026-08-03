import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Users,
  Wallet,
  ArrowUpRight,
  LayoutDashboard,
  SlidersHorizontal,
  CalendarClock,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { RecentActivity, SystemStatus } from "@/components/dashboard/SystemOverview";
import {
  WidgetCard,
  RecentPurchasesWidget,
  RecentCoursesWidget,
  RecentNewsWidget,
  RecentProjectsWidget,
  NewUsersWidget,
  EmailsWidget,
  StorageWidget,
  QuickActionsWidget,
} from "@/components/dashboard/widgets/HomeWidgets";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

/* ---------------------------- extra widgets ---------------------------- */

const UpcomingPublicationsWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-upcoming-news"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, scheduled_at")
        .eq("published", false)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <WidgetCard title="Próximas publicaciones" icon={<CalendarClock className="h-4 w-4" />} to="/dashboard/news">
      {isLoading ? (
        <LoadingState rows={2} />
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">No hay contenido programado.</p>
      ) : (
        <ul className="divide-y">
          {data.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
              <p className="truncate text-sm font-medium">{n.title}</p>
              <StatusBadge
                label={new Date(n.scheduled_at as string).toLocaleDateString("es-CL")}
                tone="info"
              />
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};

const TopCoursesWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-top-courses"],
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: purchases }, { data: courses }] = await Promise.all([
        supabase.from("purchases").select("course_id, amount, discount_amount").eq("payment_status", "approved"),
        supabase.from("courses").select("id, title"),
      ]);
      const map = new Map((courses ?? []).map((c) => [c.id, c.title]));
      const agg = new Map<string, { sales: number; revenue: number }>();
      for (const p of purchases ?? []) {
        const cur = agg.get(p.course_id) ?? { sales: 0, revenue: 0 };
        cur.sales += 1;
        cur.revenue += Number(p.amount || 0) - Number(p.discount_amount || 0);
        agg.set(p.course_id, cur);
      }
      return [...agg.entries()]
        .map(([id, v]) => ({ id, title: map.get(id) ?? "Curso", ...v }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);
    },
  });

  return (
    <WidgetCard title="Cursos más vendidos" icon={<Trophy className="h-4 w-4" />} to="/dashboard/finance">
      {isLoading ? (
        <LoadingState rows={3} />
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">Aún no hay ventas aprobadas.</p>
      ) : (
        <ul className="divide-y">
          {data.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{c.title}</p>
              <div className="text-right">
                <p className="text-sm font-semibold">{currency(c.revenue)}</p>
                <p className="text-[11px] text-muted-foreground">{c.sales} ventas</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
};

/* ----------------------------- home page ------------------------------ */

const WIDGETS = [
  { key: "purchases", label: "Últimas compras", node: <RecentPurchasesWidget />, span: 1 },
  { key: "topCourses", label: "Cursos más vendidos", node: <TopCoursesWidget />, span: 1 },
  { key: "quick", label: "Accesos rápidos", node: <QuickActionsWidget />, span: 1 },
  { key: "courses", label: "Cursos recientes", node: <RecentCoursesWidget />, span: 1 },
  { key: "news", label: "Noticias recientes", node: <RecentNewsWidget />, span: 1 },
  { key: "upcoming", label: "Próximas publicaciones", node: <UpcomingPublicationsWidget />, span: 1 },
  { key: "projects", label: "Proyectos recientes", node: <RecentProjectsWidget />, span: 1 },
  { key: "users", label: "Usuarios nuevos", node: <NewUsersWidget />, span: 1 },
  { key: "emails", label: "Correos", node: <EmailsWidget />, span: 1 },
  { key: "storage", label: "Storage", node: <StorageWidget />, span: 1 },
  { key: "activity", label: "Actividad reciente", node: <RecentActivity />, span: 1 },
  { key: "system", label: "Estado del sistema", node: <SystemStatus />, span: 1 },
] as const;

const STORAGE_KEY = "serene:dashboard:widgets";

export default function DashboardHome() {
  const [hidden, setHidden] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-home-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [courses, publishedCourses, enrollments, activeEnrollments, purchasesMonth, purchasesAll] =
        await Promise.all([
          supabase.from("courses").select("id", { count: "exact", head: true }),
          supabase.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
          supabase.from("enrollments").select("id", { count: "exact", head: true }),
          supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase
            .from("purchases")
            .select("amount, discount_amount, payment_status, created_at")
            .gte("created_at", monthStart),
          supabase.from("purchases").select("id", { count: "exact", head: true }).eq("payment_status", "approved"),
        ]);

      const monthApproved = (purchasesMonth.data || []).filter((p) => p.payment_status === "approved");
      const monthRevenue = monthApproved.reduce(
        (s, p) => s + Number(p.amount || 0) - Number(p.discount_amount || 0),
        0
      );

      return {
        courses: courses.count || 0,
        publishedCourses: publishedCourses.count || 0,
        enrollments: enrollments.count || 0,
        activeEnrollments: activeEnrollments.count || 0,
        monthRevenue,
        monthApprovedCount: monthApproved.length,
        totalApprovedCount: purchasesAll.count || 0,
      };
    },
  });

  const kpis = [
    {
      label: "Cursos publicados",
      value: stats ? `${stats.publishedCourses}/${stats.courses}` : "—",
      icon: <BookOpen className="h-4 w-4" />,
      accent: "text-serene-primary",
    },
    {
      label: "Inscripciones activas",
      value: stats ? stats.activeEnrollments : "—",
      sub: stats ? `${stats.enrollments} totales` : undefined,
      icon: <Users className="h-4 w-4" />,
      accent: "text-blue-600",
    },
    {
      label: "Ingresos del mes",
      value: stats ? currency(stats.monthRevenue) : "—",
      sub: stats ? `${stats.monthApprovedCount} compras aprobadas` : undefined,
      icon: <Wallet className="h-4 w-4" />,
      accent: "text-emerald-600",
    },
    {
      label: "Ventas aprobadas",
      value: stats ? stats.totalApprovedCount : "—",
      icon: <ArrowUpRight className="h-4 w-4" />,
      accent: "text-purple-600",
    },
  ];

  const visible = WIDGETS.filter((w) => !hidden.includes(w.key));

  return (
    <div>
      <PageHeader
        title="Panel de administración"
        description="Centro de control de Serene"
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/dashboard/analytics">Ver estadísticas</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-2xl">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Widgets
                  <Badge variant="outline" className="ml-2 rounded-lg text-[10px]">
                    {visible.length}/{WIDGETS.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel>Mostrar widgets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WIDGETS.map((w) => (
                  <DropdownMenuCheckboxItem
                    key={w.key}
                    checked={!hidden.includes(w.key)}
                    onCheckedChange={() => toggle(w.key)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {w.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <KpiGrid items={kpis} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 animate-fade-in">
        {visible.map((w) => (
          <div key={w.key}>{w.node}</div>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Todos los widgets están ocultos. Actívalos desde el menú «Widgets».
        </p>
      )}
    </div>
  );
}
