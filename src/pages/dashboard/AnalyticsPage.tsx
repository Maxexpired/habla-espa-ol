import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, BookOpen, Wallet } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

const monthKey = (d: string | Date) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-CL", { month: "short", year: "2-digit" });
};

const lastMonths = (n: number) => {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
};

const COLORS = ["#0088AA", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];

export default function AnalyticsPage() {
  const [range, setRange] = useState("6");

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-data"],
    staleTime: 60_000,
    queryFn: async () => {
      const [purchases, enrollments, courses, profiles] = await Promise.all([
        supabase
          .from("purchases")
          .select("id, course_id, user_id, amount, discount_amount, payment_status, created_at, approved_at")
          .order("created_at", { ascending: false }),
        supabase.from("enrollments").select("id, user_id, course_id, status, enrolled_at, completed_at"),
        supabase.from("courses").select("id, title, published, price, created_at"),
        supabase.from("profiles").select("id, created_at"),
      ]);
      if (purchases.error) throw purchases.error;
      return {
        purchases: purchases.data ?? [],
        enrollments: enrollments.data ?? [],
        courses: courses.data ?? [],
        profiles: profiles.data ?? [],
      };
    },
  });

  const m = useMemo(() => {
    const purchases = data?.purchases ?? [];
    const enrollments = data?.enrollments ?? [];
    const courses = data?.courses ?? [];
    const profiles = data?.profiles ?? [];

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const net = (p: any) => Number(p.amount || 0) - Number(p.discount_amount || 0);
    const approved = purchases.filter((p: any) => p.payment_status === "approved");

    const purchasesToday = approved.filter((p: any) => new Date(p.created_at).getTime() >= dayStart);
    const purchasesMonth = approved.filter((p: any) => new Date(p.created_at).getTime() >= monthStart);

    const revenueTotal = approved.reduce((s: number, p: any) => s + net(p), 0);
    const revenueMonth = purchasesMonth.reduce((s: number, p: any) => s + net(p), 0);

    const months = lastMonths(Number(range));
    const salesSeries = months.map((k) => {
      const inMonth = approved.filter((p: any) => monthKey(p.created_at) === k);
      return {
        mes: monthLabel(k),
        ingresos: inMonth.reduce((s: number, p: any) => s + net(p), 0),
        compras: inMonth.length,
      };
    });

    let cumulative = 0;
    const usersSeries = months.map((k) => {
      const nuevos = profiles.filter((p: any) => monthKey(p.created_at) === k).length;
      cumulative += nuevos;
      return { mes: monthLabel(k), nuevos, acumulado: cumulative };
    });

    const growthSeries = salesSeries.map((s, i) => {
      const prev = salesSeries[i - 1]?.ingresos ?? 0;
      const pct = prev === 0 ? (s.ingresos > 0 ? 100 : 0) : ((s.ingresos - prev) / prev) * 100;
      return { mes: s.mes, crecimiento: Math.round(pct) };
    });

    const courseMap = new Map(courses.map((c: any) => [c.id, c]));
    const byCourse = new Map<string, { title: string; ventas: number; ingresos: number }>();
    approved.forEach((p: any) => {
      const c = byCourse.get(p.course_id) ?? {
        title: (courseMap.get(p.course_id) as any)?.title ?? "—",
        ventas: 0,
        ingresos: 0,
      };
      c.ventas += 1;
      c.ingresos += net(p);
      byCourse.set(p.course_id, c);
    });
    const courseRanking = [...byCourse.values()].sort((a, b) => b.ventas - a.ventas);

    const enrollmentsByCourse = new Map<string, number>();
    enrollments.forEach((e: any) =>
      enrollmentsByCourse.set(e.course_id, (enrollmentsByCourse.get(e.course_id) ?? 0) + 1)
    );
    const lowActivity = courses
      .map((c: any) => ({
        title: c.title,
        inscripciones: enrollmentsByCourse.get(c.id) ?? 0,
        ventas: byCourse.get(c.id)?.ventas ?? 0,
        published: c.published,
      }))
      .sort((a, b) => a.inscripciones + a.ventas - (b.inscripciones + b.ventas))
      .slice(0, 5);

    const statusCounts: Record<string, number> = {};
    purchases.forEach((p: any) => {
      statusCounts[p.payment_status] = (statusCounts[p.payment_status] ?? 0) + 1;
    });
    const statusLabels: Record<string, string> = {
      approved: "Aprobadas",
      pending: "Pendientes",
      rejected: "Rechazadas",
      failed: "Fallidas",
      refunded: "Reembolsadas",
    };
    const statusData = Object.entries(statusCounts).map(([k, v]) => ({
      name: statusLabels[k] ?? k,
      value: v,
    }));

    const activeEnrollments = enrollments.filter((e: any) => e.status === "active").length;
    const completedEnrollments = enrollments.filter((e: any) => e.status === "completed").length;
    const totalEnroll = enrollments.length || 1;
    const progressData = [
      { name: "Completado", value: Math.round((completedEnrollments / totalEnroll) * 100) },
      { name: "En curso", value: Math.round((activeEnrollments / totalEnroll) * 100) },
      {
        name: "Cancelado",
        value: Math.round(
          ((enrollments.length - activeEnrollments - completedEnrollments) / totalEnroll) * 100
        ),
      },
    ];

    const activeUsers = new Set(
      enrollments.filter((e: any) => e.status === "active").map((e: any) => e.user_id)
    ).size;
    const newUsers = profiles.filter((p: any) => new Date(p.created_at).getTime() >= monthStart).length;

    return {
      users: profiles.length,
      newUsers,
      activeUsers,
      publishedCourses: courses.filter((c: any) => c.published).length,
      draftCourses: courses.filter((c: any) => !c.published).length,
      activeEnrollments,
      completedEnrollments,
      purchasesToday: purchasesToday.length,
      purchasesMonth: purchasesMonth.length,
      purchasesTotal: approved.length,
      avgTicket: approved.length ? revenueTotal / approved.length : 0,
      revenueMonth,
      revenueTotal,
      salesSeries,
      usersSeries,
      growthSeries,
      courseRanking,
      lowActivity,
      statusData,
      progressData,
      hasData: purchases.length + enrollments.length + profiles.length > 0,
    };
  }, [data, range]);

  const chartCard = (title: string, children: React.ReactNode) => (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        description="Métricas de alumnos, cursos, inscripciones e ingresos"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[170px] rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {error ? (
        <EmptyState title="No se pudieron cargar las métricas" description={(error as Error).message} />
      ) : isLoading ? (
        <LoadingState rows={6} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Usuarios registrados" value={m.users} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Usuarios nuevos (mes)" value={m.newUsers} />
            <StatCard label="Usuarios activos" value={m.activeUsers} sub="Con inscripción activa" />
            <StatCard label="Ticket promedio" value={currency(Math.round(m.avgTicket))} />
            <StatCard label="Cursos publicados" value={m.publishedCourses} icon={<BookOpen className="h-4 w-4" />} />
            <StatCard label="Cursos borrador" value={m.draftCourses} />
            <StatCard label="Inscripciones activas" value={m.activeEnrollments} />
            <StatCard label="Inscripciones completadas" value={m.completedEnrollments} />
            <StatCard label="Compras hoy" value={m.purchasesToday} icon={<Wallet className="h-4 w-4" />} />
            <StatCard label="Compras del mes" value={m.purchasesMonth} />
            <StatCard label="Compras históricas" value={m.purchasesTotal} />
            <StatCard
              label="Ingresos del mes"
              value={currency(m.revenueMonth)}
              sub={`Histórico: ${currency(m.revenueTotal)}`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {chartCard(
              "Evolución de ventas",
              <AreaChart data={m.salesSeries}>
                <defs>
                  <linearGradient id="grad-ing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088AA" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0088AA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} width={70} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: any, n: any) => (n === "ingresos" ? currency(Number(v)) : v)} />
                <Area type="monotone" dataKey="ingresos" stroke="#0088AA" fill="url(#grad-ing)" />
              </AreaChart>
            )}

            {chartCard(
              "Evolución de usuarios",
              <LineChart data={m.usersSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} width={40} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nuevos" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="acumulado" stroke="#0088AA" strokeWidth={2} />
              </LineChart>
            )}

            {chartCard(
              "Crecimiento mensual (%)",
              <BarChart data={m.growthSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={12} width={45} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="crecimiento" radius={[6, 6, 0, 0]}>
                  {m.growthSeries.map((g, i) => (
                    <Cell key={i} fill={g.crecimiento >= 0 ? "#0088AA" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            )}

            {chartCard(
              "Distribución de estados de compra",
              <PieChart>
                <Pie
                  data={m.statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {m.statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}

            {chartCard(
              "Cursos más vendidos",
              <BarChart data={m.courseRanking.slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="title" width={130} fontSize={11} />
                <Tooltip />
                <Bar dataKey="ventas" fill="#0088AA" radius={[0, 6, 6, 0]} />
              </BarChart>
            )}

            {chartCard(
              "Ingresos por curso",
              <BarChart data={m.courseRanking.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="title" fontSize={10} tickFormatter={(v: string) => v.slice(0, 12)} />
                <YAxis fontSize={12} width={70} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: any) => currency(Number(v))} />
                <Bar dataKey="ingresos" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {chartCard(
              "Progreso promedio de alumnos",
              <BarChart data={m.progressData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} width={45} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {m.progressData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}

            <Card className="rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cursos con menos actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {m.lowActivity.length === 0 ? (
                  <EmptyState title="Sin cursos" description="Crea cursos para ver su actividad." />
                ) : (
                  m.lowActivity.map((c) => (
                    <div
                      key={c.title}
                      className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-sm"
                    >
                      <span className="truncate">{c.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline">{c.inscripciones} inscr.</Badge>
                        <Badge variant="secondary">{c.ventas} ventas</Badge>
                        {!c.published && <Badge variant="outline">Borrador</Badge>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
