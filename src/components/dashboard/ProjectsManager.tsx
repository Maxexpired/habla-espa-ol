import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  gallery: string[] | null;
  category: string | null;
  status: string;
  featured: boolean;
  website_url: string | null;
  repo_url: string | null;
  sort_order: number;
  published: boolean;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  image_url: "",
  gallery: "",
  category: "",
  status: "active",
  featured: false,
  website_url: "",
  repo_url: "",
  sort_order: 0,
  published: false,
};

const statusLabels: Record<string, string> = {
  active: "En curso",
  completed: "Finalizado",
  paused: "En pausa",
  archived: "Archivado",
};

export const ProjectsManager = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pubFilter, setPubFilter] = useState("all");
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload("project-images");
  const qc = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["cms-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Project[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cms-projects"] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url || null,
        gallery: formData.gallery.split("\n").map((s) => s.trim()).filter(Boolean),
        category: formData.category || null,
        status: formData.status,
        featured: formData.featured,
        website_url: formData.website_url || null,
        repo_url: formData.repo_url || null,
        sort_order: Number(formData.sort_order) || 0,
        published: formData.published,
      };
      const { error } = editing
        ? await supabase.from("projects").update(payload).eq("id", editing)
        : await supabase.from("projects").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: editing ? "Proyecto actualizado" : "Proyecto creado" });
      setOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("projects").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Proyectos eliminados" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setPublished = useMutation({
    mutationFn: async ({ ids, published }: { ids: string[]; published: boolean }) => {
      const { error } = await supabase.from("projects").update({ published }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditing(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p.id);
    setFormData({
      title: p.title,
      description: p.description,
      image_url: p.image_url || "",
      gallery: (p.gallery || []).join("\n"),
      category: p.category || "",
      status: p.status || "active",
      featured: p.featured,
      website_url: p.website_url || "",
      repo_url: p.repo_url || "",
      sort_order: p.sort_order ?? 0,
      published: p.published,
    });
    setOpen(true);
  };

  const filtered = (projects || []).filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (pubFilter === "published" && !p.published) return false;
    if (pubFilter === "draft" && p.published) return false;
    if (pubFilter === "featured" && !p.featured) return false;
    return true;
  });

  const columns: DataTableColumn<Project>[] = [
    {
      key: "title",
      header: "Proyecto",
      sortable: true,
      value: (r) => r.title,
      cell: (r) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <img src={r.image_url || "/placeholder.svg"} alt={r.title} className="h-10 w-10 rounded-xl object-cover border" />
          <div className="min-w-0">
            <p className="font-medium truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground truncate">{r.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      sortable: true,
      value: (r) => r.category || "",
      cell: (r) => (r.category ? <Badge variant="outline">{r.category}</Badge> : "—"),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      value: (r) => statusLabels[r.status] || r.status,
      cell: (r) => <Badge variant="outline">{statusLabels[r.status] || r.status}</Badge>,
    },
    {
      key: "published",
      header: "Publicación",
      sortable: true,
      value: (r) => (r.published ? "Publicado" : "Borrador"),
      cell: (r) =>
        r.published ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Publicado</Badge>
        ) : (
          <Badge variant="secondary">Borrador</Badge>
        ),
    },
    {
      key: "featured",
      header: "Destacado",
      value: (r) => (r.featured ? "Sí" : "No"),
      cell: (r) => (r.featured ? <Badge variant="outline">Sí</Badge> : "—"),
      defaultHidden: true,
    },
    {
      key: "links",
      header: "Enlaces",
      value: (r) => [r.website_url, r.repo_url].filter(Boolean).join(" | "),
      cell: (r) => (
        <div className="flex gap-2">
          {r.website_url && (
            <a href={r.website_url} target="_blank" rel="noreferrer" className="text-serene-primary inline-flex items-center gap-1 text-xs">
              Sitio <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {r.repo_url && (
            <a href={r.repo_url} target="_blank" rel="noreferrer" className="text-serene-primary inline-flex items-center gap-1 text-xs">
              Repo <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!r.website_url && !r.repo_url && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: "sort_order",
      header: "Orden",
      sortable: true,
      value: (r) => r.sort_order ?? 0,
      cell: (r) => r.sort_order ?? 0,
      defaultHidden: true,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        error={error}
        getRowId={(r) => r.id}
        exportFileName="proyectos"
        searchPlaceholder="Buscar proyectos..."
        searchFields={(r) => [r.title, r.description, r.category]}
        filters={[
          {
            key: "status",
            label: "Estado",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "Todos los estados" },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
            ],
          },
          {
            key: "pub",
            label: "Publicación",
            value: pubFilter,
            onChange: setPubFilter,
            options: [
              { value: "all", label: "Todos" },
              { value: "published", label: "Publicados" },
              { value: "draft", label: "Borradores" },
              { value: "featured", label: "Destacados" },
            ],
          },
        ]}
        toolbarActions={
          <Button size="sm" className="rounded-2xl" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo proyecto
          </Button>
        }
        bulkActions={[
          { label: "Publicar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), published: true }) },
          { label: "Despublicar", icon: <XCircle className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), published: false }) },
          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: (rows) => setToDelete(rows.map((r) => r.id)) },
        ]}
        rowActions={(r) => (
          <>
            <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setToDelete([r.id])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        emptyTitle="Sin proyectos"
        emptyAction={<Button onClick={openNew} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Nuevo proyecto</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Ej: Educación" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sitio web</Label>
                <Input value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Repositorio</Label>
                <Input value={formData.repo_url} onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })} placeholder="https://github.com/..." />
              </div>
            </div>

            <ImageUploadField
              label="Imagen principal"
              imageUrl={formData.image_url}
              uploading={uploading}
              onFileSelect={async (file) => {
                try {
                  const url = await uploadImage(file);
                  if (url) setFormData((f) => ({ ...f, image_url: url }));
                } catch {
                  toast({ title: "Error al subir imagen", variant: "destructive" });
                }
              }}
              onClear={() => setFormData({ ...formData, image_url: "" })}
            />

            <div className="space-y-2">
              <Label>Galería</Label>
              <ImageUploadField
                label="Agregar imagen a la galería"
                imageUrl=""
                uploading={uploading}
                onFileSelect={async (file) => {
                  try {
                    const url = await uploadImage(file);
                    if (url) setFormData((f) => ({ ...f, gallery: f.gallery ? `${f.gallery}\n${url}` : url }));
                  } catch {
                    toast({ title: "Error al subir imagen", variant: "destructive" });
                  }
                }}
                onClear={() => {}}
              />
              <Textarea rows={3} value={formData.gallery} onChange={(e) => setFormData({ ...formData, gallery: e.target.value })} placeholder="Una URL por línea" />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.published} onCheckedChange={(v) => setFormData({ ...formData, published: v })} />
                <Label>Publicado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.featured} onCheckedChange={(v) => setFormData({ ...formData, featured: v })} />
                <Label>Destacado</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending || uploading}>{editing ? "Guardar cambios" : "Crear proyecto"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar proyectos"
        destructive
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
};
