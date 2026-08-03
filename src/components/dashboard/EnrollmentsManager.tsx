import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, CheckCircle2, XCircle, RotateCcw, GraduationCap, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { RowActions } from "@/components/dashboard/shared/RowActions";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  source: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  course_title: string;
}

interface PurchaseRow {
  id: string;
  amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
  course_id: string;
}

const statusTone = (status: string): "success" | "info" | "danger" | "neutral" => {
  if (status === "active") return "success";
  if (status === "completed") return "info";
  if (status === "cancelled") return "danger";
  return "neutral";
};

const statusLabels: Record<string, string> = {
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
  pending: "Pendiente",
};

const initials = (name: string | null, email: string) => {
  const source = name || email || "?";
  return source
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const EnrollmentsManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [course, setCourse] = useState("all");
  const [inspecting, setInspecting] = useState<EnrollmentRow | null>(null);

  const { data: enrollments, isLoading, error } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, status, enrolled_at, completed_at, source")
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      if (!rows?.length) return [] as EnrollmentRow[];

      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const courseIds = [...new Set(rows.map((r) => r.course_id))];
      const [{ data: profiles }, { data: courses }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, avatar_url").in("id", userIds),
        supabase.from("courses").select("id, title").in("id", courseIds),
      ]);
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const cMap = new Map((courses ?? []).map((c) => [c.id, c]));

      return rows.map((r) => ({
        ...r,
        email: pMap.get(r.user_id)?.email ?? "—",
        full_name: pMap.get(r.user_id)?.full_name ?? null,
        avatar_url: pMap.get(r.user_id)?.avatar_url ?? null,
        course_title: cMap.get(r.course_id)?.title ?? "—",
      })) as EnrollmentRow[];
    },
  });

  const { data: allCourses } = useQuery({
    queryKey: ["admin-courses-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title").order("title");
      return data ?? [];
    },
  });

  const { data: studentHistory } = useQuery({
    queryKey: ["admin-enrollments-student", inspecting?.user_id],
    enabled: !!inspecting,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("id, course_id, status, enrolled_at, completed_at")
        .eq("user_id", inspecting!.user_id)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      const courseIds = [...new Set((data ?? []).map((r) => r.course_id))];
      const { data: courses } = await supabase.from("courses").select("id, title").in("id", courseIds);
      const cMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
      return (data ?? []).map((r) => ({ ...r, course_title: cMap.get(r.course_id) ?? "—" }));
    },
  });

  const { data: studentPurchases } = useQuery({
    queryKey: ["admin-purchases-student", inspecting?.user_id],
    enabled: !!inspecting,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, amount, currency, payment_status, created_at, course_id")
        .eq("user_id", inspecting!.user_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PurchaseRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ ids, newStatus }: { ids: string[]; newStatus: string }) => {
      const { error } = await supabase
        .from("enrollments")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .in("id", ids);
      if (error) throw error;

      if (newStatus === "completed") {
        for (const enrollmentId of ids) {
          const { error: certError } = await supabase.functions.invoke("generate-certificate", {
            body: { enrollmentId },
          });
          if (certError) console.error("Certificate generation error:", certError);
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-enrollments"] });
      toast({
        title: "Estado actualizado",
        description:
          vars.newStatus === "completed"
            ? "Se generaron los certificados correspondientes."
            : `Inscripciones marcadas como ${vars.newStatus}.`,
      });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(
    () =>
      (enrollments ?? []).filter(
        (e) => (status === "all" || e.status === status) && (course === "all" || e.course_id === course)
      ),
    [enrollments, status, course]
  );

  const stats = useMemo(() => {
    const list = enrollments ?? [];
    return {
      total: list.length,
      active: list.filter((e) => e.status === "active").length,
      completed: list.filter((e) => e.status === "completed").length,
      pending: list.filter((e) => e.status === "pending").length,
      cancelled: list.filter((e) => e.status === "cancelled").length,
    };
  }, [enrollments]);

  const courseStats = useMemo(() => {
    const map = new Map<string, { title: string; total: number; active: number; completed: number }>();
    (allCourses ?? []).forEach((c: any) => map.set(c.id, { title: c.title, total: 0, active: 0, completed: 0 }));
    (enrollments ?? []).forEach((e) => {
      const s = map.get(e.course_id) ?? { title: e.course_title, total: 0, active: 0, completed: 0 };
      s.total += 1;
      if (e.status === "active") s.active += 1;
      if (e.status === "completed") s.completed += 1;
      map.set(e.course_id, s);
    });
    return [...map.entries()].map(([id, s]) => ({ id, ...s }));
  }, [enrollments, allCourses]);

  const kpis = [
    { label: "Activas", value: stats.active, icon: <Users className="h-4 w-4" />, accent: "text-emerald-600" },
    { label: "Completadas", value: stats.completed, icon: <CheckCircle2 className="h-4 w-4" />, accent: "text-blue-600" },
    { label: "Pendientes", value: stats.pending, icon: <Clock className="h-4 w-4" />, accent: "text-amber-600" },
    { label: "Canceladas", value: stats.cancelled, icon: <XCircle className="h-4 w-4" />, accent: "text-red-600" },
  ];

  const progressFor = (e: EnrollmentRow) => (e.status === "completed" ? 100 : 0);

  const rowActions = (e: EnrollmentRow) => (
    <RowActions
      actions={[
        e.status !== "completed"
          ? { label: "Completar", icon: <CheckCircle2 className="h-4 w-4" />, inline: true, onClick: () => updateStatus.mutate({ ids: [e.id], newStatus: "completed" }) }
          : { label: "Reactivar", icon: <RotateCcw className="h-4 w-4" />, inline: true, onClick: () => updateStatus.mutate({ ids: [e.id], newStatus: "active" }) },
        { label: "Reactivar", icon: <RotateCcw className="h-4 w-4" />, hidden: e.status === "completed", onClick: () => updateStatus.mutate({ ids: [e.id], newStatus: "active" }) },
        { label: "Cancelar", icon: <XCircle className="h-4 w-4" />, destructive: true, hidden: e.status === "cancelled", onClick: () => updateStatus.mutate({ ids: [e.id], newStatus: "cancelled" }) },
      ]}
    />
  );

  const renderAvatar = (e: EnrollmentRow) => (
    <Avatar className="h-9 w-9">
      <AvatarImage src={e.avatar_url ?? undefined} alt={e.full_name ?? e.email} />
      <AvatarFallback className="text-xs">{initials(e.full_name, e.email)}</AvatarFallback>
    </Avatar>
  );

  const columns: DataTableColumn<EnrollmentRow>[] = [
    {
      key: "student",
      header: "Alumno",
      sortable: true,
      value: (e) => e.full_name || e.email,
      cell: (e) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          {renderAvatar(e)}
          <div className="min-w-0">
            <p className="font-medium truncate">{e.full_name || "Sin nombre"}</p>
            <p className="text-xs text-muted-foreground truncate">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: "course_title", header: "Curso", sortable: true, value: (e) => e.course_title, cell: (e) => <span className="truncate block max-w-[220px]">{e.course_title}</span> },
    {
      key: "enrolled_at",
      header: "Fecha inscripción",
      sortable: true,
      value: (e) => e.enrolled_at,
      cell: (e) => <span className="text-xs whitespace-nowrap">{new Date(e.enrolled_at).toLocaleDateString("es-CL")}</span>,
    },
    {
      key: "last_activity",
      header: "Última actividad",
      sortable: true,
      value: (e) => e.completed_at ?? e.enrolled_at,
      cell: (e) => (
        <span className="text-xs whitespace-nowrap">
          {new Date(e.completed_at ?? e.enrolled_at).toLocaleDateString("es-CL")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      value: (e) => statusLabels[e.status] || e.status,
      cell: (e) => <StatusBadge label={statusLabels[e.status] || e.status} tone={statusTone(e.status)} />,
    },
    {
      key: "progress",
      header: "Progreso",
      value: (e) => progressFor(e),
      cell: (e) => (
        <div className="w-28 space-y-1">
          <Progress value={progressFor(e)} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">{progressFor(e)}%</span>
        </div>
      ),
    },
    { key: "source", header: "Origen", sortable: true, defaultHidden: true, value: (e) => e.source, cell: (e) => <Badge variant="outline">{e.source}</Badge> },
  ];

  return (
    <Tabs defaultValue="enrollments" className="space-y-6">
      <TabsList className="rounded-2xl">
        <TabsTrigger value="enrollments"><Users className="mr-2 h-4 w-4" />Inscripciones</TabsTrigger>
        <TabsTrigger value="stats"><BookOpen className="mr-2 h-4 w-4" />Estadísticas por curso</TabsTrigger>
      </TabsList>

      <TabsContent value="enrollments" className="space-y-4">
        <KpiGrid items={kpis} loading={isLoading} />

        <DataTable
          data={filtered}
          isLoading={isLoading}
          error={error}
          columns={columns}
          getRowId={(e) => e.id}
          searchPlaceholder="Buscar por alumno, correo o curso…"
          searchFields={(e) => [e.full_name, e.email, e.course_title]}
          exportFileName="inscripciones"
          emptyTitle="Sin inscripciones"
          emptyDescription="Aquí aparecerán los alumnos inscritos en los cursos."
          views={["table", "cards", "list"]}
          onRowClick={(row) => setInspecting(row)}
          renderCard={(e) => (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {renderAvatar(e)}
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.full_name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.email}</p>
                </div>
              </div>
              <p className="text-sm truncate">{e.course_title}</p>
              <div className="flex items-center justify-between">
                <StatusBadge label={statusLabels[e.status] || e.status} tone={statusTone(e.status)} />
                <span className="text-[11px] text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString("es-CL")}</span>
              </div>
              <Progress value={progressFor(e)} className="h-1.5" />
            </div>
          )}
          renderListItem={(e) => (
            <div className="flex items-center gap-3">
              {renderAvatar(e)}
              <div className="min-w-0">
                <p className="truncate font-medium">{e.full_name || e.email}</p>
                <p className="truncate text-xs text-muted-foreground">{e.course_title}</p>
              </div>
              <div className="ml-auto"><StatusBadge label={statusLabels[e.status] || e.status} tone={statusTone(e.status)} /></div>
            </div>
          )}
          filters={[
            {
              key: "status",
              label: "Estado",
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Activas" },
                { value: "completed", label: "Completadas" },
                { value: "pending", label: "Pendientes" },
                { value: "cancelled", label: "Canceladas" },
              ],
            },
            {
              key: "course",
              label: "Curso",
              value: course,
              onChange: setCourse,
              options: [
                { value: "all", label: "Todos los cursos" },
                ...(allCourses ?? []).map((c: any) => ({ value: c.id, label: c.title })),
              ],
            },
          ]}
          bulkActions={[
            { label: "Marcar completadas", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (rows) => updateStatus.mutate({ ids: rows.map((r) => r.id), newStatus: "completed" }) },
            { label: "Reactivar", icon: <RotateCcw className="h-4 w-4" />, onClick: (rows) => updateStatus.mutate({ ids: rows.map((r) => r.id), newStatus: "active" }) },
            { label: "Cancelar", destructive: true, icon: <XCircle className="h-4 w-4" />, onClick: (rows) => updateStatus.mutate({ ids: rows.map((r) => r.id), newStatus: "cancelled" }) },
          ]}
          rowActions={rowActions}
        />
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseStats.map((stat) => (
            <Card key={stat.id} className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total inscripciones:</span>
                  <Badge variant="outline">{stat.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Activas:</span>
                  <Badge variant="default">{stat.active}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completadas:</span>
                  <Badge variant="secondary">{stat.completed}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <Sheet open={!!inspecting} onOpenChange={(o) => !o && setInspecting(null)}>
        <SheetContent side="right" className="sm:max-w-lg w-full p-0 flex flex-col gap-0">
          {inspecting && (
            <>
              <SheetHeader className="px-6 py-4 border-b space-y-1">
                <SheetTitle>Detalle de inscripción</SheetTitle>
                <SheetDescription>Información de solo lectura del alumno.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={inspecting.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(inspecting.full_name, inspecting.email)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{inspecting.full_name || "Sin nombre"}</p>
                    <p className="text-sm text-muted-foreground truncate">{inspecting.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Curso actual</p>
                  <div className="rounded-2xl border p-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{inspecting.course_title}</span>
                    <StatusBadge label={statusLabels[inspecting.status] || inspecting.status} tone={statusTone(inspecting.status)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> Historial de inscripciones
                  </p>
                  <div className="space-y-2">
                    {(studentHistory ?? []).map((h) => (
                      <div key={h.id} className="rounded-2xl border p-3 flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{h.course_title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(h.enrolled_at).toLocaleDateString("es-CL")}</p>
                        </div>
                        <StatusBadge label={statusLabels[h.status] || h.status} tone={statusTone(h.status)} />
                      </div>
                    ))}
                    {!studentHistory?.length && <p className="text-xs text-muted-foreground">Sin historial adicional.</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Compras relacionadas</p>
                  <div className="space-y-2">
                    {(studentPurchases ?? []).map((p) => (
                      <div key={p.id} className="rounded-2xl border p-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{p.currency} {p.amount.toLocaleString("es-CL")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("es-CL")}</p>
                        </div>
                        <Badge variant="outline">{p.payment_status}</Badge>
                      </div>
                    ))}
                    {!studentPurchases?.length && <p className="text-xs text-muted-foreground">Sin compras registradas.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Tabs>
  );
};
