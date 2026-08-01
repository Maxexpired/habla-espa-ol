import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { StatCard } from "@/components/dashboard/shared/StatCard";

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
  course_title: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    active: { label: "Activo", variant: "default" },
    completed: { label: "Completado", variant: "secondary" },
    cancelled: { label: "Cancelado", variant: "outline" },
  };
  const m = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

export const EnrollmentsManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [course, setCourse] = useState("all");

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
        supabase.from("profiles").select("id, email, full_name").in("id", userIds),
        supabase.from("courses").select("id, title").in("id", courseIds),
      ]);
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const cMap = new Map((courses ?? []).map((c) => [c.id, c]));

      return rows.map((r) => ({
        ...r,
        email: pMap.get(r.user_id)?.email ?? "—",
        full_name: pMap.get(r.user_id)?.full_name ?? null,
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

  const columns: DataTableColumn<EnrollmentRow>[] = [
    {
      key: "student",
      header: "Alumno",
      sortable: true,
      value: (e) => e.full_name || e.email,
      cell: (e) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{e.full_name || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground truncate">{e.email}</p>
        </div>
      ),
    },
    { key: "course_title", header: "Curso", sortable: true, value: (e) => e.course_title, cell: (e) => <span className="truncate block max-w-[220px]">{e.course_title}</span> },
    { key: "status", header: "Estado", sortable: true, value: (e) => e.status, cell: (e) => statusBadge(e.status) },
    { key: "source", header: "Origen", sortable: true, defaultHidden: true, value: (e) => e.source, cell: (e) => <Badge variant="outline">{e.source}</Badge> },
    {
      key: "enrolled_at",
      header: "Inscrito",
      sortable: true,
      value: (e) => e.enrolled_at,
      cell: (e) => <span className="text-xs whitespace-nowrap">{new Date(e.enrolled_at).toLocaleDateString("es-CL")}</span>,
    },
    {
      key: "completed_at",
      header: "Completado",
      sortable: true,
      defaultHidden: true,
      value: (e) => e.completed_at ?? "",
      cell: (e) => (
        <span className="text-xs whitespace-nowrap">
          {e.completed_at ? new Date(e.completed_at).toLocaleDateString("es-CL") : "—"}
        </span>
      ),
    },
  ];

  return (
    <Tabs defaultValue="enrollments" className="space-y-6">
      <TabsList className="rounded-2xl">
        <TabsTrigger value="enrollments"><Users className="mr-2 h-4 w-4" />Inscripciones</TabsTrigger>
        <TabsTrigger value="stats"><BookOpen className="mr-2 h-4 w-4" />Estadísticas por curso</TabsTrigger>
      </TabsList>

      <TabsContent value="enrollments" className="space-y-4">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} loading={isLoading} />
          <StatCard label="Activas" value={stats.active} accent="text-emerald-600" loading={isLoading} />
          <StatCard label="Completadas" value={stats.completed} accent="text-serene-primary" loading={isLoading} />
          <StatCard label="Canceladas" value={stats.cancelled} accent="text-red-600" loading={isLoading} />
        </div>

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
          rowActions={(e) => (
            <>
              {e.status === "active" ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ ids: [e.id], newStatus: "completed" })}>
                    Completar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ ids: [e.id], newStatus: "cancelled" })}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ ids: [e.id], newStatus: "active" })}>
                  Reactivar
                </Button>
              )}
            </>
          )}
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
    </Tabs>
  );
};
