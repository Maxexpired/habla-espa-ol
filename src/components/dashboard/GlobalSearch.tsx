import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
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
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
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

  const { data: results = [] } = useQuery({
    queryKey: ["global-search", q],
    enabled: open && q.trim().length >= 2,
    queryFn: async (): Promise<Result[]> => {
      const term = `%${q.trim()}%`;
      const [courses, news, projects, team, faqs, profiles] = await Promise.all([
        supabase.from("courses").select("id,title").ilike("title", term).limit(5),
        supabase.from("news").select("id,title").ilike("title", term).limit(5),
        supabase.from("projects").select("id,title").ilike("title", term).limit(5),
        supabase.from("team_members").select("id,name").ilike("name", term).limit(5),
        supabase.from("faqs").select("id,question").ilike("question", term).limit(5),
        supabase.from("profiles").select("id,email,full_name").or(`email.ilike.${term},full_name.ilike.${term}`).limit(5),
      ]);
      const rs: Result[] = [];
      courses.data?.forEach((r) => rs.push({ id: r.id, label: r.title, group: "Cursos", url: `/dashboard/courses?highlight=${r.id}` }));
      news.data?.forEach((r) => rs.push({ id: r.id, label: r.title, group: "Noticias", url: `/dashboard/news?highlight=${r.id}` }));
      projects.data?.forEach((r) => rs.push({ id: r.id, label: r.title, group: "Proyectos", url: `/dashboard/projects?highlight=${r.id}` }));
      team.data?.forEach((r) => rs.push({ id: r.id, label: r.name, group: "Equipo", url: `/dashboard/team?highlight=${r.id}` }));
      faqs.data?.forEach((r) => rs.push({ id: r.id, label: r.question, group: "FAQs", url: `/dashboard/faqs?highlight=${r.id}` }));
      profiles.data?.forEach((r: any) => rs.push({ id: r.id, label: r.full_name || r.email, group: "Alumnos", url: `/dashboard/enrollments?user=${r.id}` }));
      return rs;
    },
  });

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.group] ||= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground w-full sm:w-72 justify-start"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar en todo el CMS…</span>
        <kbd className="ml-auto hidden sm:inline text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cursos, alumnos, noticias, proyectos…" value={q} onValueChange={setQ} />
        <CommandList>
          {q.trim().length < 2 ? (
            <CommandEmpty>Escribe al menos 2 caracteres.</CommandEmpty>
          ) : results.length === 0 ? (
            <CommandEmpty>Sin resultados.</CommandEmpty>
          ) : (
            Object.entries(grouped).map(([group, items], i) => (
              <div key={group}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {items.map((r) => (
                    <CommandItem
                      key={`${group}-${r.id}`}
                      value={`${group}-${r.label}-${r.id}`}
                      onSelect={() => {
                        setOpen(false);
                        navigate(r.url);
                      }}
                    >
                      {r.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
