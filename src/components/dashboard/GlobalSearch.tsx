import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Newspaper,
  FolderKanban,
  UserCog,
  HelpCircle,
  Users,
  Clock,
  LayoutDashboard,
  Wallet,
  BarChart3,
  Mail,
  Settings,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Result {
  id: string;
  label: string;
  group: string;
  url: string;
  hint?: string;
}

const GROUP_ICON: Record<string, typeof BookOpen> = {
  Cursos: BookOpen,
  Noticias: Newspaper,
  Proyectos: FolderKanban,
  Equipo: UserCog,
  FAQs: HelpCircle,
  Alumnos: Users,
};

const PAGES: Result[] = [
  { id: "p-home", label: "Panel de administración", group: "Ir a", url: "/dashboard" },
  { id: "p-courses", label: "Cursos", group: "Ir a", url: "/dashboard/courses" },
  { id: "p-enroll", label: "Inscripciones", group: "Ir a", url: "/dashboard/enrollments" },
  { id: "p-news", label: "Noticias", group: "Ir a", url: "/dashboard/news" },
  { id: "p-projects", label: "Proyectos", group: "Ir a", url: "/dashboard/projects" },
  { id: "p-team", label: "Equipo", group: "Ir a", url: "/dashboard/team" },
  { id: "p-faqs", label: "Preguntas frecuentes", group: "Ir a", url: "/dashboard/faqs" },
  { id: "p-finance", label: "Panel financiero", group: "Ir a", url: "/dashboard/finance" },
  { id: "p-analytics", label: "Estadísticas", group: "Ir a", url: "/dashboard/analytics" },
  { id: "p-emails", label: "Correos", group: "Ir a", url: "/dashboard/emails" },
  { id: "p-settings", label: "Configuración", group: "Ir a", url: "/dashboard/settings" },
];

const PAGE_ICON: Record<string, typeof BookOpen> = {
  "p-home": LayoutDashboard,
  "p-courses": BookOpen,
  "p-enroll": Users,
  "p-news": Newspaper,
  "p-projects": FolderKanban,
  "p-team": UserCog,
  "p-faqs": HelpCircle,
  "p-finance": Wallet,
  "p-analytics": BarChart3,
  "p-emails": Mail,
  "p-settings": Settings,
};

const RECENTS_KEY = "serene:dashboard:recent-search";

const readRecents = (): Result[] => {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as Result[]) : [];
  } catch {
    return [];
  }
};

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [recents, setRecents] = useState<Result[]>(readRecents);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (e.key === "/" && (e.target as HTMLElement)?.tagName === "INPUT") return;
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-search", q],
    enabled: open && q.trim().length >= 2,
    queryFn: async (): Promise<Result[]> => {
      const term = `%${q.trim()}%`;
      const [courses, news, projects, team, faqs, profiles] = await Promise.all([
        supabase.from("courses").select("id,title,published").ilike("title", term).limit(5),
        supabase.from("news").select("id,title,published").ilike("title", term).limit(5),
        supabase.from("projects").select("id,title,published").ilike("title", term).limit(5),
        supabase.from("team_members").select("id,name,role").ilike("name", term).limit(5),
        supabase.from("faqs").select("id,question,category").ilike("question", term).limit(5),
        supabase
          .from("profiles")
          .select("id,email,full_name")
          .or(`email.ilike.${term},full_name.ilike.${term}`)
          .limit(5),
      ]);
      const state = (p?: boolean) => (p ? "Publicado" : "Borrador");
      const rs: Result[] = [];
      courses.data?.forEach((r) =>
        rs.push({ id: r.id, label: r.title, group: "Cursos", hint: state(r.published), url: `/dashboard/courses?highlight=${r.id}` })
      );
      news.data?.forEach((r) =>
        rs.push({ id: r.id, label: r.title, group: "Noticias", hint: state(r.published), url: `/dashboard/news?highlight=${r.id}` })
      );
      projects.data?.forEach((r) =>
        rs.push({ id: r.id, label: r.title, group: "Proyectos", hint: state(r.published), url: `/dashboard/projects?highlight=${r.id}` })
      );
      team.data?.forEach((r) =>
        rs.push({ id: r.id, label: r.name, group: "Equipo", hint: r.role ?? undefined, url: `/dashboard/team?highlight=${r.id}` })
      );
      faqs.data?.forEach((r) =>
        rs.push({ id: r.id, label: r.question, group: "FAQs", hint: r.category ?? undefined, url: `/dashboard/faqs?highlight=${r.id}` })
      );
      profiles.data?.forEach((r) =>
        rs.push({ id: r.id, label: r.full_name || r.email, group: "Alumnos", hint: r.email, url: `/dashboard/enrollments?user=${r.id}` })
      );
      return rs;
    },
  });

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    if (r.group !== "Ir a") {
      const next = [r, ...recents.filter((x) => x.id !== r.id)].slice(0, 5);
      setRecents(next);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
    navigate(r.url);
  };

  const renderItem = (r: Result, Icon: typeof BookOpen) => (
    <CommandItem key={`${r.group}-${r.id}`} value={`${r.group}-${r.label}-${r.id}`} onSelect={() => go(r)}>
      <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{r.label}</span>
      {r.hint && <span className="ml-2 truncate text-xs text-muted-foreground">{r.hint}</span>}
      <CornerDownLeft className="ml-auto h-3 w-3 shrink-0 opacity-0 aria-selected:opacity-60" />
    </CommandItem>
  );

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.group] ||= []).push(r);
    return acc;
  }, {});

  const searching = q.trim().length >= 2;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start gap-2 text-muted-foreground sm:w-72"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar en todo el CMS…</span>
        <kbd className="ml-auto hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cursos, alumnos, noticias, proyectos…" value={q} onValueChange={setQ} />
        <CommandList>
          {!searching ? (
            <>
              {recents.length > 0 && (
                <>
                  <CommandGroup heading="Recientes">
                    {recents.map((r) => renderItem(r, Clock))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup heading="Ir a">
                {PAGES.map((p) => renderItem(p, PAGE_ICON[p.id] ?? LayoutDashboard))}
              </CommandGroup>
            </>
          ) : results.length === 0 ? (
            <CommandEmpty>{isFetching ? "Buscando…" : "Sin resultados."}</CommandEmpty>
          ) : (
            Object.entries(grouped).map(([group, items], i) => (
              <div key={group}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {items.map((r) => renderItem(r, GROUP_ICON[group] ?? Search))}
                </CommandGroup>
              </div>
            ))
          )}
        </CommandList>
        <div className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>Esc cerrar</span>
          <span className="ml-auto">Ctrl+N nuevo · Ctrl+S guardar</span>
        </div>
      </CommandDialog>
    </>
  );
};
