import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, XCircle, Copy, Eye, EyeOff, Users, Instagram, Linkedin, Github, Mail } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { RowActions } from "@/components/dashboard/shared/RowActions";
import { EditSheet } from "@/components/dashboard/shared/EditSheet";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_github: string | null;
  sort_order: number;
  active: boolean;
}

const emptyForm = {
  name: "",
  role: "",
  description: "",
  bio: "",
  image_url: "",
  email: "",
  social_instagram: "",
  social_linkedin: "",
  social_github: "",
  sort_order: 0,
  active: true,
};

export const TeamManager = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload("team-images");
  const qc = useQueryClient();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ["cms-team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cms-team"] });
    qc.invalidateQueries({ queryKey: ["team-members"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        role: formData.role,
        description: formData.description || null,
        bio: formData.bio || null,
        image_url: formData.image_url || null,
        email: formData.email || null,
        social_instagram: formData.social_instagram || null,
        social_linkedin: formData.social_linkedin || null,
        social_github: formData.social_github || null,
        sort_order: Number(formData.sort_order) || 0,
        active: formData.active,
      };
      const { error } = editing
        ? await supabase.from("team_members").update(payload).eq("id", editing)
        : await supabase.from("team_members").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: editing ? "Miembro actualizado" : "Miembro creado" });
      setOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("team_members").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Miembros eliminados" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setActive = useMutation({
    mutationFn: async ({ ids, active }: { ids: string[]; active: boolean }) => {
      const { error } = await supabase.from("team_members").update({ active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicate = useMutation({
    mutationFn: async (m: TeamMember) => {
      const { error } = await supabase.from("team_members").insert({
        name: `${m.name} (copia)`,
        role: m.role,
        description: m.description,
        bio: m.bio,
        image_url: m.image_url,
        email: m.email,
        social_instagram: m.social_instagram,
        social_linkedin: m.social_linkedin,
        social_github: m.social_github,
        sort_order: (m.sort_order ?? 0) + 1,
        active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Miembro duplicado", description: "Se creó oculto." });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditing(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m.id);
    setFormData({
      name: m.name,
      role: m.role,
      description: m.description || "",
      bio: m.bio || "",
      image_url: m.image_url || "",
      email: m.email || "",
      social_instagram: m.social_instagram || "",
      social_linkedin: m.social_linkedin || "",
      social_github: m.social_github || "",
      sort_order: m.sort_order ?? 0,
      active: m.active ?? true,
    });
    setOpen(true);
  };

  const filtered = (members || []).filter((m) => {
    if (activeFilter === "active") return m.active;
    if (activeFilter === "inactive") return !m.active;
    return true;
  });

  const all = members || [];
  const kpis = [
    { label: "Total", value: all.length, icon: <Users className="h-4 w-4" /> },
    { label: "Activos", value: all.filter((m) => m.active).length, icon: <Eye className="h-4 w-4" />, accent: "text-emerald-600" },
    { label: "Ocultos", value: all.filter((m) => !m.active).length, icon: <EyeOff className="h-4 w-4" />, accent: "text-muted-foreground" },
  ];

  const socialLinks = (r: TeamMember) => {
    const items = [
      { icon: Instagram, url: r.social_instagram },
      { icon: Linkedin, url: r.social_linkedin },
      { icon: Github, url: r.social_github },
      { icon: Mail, url: r.email ? `mailto:${r.email}` : null },
    ].filter((i) => !!i.url) as { icon: typeof Instagram; url: string }[];
    return items.length ? (
      <div className="flex gap-1.5">
        {items.map(({ icon: Icon, url }, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-serene-primary transition-colors"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  };

  const rowActions = (r: TeamMember) => (
    <RowActions
      actions={[
        { label: "Editar", icon: <Edit className="h-4 w-4" />, inline: true, onClick: () => openEdit(r) },
        { label: "Duplicar", icon: <Copy className="h-4 w-4" />, onClick: () => duplicate.mutate(r) },
        r.active
          ? { label: "Ocultar", icon: <EyeOff className="h-4 w-4" />, onClick: () => setActive.mutate({ ids: [r.id], active: false }) }
          : { label: "Mostrar", icon: <Eye className="h-4 w-4" />, onClick: () => setActive.mutate({ ids: [r.id], active: true }) },
        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: () => setToDelete([r.id]) },
      ]}
    />
  );

  const renderCard = (r: TeamMember) => (
    <div className="space-y-3">
      <img src={r.image_url || "/placeholder.svg"} alt={r.name} loading="lazy" className="h-32 w-full rounded-2xl border object-cover" />
      <div>
        <p className="font-semibold leading-tight">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.role}</p>
      </div>
      <div className="flex items-center justify-between">
        {socialLinks(r)}
        {r.active ? <StatusBadge label="Activo" tone="success" /> : <StatusBadge label="Oculto" tone="muted" />}
      </div>
    </div>
  );

  const columns: DataTableColumn<TeamMember>[] = [
    {
      key: "name",
      header: "Miembro",
      sortable: true,
      value: (r) => r.name,
      cell: (r) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <img src={r.image_url || "/placeholder.svg"} alt={r.name} className="h-10 w-10 rounded-full object-cover border" />
          <div className="min-w-0">
            <p className="font-medium truncate">{r.name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.email || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Cargo", sortable: true, value: (r) => r.role, cell: (r) => r.role },
    {
      key: "bio",
      header: "Biografía",
      value: (r) => r.bio || r.description || "",
      cell: (r) => <span className="text-xs text-muted-foreground line-clamp-2 max-w-[280px] block">{r.bio || r.description || "—"}</span>,
      defaultHidden: true,
    },
    {
      key: "socials",
      header: "Redes",
      value: (r) => [r.social_instagram, r.social_linkedin, r.social_github].filter(Boolean).join(" | "),
      cell: (r) => socialLinks(r),
    },
    { key: "sort_order", header: "Orden", sortable: true, value: (r) => r.sort_order ?? 0, cell: (r) => r.sort_order ?? 0, defaultHidden: true },
    {
      key: "active",
      header: "Estado",
      sortable: true,
      value: (r) => (r.active ? "Activo" : "Oculto"),
      cell: (r) => (r.active ? <StatusBadge label="Activo" tone="success" /> : <StatusBadge label="Oculto" tone="muted" />),
    },
  ];

  return (
    <div className="space-y-4">
      <KpiGrid items={kpis} loading={isLoading} columns={3} />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={isLoading}
        error={error}
        getRowId={(r) => r.id}
        exportFileName="equipo"
        searchPlaceholder="Buscar miembros..."
        searchFields={(r) => [r.name, r.role, r.email, r.bio, r.description]}
        views={["table", "cards", "list"]}
        renderCard={renderCard}
        renderListItem={(r) => (
          <div className="flex items-center gap-3">
            <img src={r.image_url || "/placeholder.svg"} alt={r.name} loading="lazy" className="h-10 w-10 rounded-full border object-cover" />
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {socialLinks(r)}
              {r.active ? <StatusBadge label="Activo" tone="success" /> : <StatusBadge label="Oculto" tone="muted" />}
            </div>
          </div>
        )}
        onRowClick={openEdit}
        filters={[
          {
            key: "active",
            label: "Estado",
            value: activeFilter,
            onChange: setActiveFilter,
            options: [
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "inactive", label: "Ocultos" },
            ],
          },
        ]}
        toolbarActions={
          <Button size="sm" className="rounded-2xl" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo miembro
          </Button>
        }
        bulkActions={[
          { label: "Mostrar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (rows) => setActive.mutate({ ids: rows.map((r) => r.id), active: true }) },
          { label: "Ocultar", icon: <XCircle className="h-4 w-4" />, onClick: (rows) => setActive.mutate({ ids: rows.map((r) => r.id), active: false }) },
          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: (rows) => setToDelete(rows.map((r) => r.id)) },
        ]}
        rowActions={rowActions}
        emptyTitle="Sin miembros"
        emptyAction={<Button onClick={openNew} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Nuevo miembro</Button>}
      />

      <EditSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar miembro" : "Nuevo miembro"}
        description="Guarda con Ctrl + S o cierra con Esc."
        onSubmit={() => save.mutate()}
        saving={save.isPending || uploading}
        submitLabel={editing ? "Guardar cambios" : "Crear miembro"}
        width="lg"
        aside={
          <div className="flex items-start gap-3">
            {formData.image_url && (
              <img src={formData.image_url} alt="" className="h-16 w-16 rounded-full border object-cover" />
            )}
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vista previa</p>
              <p className="truncate font-semibold">{formData.name || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">{formData.role || "Sin cargo"}</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción corta</Label>
            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Biografía</Label>
            <Textarea rows={4} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={formData.social_instagram} onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={formData.social_linkedin} onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input value={formData.social_github} onChange={(e) => setFormData({ ...formData, social_github: e.target.value })} placeholder="https://github.com/..." />
            </div>
          </div>
          <ImageUploadField
            label="Foto del miembro"
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
          <div className="flex items-center gap-2">
            <Switch checked={formData.active} onCheckedChange={(v) => setFormData({ ...formData, active: v })} />
            <Label>Activo (visible en el sitio)</Label>
          </div>
        </div>
      </EditSheet>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar miembros"
        destructive
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
};
