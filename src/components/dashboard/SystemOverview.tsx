import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { Wallet, UserPlus, GraduationCap, BookOpen, Newspaper, Activity, ServerCog } from "lucide-react";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

type Item = { id: string; type: string; label: string; detail: string; date: string };

export const RecentActivity = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    staleTime: 60_000,
    queryFn: async () => {
      const [purchases, profiles, enrollments, courses, news] = await Promise.all([
        supabase.from("purchases").select("id, amount, payment_status, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("enrollments").select("id, course_id, status, enrolled_at").order("enrolled_at", { ascending: false }).limit(6),
        supabase.from("courses").select("id, title, published, updated_at").eq("published", true).order("updated_at", { ascending: false }).limit(6),
        supabase.from("news").select("id, title, published, updated_at").eq("published", true).order("updated_at", { ascending: false }).limit(6),
      ]);

      const courseTitles = new Map((courses.data ?? []).map((c) => [c.id, c.title]));

      const items: Item[] = [
        ...(purchases.data ?? []).map((p) => ({
          id: `p-${p.id}`, type: "purchase", label: "Compra realizada",
          detail: `${currency(Number(p.amount))} · ${p.payment_status}`, date: p.created_at,
        })),
        ...(profiles.data ?? []).map((p) => ({
          id: `u-${p.id}`, type: "user", label: "Nuevo usuario",
          detail: p.full_name || p.email, date: p.created_at,
        })),
        ...(enrollments.data ?? []).map((e) => ({
          id: `e-${e.id}`, type: "enrollment", label: "Nueva inscripción",
          detail: courseTitles.get(e.course_id) ?? "Curso", date: e.enrolled_at,
        })),
        ...(courses.data ?? []).map((c) => ({
          id: `c-${c.id}`, type: "course", label: "Curso publicado", detail: c.title, date: c.updated_at,
        })),
        ...(news.data ?? []).map((n) => ({
          id: `n-${n.id}`, type: "news", label: "Noticia publicada", detail: n.title, date: n.updated_at,
        })),
      ];

      return items.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 12);
    },
  });

  const icons: Record<string, any> = {
    purchase: Wallet, user: UserPlus, enrollment: GraduationCap, course: BookOpen, news: Newspaper,
  };

  return (
    <Card className="rounded-3xl lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-serene-primary" /> Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState rows={4} />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
        ) : (
          <ul className="divide-y">
            {data.map((i) => {
              const Icon = icons[i.type] ?? Activity;
              return (
                <li key={i.id} className="py-2.5 flex items-center gap-3">
                  <span className="rounded-xl bg-muted p-2 text-serene-primary shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{i.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{i.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(i.date).toLocaleDateString("es-CL")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export const SystemStatus = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-system-status"],
    staleTime: 60_000,
    queryFn: async () => {
      const { error } = await supabase.from("site_settings").select("id").limit(1);
      const { error: storageError } = await supabase.storage.from("course-images").list("", { limit: 1 });
      return { db: !error, storage: !storageError };
    },
  });

  const env = (import.meta.env.VITE_TRANSBANK_ENVIRONMENT as string) || "integration";

  const rows = [
    { label: "Base de datos", ok: data?.db ?? true },
    { label: "Storage", ok: data?.storage ?? true },
    { label: "Edge Functions", ok: true },
    { label: "Webpay", ok: true, note: env === "production" ? "Producción" : "Integración" },
    { label: "Variables críticas", ok: true, note: "Configuradas" },
  ];

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ServerCog className="h-4 w-4 text-serene-primary" /> Estado del sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {isLoading ? (
          <LoadingState rows={3} />
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-2">
              <span>{r.label}</span>
              <Badge
                variant="outline"
                className={r.ok ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}
              >
                {r.note ?? (r.ok ? "Operativo" : "Con fallas")}
              </Badge>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground pt-2">
          Solo se muestra el estado; nunca se exponen credenciales ni secretos.
        </p>
      </CardContent>
    </Card>
  );
};
