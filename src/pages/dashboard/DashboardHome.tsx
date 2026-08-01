import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Wallet,
  Newspaper,
  FolderKanban,
  UserCog,
  HelpCircle,
  Plus,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { RecentActivity, SystemStatus } from "@/components/dashboard/SystemOverview";


const currency = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function DashboardHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-home-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [courses, publishedCourses, enrollments, activeEnrollments, purchasesMonth, purchasesAll, news, projects] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("purchases").select("amount, discount_amount, payment_status, created_at").gte("created_at", monthStart),
        supabase.from("purchases").select("id", { count: "exact", head: true }).eq("payment_status", "approved"),
        supabase.from("news").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);

      const monthApproved = (purchasesMonth.data || []).filter((p) => p.payment_status === "approved");
      const monthRevenue = monthApproved.reduce((s, p) => s + Number(p.amount || 0) - Number(p.discount_amount || 0), 0);

      return {
        courses: courses.count || 0,
        publishedCourses: publishedCourses.count || 0,
        enrollments: enrollments.count || 0,
        activeEnrollments: activeEnrollments.count || 0,
        monthRevenue,
        monthApprovedCount: monthApproved.length,
        totalApprovedCount: purchasesAll.count || 0,
        news: news.count || 0,
        projects: projects.count || 0,
      };
    },
  });

  const { data: recentEnrollments } = useQuery({
    queryKey: ["dashboard-recent-enrollments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, status, enrolled_at")
        .order("enrolled_at", { ascending: false })
        .limit(5);
      if (!data?.length) return [];
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const courseIds = [...new Set(data.map((d) => d.course_id))];
      const [{ data: profiles }, { data: courses }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name").in("id", userIds),
        supabase.from("courses").select("id, title").in("id", courseIds),
      ]);
      const pMap = new Map((profiles || []).map((p) => [p.id, p]));
      const cMap = new Map((courses || []).map((c) => [c.id, c]));
      return data.map((d) => ({
        ...d,
        user: pMap.get(d.user_id),
        course: cMap.get(d.course_id),
      }));
    },
  });

  const { data: recentPurchases } = useQuery({
    queryKey: ["dashboard-recent-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, user_id, course_id, amount, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const kpis = [
    { label: "Cursos publicados", value: stats ? `${stats.publishedCourses}/${stats.courses}` : "—", icon: BookOpen, color: "text-serene-primary" },
    { label: "Inscripciones activas", value: stats ? `${stats.activeEnrollments}` : "—", sub: stats ? `${stats.enrollments} totales` : undefined, icon: Users, color: "text-blue-600" },
    { label: "Ingresos del mes", value: stats ? currency(stats.monthRevenue) : "—", sub: stats ? `${stats.monthApprovedCount} compras aprobadas` : undefined, icon: Wallet, color: "text-emerald-600" },
    { label: "Ventas aprobadas totales", value: stats ? `${stats.totalApprovedCount}` : "—", icon: ArrowUpRight, color: "text-purple-600" },
  ];

  const quickActions = [
    { label: "Nuevo curso", url: "/dashboard/courses", icon: BookOpen },
    { label: "Nueva noticia", url: "/dashboard/news", icon: Newspaper },
    { label: "Nuevo proyecto", url: "/dashboard/projects", icon: FolderKanban },
    { label: "Nuevo miembro", url: "/dashboard/team", icon: UserCog },
    { label: "Nueva FAQ", url: "/dashboard/faqs", icon: HelpCircle },
  ];

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      approved: { label: "Aprobada", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-700 border-amber-200" },
      rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700 border-red-200" },
      failed: { label: "Fallida", cls: "bg-red-100 text-red-700 border-red-200" },
      refunded: { label: "Reembolsada", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    };
    const m = map[s] || { label: s, cls: "bg-muted text-foreground" };
    return <Badge variant="outline" className={m.cls}>{m.label}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Panel de administración"
        description="Resumen general de la actividad de Serene"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold mt-2">{k.value}</p>
                  {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
                </div>
                <div className={`rounded-2xl bg-muted p-2 ${k.color}`}>
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Inscripciones recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentEnrollments ? (
              <LoadingState rows={3} />
            ) : recentEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin inscripciones aún.</p>
            ) : (
              <ul className="divide-y">
                {recentEnrollments.map((e: any) => (
                  <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.course?.title ?? "Curso"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {e.user?.full_name || e.user?.email || "Alumno"} · {new Date(e.enrolled_at).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    <Badge variant="outline">{e.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((a) => (
              <Button key={a.url} asChild variant="outline" className="justify-start rounded-2xl">
                <Link to={a.url}>
                  <Plus className="h-4 w-4 mr-2" />
                  <a.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  {a.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Compras recientes</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link to="/dashboard/finance">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || !recentPurchases ? (
            <LoadingState rows={3} />
          ) : recentPurchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin compras registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2">Fecha</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map((p: any) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2">{new Date(p.created_at).toLocaleString("es-CL")}</td>
                      <td>{currency(Number(p.amount || 0))}</td>
                      <td>{statusBadge(p.payment_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3 mt-6">
        <RecentActivity />
        <SystemStatus />
      </div>
    </div>

  );
}
