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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Eye, CheckCircle2, XCircle } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";

interface News {
  id: string;
  title: string;
  description: string;
  excerpt: string | null;
  slug: string | null;
  image_url: string | null;
  gallery: string[] | null;
  category: string | null;
  featured: boolean;
  published: boolean;
  scheduled_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
}

const emptyForm = {
  title: "",
  description: "",
  excerpt: "",
  slug: "",
  image_url: "",
  gallery: "",
  category: "",
  featured: false,
  published: false,
  scheduled_at: "",
  seo_title: "",
  seo_description: "",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const NewsManager = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [preview, setPreview] = useState<News | null>(null);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload("news-images");
  const qc = useQueryClient();

  const { data: news, isLoading, error } = useQuery({
    queryKey: ["cms-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as News[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cms-news"] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title,
        description: formData.description,
        excerpt: formData.excerpt || null,
        slug: formData.slug || slugify(formData.title),
        image_url: formData.image_url || null,
        gallery: formData.gallery.split("\n").map((s) => s.trim()).filter(Boolean),
        category: formData.category || null,
        featured: formData.featured,
        published: formData.published,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
      };
      const { error } = editing
        ? await supabase.from("news").update(payload).eq("id", editing)
        : await supabase.from("news").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: editing ? "Noticia actualizada" : "Noticia creada" });
      setOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("news").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Noticias eliminadas" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setPublished = useMutation({
    mutationFn: async ({ ids, published }: { ids: string[]; published: boolean }) => {
      const { error } = await supabase.from("news").update({ published }).in("id", ids);
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

  const openEdit = (n: News) => {
    setEditing(n.id);
    setFormData({
      title: n.title,
      description: n.description,
      excerpt: n.excerpt || "",
      slug: n.slug || "",
      image_url: n.image_url || "",
      gallery: (n.gallery || []).join("\n"),
      category: n.category || "",
      featured: n.featured,
      published: n.published,
      scheduled_at: n.scheduled_at ? n.scheduled_at.slice(0, 16) : "",
      seo_title: n.seo_title || "",
      seo_description: n.seo_description || "",
    });
    setOpen(true);
  };

  const filtered = (news || []).filter((n) => {
    if (statusFilter === "published") return n.published;
    if (statusFilter === "draft") return !n.published && !n.scheduled_at;
    if (statusFilter === "scheduled") return !!n.scheduled_at && !n.published;
    if (statusFilter === "featured") return n.featured;
    return true;
  });

  const columns: DataTableColumn<News>[] = [
    {
      key: "title",
      header: "Título",
      sortable: true,
      value: (r) => r.title,
      cell: (r) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <img
            src={r.image_url || "/placeholder.svg"}
            alt={r.title}
            className="h-10 w-10 rounded-xl object-cover border"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground truncate">{r.excerpt || r.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      sortable: true,
      value: (r) => r.category || "",
      cell: (r) => (r.category ? <Badge variant="outline">{r.category}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      value: (r) => (r.published ? "Publicado" : r.scheduled_at ? "Programado" : "Borrador"),
      cell: (r) =>
        r.published ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Publicado</Badge>
        ) : r.scheduled_at ? (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">Programado</Badge>
        ) : (
          <Badge variant="secondary">Borrador</Badge>
        ),
    },
    {
      key: "featured",
      header: "Destacada",
      value: (r) => (r.featured ? "Sí" : "No"),
      cell: (r) => (r.featured ? <Badge variant="outline">Sí</Badge> : <span className="text-muted-foreground">—</span>),
      defaultHidden: true,
    },
    {
      key: "scheduled_at",
      header: "Programada",
      sortable: true,
      value: (r) => r.scheduled_at || "",
      cell: (r) => (r.scheduled_at ? new Date(r.scheduled_at).toLocaleString("es-CL") : "—"),
      defaultHidden: true,
    },
    {
      key: "created_at",
      header: "Creada",
      sortable: true,
      value: (r) => r.created_at,
      cell: (r) => new Date(r.created_at).toLocaleDateString("es-CL"),
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
        exportFileName="noticias"
        searchPlaceholder="Buscar noticias..."
        searchFields={(r) => [r.title, r.description, r.category, r.slug]}
        filters={[
          {
            key: "status",
            label: "Estado",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "Todas" },
              { value: "published", label: "Publicadas" },
              { value: "draft", label: "Borradores" },
              { value: "scheduled", label: "Programadas" },
              { value: "featured", label: "Destacadas" },
            ],
          },
        ]}
        toolbarActions={
          <Button size="sm" className="rounded-2xl" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nueva noticia
          </Button>
        }
        bulkActions={[
          { label: "Publicar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), published: true }) },
          { label: "Despublicar", icon: <XCircle className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), published: false }) },
          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: (rows) => setToDelete(rows.map((r) => r.id)) },
        ]}
        rowActions={(r) => (
          <>
            <Button size="sm" variant="ghost" onClick={() => setPreview(r)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setToDelete([r.id])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        emptyTitle="Sin noticias"
        emptyDescription="Crea la primera noticia para publicarla en el sitio."
        emptyAction={<Button onClick={openNew} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Nueva noticia</Button>}
      />

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar noticia" : "Nueva noticia"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <Tabs defaultValue="content">
              <TabsList className="rounded-2xl">
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="media">Galería</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="publish">Publicación</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Resumen</Label>
                  <Input value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="Bajada corta para listados" />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea rows={6} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Ej: Comunidad" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={slugify(formData.title) || "mi-noticia"} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 pt-4">
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
                        if (url)
                          setFormData((f) => ({
                            ...f,
                            gallery: f.gallery ? `${f.gallery}\n${url}` : url,
                          }));
                      } catch {
                        toast({ title: "Error al subir imagen", variant: "destructive" });
                      }
                    }}
                    onClear={() => {}}
                  />
                  <Textarea
                    rows={4}
                    value={formData.gallery}
                    onChange={(e) => setFormData({ ...formData, gallery: e.target.value })}
                    placeholder="Una URL por línea"
                  />
                  {formData.gallery && (
                    <div className="flex flex-wrap gap-2">
                      {formData.gallery.split("\n").filter(Boolean).map((u) => (
                        <img key={u} src={u} alt="" className="h-14 w-14 rounded-xl object-cover border" />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título SEO</Label>
                  <Input value={formData.seo_title} onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })} maxLength={60} />
                  <p className="text-xs text-muted-foreground">{formData.seo_title.length}/60 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label>Descripción SEO</Label>
                  <Textarea rows={3} value={formData.seo_description} onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })} maxLength={160} />
                  <p className="text-xs text-muted-foreground">{formData.seo_description.length}/160 caracteres</p>
                </div>
              </TabsContent>

              <TabsContent value="publish" className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.published} onCheckedChange={(v) => setFormData({ ...formData, published: v })} />
                  <Label>Publicada</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.featured} onCheckedChange={(v) => setFormData({ ...formData, featured: v })} />
                  <Label>Destacada</Label>
                </div>
                <div className="space-y-2">
                  <Label>Programar publicación</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se guarda la fecha planificada; la noticia se muestra en el sitio cuando está publicada.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending || uploading}>
                {editing ? "Guardar cambios" : "Crear noticia"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          {preview && (
            <article className="space-y-3">
              {preview.image_url && (
                <img src={preview.image_url} alt={preview.title} className="w-full rounded-3xl object-cover max-h-64" />
              )}
              {preview.category && <Badge variant="outline">{preview.category}</Badge>}
              <h2 className="text-2xl font-bold">{preview.title}</h2>
              {preview.excerpt && <p className="text-muted-foreground">{preview.excerpt}</p>}
              <p className="whitespace-pre-wrap text-sm">{preview.description}</p>
              {!!preview.gallery?.length && (
                <div className="grid grid-cols-3 gap-2">
                  {preview.gallery.map((u) => (
                    <img key={u} src={u} alt="" className="rounded-2xl object-cover h-24 w-full" />
                  ))}
                </div>
              )}
            </article>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar noticias"
        description="Esta acción no se puede deshacer."
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
};
