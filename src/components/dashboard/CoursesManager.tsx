import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";

interface Course {
  id: string;
  title: string;
  description: string;
  topics: string[];
  image_url: string | null;
  published: boolean;
  price: number;
  currency: string;
  created_at: string;
}

const EMPTY = {
  title: "",
  description: "",
  topics: "",
  image_url: "",
  published: false,
  price: 0,
  currency: "CLP",
};

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

export const CoursesManager = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY });
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [published, setPublished] = useState("all");
  const { toast } = useToast();
  const qc = useQueryClient();
  const { uploadImage, uploading } = useImageUpload("course-images");

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, topics, image_url, published, price, currency, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-courses"] });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title,
        description: formData.description,
        topics: formData.topics.split(",").map((t) => t.trim()).filter(Boolean),
        image_url: formData.image_url || null,
        published: formData.published,
        price: Number(formData.price),
        currency: formData.currency,
      };
      if (editing) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditing(null);
      setFormData({ ...EMPTY });
      toast({ title: editing ? "Curso actualizado" : "Curso creado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setPublishedMutation = useMutation({
    mutationFn: async ({ ids, value }: { ids: string[]; value: boolean }) => {
      const { error } = await supabase.from("courses").update({ published: value }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Estado actualizado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("courses").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setToDelete(null); toast({ title: "Curso eliminado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (course: Course) => {
    setEditing(course.id);
    setFormData({
      title: course.title,
      description: course.description,
      topics: (course.topics ?? []).join(", "),
      image_url: course.image_url || "",
      published: course.published,
      price: course.price,
      currency: course.currency,
    });
    setOpen(true);
  };

  const columns: DataTableColumn<Course>[] = [
    {
      key: "title",
      header: "Curso",
      sortable: true,
      value: (c) => c.title,
      cell: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          {c.image_url ? (
            <img src={c.image_url} alt={c.title} className="h-10 w-14 rounded-xl object-cover shrink-0" loading="lazy" />
          ) : (
            <div className="h-10 w-14 rounded-xl bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium truncate">{c.title}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{c.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: "topics",
      header: "Temas",
      value: (c) => (c.topics ?? []).join(" | "),
      cell: (c) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {(c.topics ?? []).slice(0, 3).map((t, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
          ))}
          {(c.topics ?? []).length > 3 && <Badge variant="secondary" className="text-[10px]">+{c.topics.length - 3}</Badge>}
        </div>
      ),
    },
    { key: "price", header: "Precio", sortable: true, value: (c) => Number(c.price), cell: (c) => <span className="whitespace-nowrap">{currency(Number(c.price))}</span> },
    { key: "currency", header: "Moneda", defaultHidden: true, value: (c) => c.currency, cell: (c) => c.currency },
    {
      key: "published",
      header: "Estado",
      sortable: true,
      value: (c) => (c.published ? "Publicado" : "Borrador"),
      cell: (c) => <Badge variant={c.published ? "default" : "secondary"}>{c.published ? "Publicado" : "Borrador"}</Badge>,
    },
    {
      key: "created_at",
      header: "Creado",
      sortable: true,
      defaultHidden: true,
      value: (c) => c.created_at,
      cell: (c) => <span className="text-xs">{new Date(c.created_at).toLocaleDateString("es-CL")}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={(courses ?? []).filter((c) =>
          published === "all" ? true : published === "published" ? c.published : !c.published
        )}
        isLoading={isLoading}
        error={error}
        columns={columns}
        getRowId={(c) => c.id}
        searchPlaceholder="Buscar curso…"
        searchFields={(c) => [c.title, c.description, ...(c.topics ?? [])]}
        exportFileName="cursos"
        emptyTitle="Sin cursos"
        emptyDescription="Crea tu primer curso para comenzar a vender."
        filters={[
          {
            key: "published",
            label: "Estado",
            value: published,
            onChange: setPublished,
            options: [
              { value: "all", label: "Todos" },
              { value: "published", label: "Publicados" },
              { value: "draft", label: "Borradores" },
            ],
          },
        ]}
        toolbarActions={
          <Button size="sm" className="rounded-2xl" onClick={() => { setEditing(null); setFormData({ ...EMPTY }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo curso
          </Button>
        }
        bulkActions={[
          { label: "Publicar", icon: <Eye className="h-4 w-4" />, onClick: (rows) => setPublishedMutation.mutate({ ids: rows.map((r) => r.id), value: true }) },
          { label: "Despublicar", icon: <EyeOff className="h-4 w-4" />, onClick: (rows) => setPublishedMutation.mutate({ ids: rows.map((r) => r.id), value: false }) },
          { label: "Eliminar", destructive: true, icon: <Trash2 className="h-4 w-4" />, onClick: (rows) => remove.mutate(rows.map((r) => r.id)) },
        ]}
        rowActions={(c) => (
          <>
            <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
            <Button size="sm" variant="destructive" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4" /></Button>
          </>
        )}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar curso" : "Nuevo curso"}</DialogTitle>
          </DialogHeader>
          <form
            id="course-form"
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topics">Temas (separados por comas)</Label>
              <Input
                id="topics"
                value={formData.topics}
                onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                placeholder="Python básico, Variables, Funciones"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio (CLP)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="24990"
                required
              />
            </div>
            <ImageUploadField
              label="Imagen"
              imageUrl={formData.image_url}
              uploading={uploading}
              onFileSelect={async (file) => {
                try {
                  const url = await uploadImage(file);
                  if (url) setFormData((p) => ({ ...p, image_url: url }));
                } catch {
                  toast({ title: "Error al subir imagen", variant: "destructive" });
                }
              }}
              onClear={() => setFormData({ ...formData, image_url: "" })}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
              <Label htmlFor="published">Publicado</Label>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="course-form" disabled={upsert.isPending}>
              {upsert.isPending ? "Guardando…" : editing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar curso?"
        description={`Se eliminará "${toDelete?.title}". Esta acción no se puede deshacer.`}
        destructive
        confirmLabel="Eliminar"
        onConfirm={() => toDelete && remove.mutate([toDelete.id])}
      />
    </div>
  );
};
