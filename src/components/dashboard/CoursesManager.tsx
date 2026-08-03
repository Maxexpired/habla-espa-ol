import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  GraduationCap,
  FileText,
  Users,
  Gift,
  Wrench,
} from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { RowActions } from "@/components/dashboard/shared/RowActions";
import { EditSheet } from "@/components/dashboard/shared/EditSheet";
import { PublishBadge } from "@/components/dashboard/shared/StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Course {
  id: string;
  title: string;
  description: string;
  topics: string[];
  image_url: string | null;
  published: boolean;
  price: number;
  currency: string;
  is_free: boolean;
  instructor_id: string | null;
  created_at: string;
  updated_at: string | null;
}

const EMPTY = {
  title: "",
  description: "",
  topics: "",
  image_url: "",
  published: false,
  price: 0,
  currency: "CLP",
  is_free: false,
};

const formatPrice = (c: Course) => {
  if (c.is_free || Number(c.price) === 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: c.currency || "CLP",
    maximumFractionDigits: 0,
  }).format(Number(c.price) || 0);
};

export const CoursesManager = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY });
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { uploadImage, uploading } = useImageUpload("course-images");

  const { data: courses, isLoading, error } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, title, description, topics, image_url, published, price, currency, is_free, instructor_id, created_at, updated_at"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });

  const instructorIds = Array.from(
    new Set((courses ?? []).map((c) => c.instructor_id).filter(Boolean))
  ) as string[];

  const { data: instructors } = useQuery({
    queryKey: ["admin-courses-instructors", instructorIds],
    enabled: instructorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", instructorIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const instructorMap = new Map((instructors ?? []).map((p) => [p.id, p.full_name]));

  const { data: enrollmentCounts } = useQuery({
    queryKey: ["admin-courses-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("course_id");
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((e: { course_id: string }) => {
        counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1);
      });
      return counts;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-courses"] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title,
        description: formData.description,
        topics: formData.topics.split(",").map((t) => t.trim()).filter(Boolean),
        image_url: formData.image_url || null,
        published: formData.published,
        price: formData.is_free ? 0 : Number(formData.price),
        currency: formData.currency,
        is_free: formData.is_free,
      };
      const { error } = editing
        ? await supabase.from("courses").update(payload).eq("id", editing)
        : await supabase.from("courses").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditing(null);
      setFormData({ ...EMPTY });
      toast({ title: editing ? "Curso actualizado" : "Curso creado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setPublished = useMutation({
    mutationFn: async ({ ids, value }: { ids: string[]; value: boolean }) => {
      const { error } = await supabase.from("courses").update({ published: value }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Estado actualizado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("courses").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Curso eliminado" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicate = useMutation({
    mutationFn: async (c: Course) => {
      const { error } = await supabase.from("courses").insert({
        title: `${c.title} (copia)`,
        description: c.description,
        topics: c.topics ?? [],
        image_url: c.image_url,
        published: false,
        price: c.price,
        currency: c.currency,
        is_free: c.is_free,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Curso duplicado", description: "Se creó como borrador." });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditing(null);
    setFormData({ ...EMPTY });
    setOpen(true);
  };

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
      is_free: course.is_free,
    });
    setOpen(true);
  };

  const filtered = (courses ?? []).filter((c) => {
    if (statusFilter === "published") return c.published;
    if (statusFilter === "draft") return !c.published;
    if (statusFilter === "free") return c.is_free;
    if (statusFilter === "paid") return !c.is_free;
    return true;
  });

  const all = courses ?? [];
  const kpis = [
    { label: "Total", value: all.length, icon: <GraduationCap className="h-4 w-4" /> },
    { label: "Publicados", value: all.filter((c) => c.published).length, icon: <CheckCircle2 className="h-4 w-4" />, accent: "text-emerald-600" },
    { label: "Borradores", value: all.filter((c) => !c.published).length, icon: <FileText className="h-4 w-4" /> },
    { label: "Gratuitos", value: all.filter((c) => c.is_free).length, icon: <Gift className="h-4 w-4" />, accent: "text-blue-600" },
    { label: "Pagados", value: all.filter((c) => !c.is_free).length, icon: <Users className="h-4 w-4" />, accent: "text-amber-600" },
  ];

  const rowActions = (r: Course) => (
    <RowActions
      actions={[
        { label: "Editar", icon: <Edit className="h-4 w-4" />, inline: true, onClick: () => openEdit(r) },
        { label: "Duplicar", icon: <Copy className="h-4 w-4" />, onClick: () => duplicate.mutate(r) },
        r.published
          ? { label: "Despublicar", icon: <XCircle className="h-4 w-4" />, onClick: () => setPublished.mutate({ ids: [r.id], value: false }) }
          : { label: "Publicar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => setPublished.mutate({ ids: [r.id], value: true }) },
        { label: "Vista previa", icon: <Eye className="h-4 w-4" />, onClick: () => window.open("/courses", "_blank", "noreferrer") },
        { label: "Constructor (Próximamente Fase 3)", icon: <Wrench className="h-4 w-4" />, onClick: () => navigate(`/dashboard/courses/${r.id}/builder`) },
        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: () => setToDelete([r.id]) },
      ]}
    />
  );

  const columns: DataTableColumn<Course>[] = [
    {
      key: "image",
      header: "Imagen",
      value: () => "",
      cell: (c) =>
        c.image_url ? (
          <img src={c.image_url} alt={c.title} className="h-10 w-14 rounded-xl object-cover shrink-0" loading="lazy" />
        ) : (
          <div className="h-10 w-14 rounded-xl bg-muted shrink-0" />
        ),
    },
    {
      key: "title",
      header: "Título",
      sortable: true,
      value: (c) => c.title,
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{c.title}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[280px]">{c.description}</p>
        </div>
      ),
    },
    {
      key: "published",
      header: "Estado",
      sortable: true,
      value: (c) => (c.published ? "Publicado" : "Borrador"),
      cell: (c) => <PublishBadge published={c.published} />,
    },
    {
      key: "topics",
      header: "Temas",
      value: (c) => (c.topics ?? [])[0] || "",
      cell: (c) => ((c.topics ?? [])[0] ? <Badge variant="outline">{c.topics[0]}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "instructor",
      header: "Instructor",
      value: (c) => (c.instructor_id ? instructorMap.get(c.instructor_id) || "" : ""),
      cell: (c) => {
        const name = c.instructor_id ? instructorMap.get(c.instructor_id) : null;
        return name ? <span className="text-sm">{name}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: "price",
      header: "Precio",
      sortable: true,
      value: (c) => Number(c.price),
      cell: (c) => <span className="whitespace-nowrap">{formatPrice(c)}</span>,
    },
    {
      key: "students",
      header: "Alumnos",
      sortable: true,
      value: (c) => enrollmentCounts?.get(c.id) ?? 0,
      cell: (c) => <span>{enrollmentCounts?.get(c.id) ?? 0}</span>,
    },
    {
      key: "updated_at",
      header: "Última actualización",
      sortable: true,
      value: (c) => c.updated_at || c.created_at,
      cell: (c) => (
        <span className="text-xs text-muted-foreground">
          {new Date(c.updated_at || c.created_at).toLocaleDateString("es-CL")}
        </span>
      ),
    },
  ];

  const renderCard = (r: Course) => (
    <div className="space-y-3">
      <img
        src={r.image_url || "/placeholder.svg"}
        alt={r.title}
        loading="lazy"
        className="h-32 w-full rounded-2xl border object-cover"
      />
      <div className="flex flex-wrap items-center gap-2">
        <PublishBadge published={r.published} />
        {r.topics?.[0] && <Badge variant="outline">{r.topics[0]}</Badge>}
      </div>
      <div>
        <p className="font-semibold leading-tight line-clamp-2">{r.title}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatPrice(r)}</span>
        <span>{enrollmentCounts?.get(r.id) ?? 0} alumnos</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <KpiGrid items={kpis} loading={isLoading} columns={5} />
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        error={error}
        getRowId={(c) => c.id}
        exportFileName="cursos"
        searchPlaceholder="Buscar cursos..."
        searchFields={(c) => [c.title, c.description, ...(c.topics ?? [])]}
        views={["table", "cards", "list"]}
        renderCard={renderCard}
        renderListItem={(r) => (
          <div className="flex items-center gap-3">
            <img src={r.image_url || "/placeholder.svg"} alt={r.title} loading="lazy" className="h-10 w-10 rounded-xl border object-cover" />
            <div className="min-w-0">
              <p className="truncate font-medium">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatPrice(r)} · {enrollmentCounts?.get(r.id) ?? 0} alumnos
              </p>
            </div>
            <div className="ml-auto"><PublishBadge published={r.published} /></div>
          </div>
        )}
        onRowClick={openEdit}
        filters={[
          {
            key: "status",
            label: "Estado",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "Todos" },
              { value: "published", label: "Publicados" },
              { value: "draft", label: "Borradores" },
              { value: "free", label: "Gratuitos" },
              { value: "paid", label: "Pagados" },
            ],
          },
        ]}
        toolbarActions={
          <Button size="sm" className="rounded-2xl" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo curso
          </Button>
        }
        bulkActions={[
          { label: "Publicar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), value: true }) },
          { label: "Despublicar", icon: <XCircle className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), value: false }) },
          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: (rows) => setToDelete(rows.map((r) => r.id)) },
        ]}
        rowActions={rowActions}
        emptyTitle="Sin cursos"
        emptyDescription="Crea tu primer curso para comenzar a vender."
        emptyAction={<Button onClick={openNew} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Nuevo curso</Button>}
      />

      <EditSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar curso" : "Nuevo curso"}
        description="Guarda con Ctrl + S o cierra con Esc."
        onSubmit={() => save.mutate()}
        saving={save.isPending || uploading}
        submitLabel={editing ? "Guardar cambios" : "Crear curso"}
        width="xl"
        aside={
          <div className="flex items-start gap-3">
            {formData.image_url && (
              <img src={formData.image_url} alt="" className="h-16 w-16 rounded-2xl border object-cover" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vista previa</p>
              <p className="truncate font-semibold">{formData.title || "Sin título"}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{formData.description || "Sin descripción"}</p>
              <p className="mt-1 text-xs font-medium">
                {formData.is_free ? "Gratis" : new Intl.NumberFormat("es-CL", { style: "currency", currency: formData.currency, maximumFractionDigits: 0 }).format(Number(formData.price) || 0)}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Tabs defaultValue="content">
            <TabsList className="rounded-2xl">
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="pricing">Precio</TabsTrigger>
              <TabsTrigger value="publish">Publicación</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Temas (separados por comas)</Label>
                <Input
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                  placeholder="Python básico, Variables, Funciones"
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
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_free} onCheckedChange={(v) => setFormData({ ...formData, is_free: v })} />
                <Label>Curso gratuito</Label>
              </div>
              {!formData.is_free && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="24990"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="publish" className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Switch checked={formData.published} onCheckedChange={(v) => setFormData({ ...formData, published: v })} />
                <Label>Publicado</Label>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" className="rounded-2xl" disabled>
                    <Wrench className="h-4 w-4 mr-2" /> Constructor
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Próximamente Fase 3</TooltipContent>
              </Tooltip>
            </TabsContent>
          </Tabs>
        </div>
      </EditSheet>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Eliminar curso(s)"
        description="Esta acción no se puede deshacer."
        destructive
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
};
