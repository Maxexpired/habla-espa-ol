import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, XCircle, Copy, HelpCircle, FileText, Tags } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { RowActions } from "@/components/dashboard/shared/RowActions";
import { EditSheet } from "@/components/dashboard/shared/EditSheet";
import { PublishBadge } from "@/components/dashboard/shared/StatusBadge";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  published: boolean;
}

const emptyForm = { question: "", answer: "", category: "", sort_order: 0, published: false };

export const FAQsManager = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [toDelete, setToDelete] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: faqs, isLoading, error } = useQuery({
    queryKey: ["cms-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FAQ[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cms-faqs"] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
        sort_order: Number(formData.sort_order) || 0,
        published: formData.published,
      };
      const { error } = editing
        ? await supabase.from("faqs").update(payload).eq("id", editing)
        : await supabase.from("faqs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: editing ? "FAQ actualizada" : "FAQ creada" });
      setOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("faqs").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "FAQs eliminadas" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setPublished = useMutation({
    mutationFn: async ({ ids, published }: { ids: string[]; published: boolean }) => {
      const { error } = await supabase.from("faqs").update({ published }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicate = useMutation({
    mutationFn: async (f: FAQ) => {
      const { error } = await supabase.from("faqs").insert({
        question: `${f.question} (copia)`,
        answer: f.answer,
        category: f.category,
        sort_order: (f.sort_order ?? 0) + 1,
        published: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "FAQ duplicada", description: "Se creó como borrador." });
      invalidate();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditing(null);
    setFormData(emptyForm);
    setOpen(true);
  };

  const openEdit = (f: FAQ) => {
    setEditing(f.id);
    setFormData({
      question: f.question,
      answer: f.answer,
      category: f.category || "",
      sort_order: f.sort_order ?? 0,
      published: f.published,
    });
    setOpen(true);
  };

  const categories = [...new Set((faqs || []).map((f) => f.category).filter(Boolean))] as string[];

  const filtered = (faqs || []).filter((f) => {
    if (statusFilter === "published" && !f.published) return false;
    if (statusFilter === "draft" && f.published) return false;
    if (categoryFilter !== "all" && (f.category || "") !== categoryFilter) return false;
    return true;
  });

  const all = faqs || [];
  const kpis = [
    { label: "Total", value: all.length, icon: <HelpCircle className="h-4 w-4" /> },
    { label: "Publicadas", value: all.filter((f) => f.published).length, icon: <CheckCircle2 className="h-4 w-4" />, accent: "text-emerald-600" },
    { label: "Borradores", value: all.filter((f) => !f.published).length, icon: <FileText className="h-4 w-4" />, accent: "text-muted-foreground" },
    { label: "Categorías", value: categories.length, icon: <Tags className="h-4 w-4" />, accent: "text-blue-600" },
  ];

  const grouped = useMemo(() => {
    const map = new Map<string, FAQ[]>();
    filtered.forEach((f) => {
      const key = f.category || "Sin categoría";
      map.set(key, [...(map.get(key) || []), f]);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [filtered]);

  const rowActions = (r: FAQ) => (
    <RowActions
      actions={[
        { label: "Editar", icon: <Edit className="h-4 w-4" />, inline: true, onClick: () => openEdit(r) },
        { label: "Duplicar", icon: <Copy className="h-4 w-4" />, onClick: () => duplicate.mutate(r) },
        r.published
          ? { label: "Despublicar", icon: <XCircle className="h-4 w-4" />, onClick: () => setPublished.mutate({ ids: [r.id], published: false }) }
          : { label: "Publicar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => setPublished.mutate({ ids: [r.id], published: true }) },
        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: () => setToDelete([r.id]) },
      ]}
    />
  );

  const columns: DataTableColumn<FAQ>[] = [
    {
      key: "question",
      header: "Pregunta",
      sortable: true,
      value: (r) => r.question,
      cell: (r) => (
        <div className="min-w-[240px]">
          <p className="font-medium">{r.question}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{r.answer}</p>
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
    { key: "sort_order", header: "Orden", sortable: true, value: (r) => r.sort_order ?? 0, cell: (r) => r.sort_order ?? 0, defaultHidden: true },
    {
      key: "published",
      header: "Estado",
      sortable: true,
      value: (r) => (r.published ? "Publicada" : "Borrador"),
      cell: (r) => <PublishBadge published={r.published} />,
    },
  ];

  const renderCard = (r: FAQ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {r.category ? <Badge variant="outline">{r.category}</Badge> : <span />}
        <PublishBadge published={r.published} />
      </div>
      <p className="font-semibold leading-tight line-clamp-2">{r.question}</p>
      <p className="text-xs text-muted-foreground line-clamp-3">{r.answer}</p>
    </div>
  );

  const renderListItem = (r: FAQ) => (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{r.question}</p>
        <p className="truncate text-xs text-muted-foreground">{r.category || "Sin categoría"}</p>
      </div>
      <PublishBadge published={r.published} />
    </div>
  );

  return (
    <div className="space-y-4">
      <KpiGrid items={kpis} loading={isLoading} />

      {categoryFilter === "__grouped__" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-2xl" onClick={() => setCategoryFilter("all")}>
              Volver a lista
            </Button>
            <Button size="sm" className="rounded-2xl ml-auto" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Nueva FAQ
            </Button>
          </div>
          {grouped.map(([cat, items]) => (
            <div key={cat} className="rounded-3xl border overflow-hidden">
              <div className="flex items-center justify-between bg-muted/40 px-4 py-2">
                <p className="text-sm font-semibold">{cat}</p>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <ul className="divide-y">
                {items.map((f) => (
                  <li key={f.id} className="group/row flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEdit(f)}>
                      <p className="truncate font-medium">{f.question}</p>
                      <p className="truncate text-xs text-muted-foreground">{f.answer}</p>
                    </div>
                    <PublishBadge published={f.published} />
                    {rowActions(f)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">Sin preguntas frecuentes.</p>
          )}
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          error={error}
          getRowId={(r) => r.id}
          exportFileName="faqs"
          searchPlaceholder="Buscar preguntas..."
          searchFields={(r) => [r.question, r.answer, r.category]}
          views={["table", "cards", "list"]}
          renderCard={renderCard}
          renderListItem={renderListItem}
          onRowClick={openEdit}
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
              ],
            },
            {
              key: "category",
              label: "Categoría",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: [
                { value: "all", label: "Todas las categorías" },
                ...categories.map((c) => ({ value: c, label: c })),
                { value: "__grouped__", label: "Vista por categorías" },
              ],
            },
          ]}
          toolbarActions={
            <Button size="sm" className="rounded-2xl" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Nueva FAQ
            </Button>
          }
          bulkActions={[
            { label: "Publicar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), published: true }) },
            { label: "Despublicar", icon: <XCircle className="h-4 w-4" />, onClick: (rows) => setPublished.mutate({ ids: rows.map((r) => r.id), published: false }) },
            { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: (rows) => setToDelete(rows.map((r) => r.id)) },
          ]}
          rowActions={rowActions}
          emptyTitle="Sin preguntas frecuentes"
          emptyAction={<Button onClick={openNew} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Nueva FAQ</Button>}
        />
      )}

      <EditSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar FAQ" : "Nueva FAQ"}
        description="Guarda con Ctrl + S o cierra con Esc."
        onSubmit={() => save.mutate()}
        saving={save.isPending}
        submitLabel={editing ? "Guardar cambios" : "Crear FAQ"}
        width="lg"
        aside={
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vista previa</p>
            <p className="truncate font-semibold">{formData.question || "Sin pregunta"}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{formData.answer || "Sin respuesta"}</p>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pregunta</Label>
            <Input value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Respuesta</Label>
            <Textarea rows={5} value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Ej: Pagos" list="faq-cats" />
              <datalist id="faq-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.published} onCheckedChange={(v) => setFormData({ ...formData, published: v })} />
            <Label>Publicada</Label>
          </div>
        </div>
      </EditSheet>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Eliminar preguntas"
        destructive
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
};
