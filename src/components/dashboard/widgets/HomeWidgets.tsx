import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import {
  BookOpen,
  Newspaper,
  FolderKanban,
  UserCog,
  HelpCircle,
  Plus,
  Wallet,
  Mail,
  UserPlus,
  HardDrive,
  ArrowUpRight,
} from "lucide-react";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

const fdate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("es-CL") : "—");

/** Shared shell so every home widget looks identical and can be re-ordered. */
export const WidgetCard = ({
  title,
  icon,
  to,
  toLabel = "Ver todo",
  className = "",
  children,
}: {
  title: string;
  icon?: ReactNode;
  to?: string;
  toLabel?: string;
  className?: string;
  children: ReactNode;
}) => (
  <Card className={`rounded-3xl transition-shadow hover:shadow-sm ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="flex items-center gap-2 text-base">
        {icon && <span className="text-serene-primary">{icon}</span>}
        {title}
      </CardTitle>
      {to && (
        <Button asChild size="sm" variant="ghost" className="text-xs">
          <Link to={to}>
            {toLabel} <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const List = ({
  loading,
  empty,
  children,
}: {
  loading: boolean;
  empty: boolean;
  children: ReactNode;
}) =>
  loading ? <LoadingState rows={3} /> : empty ? (
    <p className="text-sm text-muted-foreground">Sin registros todavía.</p>
  ) : (
    <ul className="divide-y">{children}</ul>
  );

/* ------------------------------------------------------------------ */

export const RecentPurchasesWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-recent-purchases"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, amount, discount_amount, payment_status, created_at, course_id")
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data?.length) return [];
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", [...new Set(data.map((d) => d.course_id))]);
      const map = new Map((courses ?? []).map((c) => [c.id, c.title]));
      return data.map((d) => ({ ...d, title: map.get(d.course_id) ?? "Curso" }));
    },
  });

  const tone = (s: string) =>
    s === "approved" ? "success" : s === "pending" ? "warning" : s === "refunded" ? "info" : "danger";

  return (
    <WidgetCard title="Últimas compras" icon={<Wallet className="h-4 w-4" />} to="/dashboard/finance">
      <List loading={isLoading} empty={!data?.length}>
        {(data ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{fdate(p.created_at)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-semibold">{currency(Number(p.amount) - Number(p.discount_amount || 0))}</span>
              <StatusBadge label={statusLabels[p.payment_status] ?? p.payment_status} tone={tone(p.payment_status) as never} />
            </div>
          </li>
        ))}
      </List>
    </WidgetCard>
  );
};

export const RecentCoursesWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-recent-courses"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, published, price, is_free, updated_at, image_url")
        .order("updated_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <WidgetCard title="Cursos recientes" icon={<BookOpen className="h-4 w-4" />} to="/dashboard/courses">
      <List loading={isLoading} empty={!data?.length}>
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-2.5">
            <img
              src={c.image_url || "/placeholder.svg"}
              alt=""
              loading="lazy"
              className="h-9 w-9 rounded-xl border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.title}</p>
              <p className="text-xs text-muted-foreground">
                {c.is_free ? "Gratis" : currency(Number(c.price))} · {fdate(c.updated_at)}
              </p>
            </div>
            <StatusBadge label={c.published ? "Publicado" : "Borrador"} tone={c.published ? "success" : "muted"} />
          </li>
        ))}
      </List>
    </WidgetCard>
  );
};

export const RecentNewsWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-recent-news"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, published, scheduled_at, created_at, image_url")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <WidgetCard title="Noticias recientes" icon={<Newspaper className="h-4 w-4" />} to="/dashboard/news">
      <List loading={isLoading} empty={!data?.length}>
        {(data ?? []).map((n) => (
          <li key={n.id} className="flex items-center gap-3 py-2.5">
            <img src={n.image_url || "/placeholder.svg"} alt="" loading="lazy" className="h-9 w-9 rounded-xl border object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{fdate(n.created_at)}</p>
            </div>
            <StatusBadge
              label={n.published ? "Publicada" : n.scheduled_at ? "Programada" : "Borrador"}
              tone={n.published ? "success" : n.scheduled_at ? "info" : "muted"}
            />
          </li>
        ))}
      </List>
    </WidgetCard>
  );
};

export const RecentProjectsWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-recent-projects"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, published, category, created_at, image_url")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <WidgetCard title="Proyectos recientes" icon={<FolderKanban className="h-4 w-4" />} to="/dashboard/projects">
      <List loading={isLoading} empty={!data?.length}>
        {(data ?? []).map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <img src={p.image_url || "/placeholder.svg"} alt="" loading="lazy" className="h-9 w-9 rounded-xl border object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {p.category ? `${p.category} · ` : ""}
                {fdate(p.created_at)}
              </p>
            </div>
            <StatusBadge label={p.published ? "Publicado" : "Borrador"} tone={p.published ? "success" : "muted"} />
          </li>
        ))}
      </List>
    </WidgetCard>
  );
};

export const NewUsersWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-new-users"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  return (
    <WidgetCard title="Usuarios nuevos" icon={<UserPlus className="h-4 w-4" />}>
      <List loading={isLoading} empty={!data?.length}>
        {(data ?? []).map((u) => (
          <li key={u.id} className="flex items-center gap-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-serene-primary/15 text-xs font-semibold text-serene-primary">
              {(u.full_name || u.email || "?")[0].toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.full_name || "Sin nombre"}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <span className="text-xs text-muted-foreground">{fdate(u.created_at)}</span>
          </li>
        ))}
      </List>
    </WidgetCard>
  );
};

export const EmailsWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-emails"],
    staleTime: 60_000,
    queryFn: async () => {
      const [{ data: logs }, { count: templates }] = await Promise.all([
        supabase.from("email_logs").select("status").limit(1000),
        supabase.from("email_templates").select("id", { count: "exact", head: true }),
      ]);
      const list = logs ?? [];
      return {
        sent: list.filter((l) => l.status === "sent").length,
        failed: list.filter((l) => l.status === "failed" || l.status === "error").length,
        pending: list.filter((l) => l.status === "pending").length,
        templates: templates ?? 0,
      };
    },
  });

  return (
    <WidgetCard title="Correos" icon={<Mail className="h-4 w-4" />} to="/dashboard/emails">
      {isLoading ? (
        <LoadingState rows={2} />
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Enviados</p>
            <p className="mt-1 text-xl font-bold">{data?.sent ?? 0}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Errores</p>
            <p className="mt-1 text-xl font-bold text-destructive">{data?.failed ?? 0}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-xl font-bold">{data?.pending ?? 0}</p>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Plantillas</p>
            <p className="mt-1 text-xl font-bold">{data?.templates ?? 0}</p>
          </div>
        </div>
      )}
    </WidgetCard>
  );
};

export const StorageWidget = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-storage"],
    staleTime: 300_000,
    queryFn: async () => {
      const buckets = ["course-images", "project-images", "news-images", "team-images"];
      const results = await Promise.all(
        buckets.map(async (b) => {
          const { data, error } = await supabase.storage.from(b).list("", { limit: 1000 });
          const files = error ? [] : data ?? [];
          const size = files.reduce(
            (s, f) => s + Number((f as { metadata?: { size?: number } }).metadata?.size ?? 0),
            0
          );
          return { bucket: b, files: files.length, size, ok: !error };
        })
      );
      const total = results.reduce((s, r) => s + r.size, 0);
      return { results, total };
    },
  });

  const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const quota = 1024 * 1024 * 1024; // 1 GB reference

  return (
    <WidgetCard title="Espacio de Storage" icon={<HardDrive className="h-4 w-4" />}>
      {isLoading ? (
        <LoadingState rows={3} />
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-xl font-bold">{mb(data?.total ?? 0)}</p>
              <p className="text-xs text-muted-foreground">de 1 GB de referencia</p>
            </div>
            <Progress value={Math.min(100, ((data?.total ?? 0) / quota) * 100)} className="mt-2 h-1.5" />
          </div>
          <ul className="space-y-1.5 text-xs">
            {(data?.results ?? []).map((r) => (
              <li key={r.bucket} className="flex items-center justify-between gap-2">
                <span className="truncate text-muted-foreground">{r.bucket}</span>
                <span className="whitespace-nowrap">
                  {r.files} archivos · {mb(r.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetCard>
  );
};

export const QuickActionsWidget = () => {
  const actions = [
    { label: "Nuevo curso", url: "/dashboard/courses", icon: BookOpen },
    { label: "Nueva noticia", url: "/dashboard/news", icon: Newspaper },
    { label: "Nuevo proyecto", url: "/dashboard/projects", icon: FolderKanban },
    { label: "Nuevo miembro", url: "/dashboard/team", icon: UserCog },
    { label: "Nueva FAQ", url: "/dashboard/faqs", icon: HelpCircle },
  ];

  return (
    <WidgetCard title="Accesos rápidos" icon={<Plus className="h-4 w-4" />}>
      <div className="grid gap-2">
        {actions.map((a) => (
          <Button key={a.url} asChild variant="outline" className="justify-start rounded-2xl">
            <Link to={a.url}>
              <a.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {a.label}
              <Badge variant="outline" className="ml-auto rounded-lg text-[10px]">
                Ctrl+N
              </Badge>
            </Link>
          </Button>
        ))}
      </div>
    </WidgetCard>
  );
};
