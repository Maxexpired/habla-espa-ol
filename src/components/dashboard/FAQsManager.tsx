import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, CheckCircle2, XCircle } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";

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
    { key: "sort_order", header: "Orden", sortable: true, value: (r) => r.sort_order ?? 0, cell: (r) => r.sort_order ?? 0 },
    {
      key: "published",
      header: "Estado",
      sortable: true,
      value: (r) => (r.published ? "Publicada" : "Borrador"),
      cell: (r) =>
        r.published ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">Publicada</Badge>
        ) : (
          <Badge variant="secondary">Borrador</Badge>
        ),
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
        exportFileName="faqs"
        searchPlaceholder="Buscar preguntas..."
        searchFields={(r) => [r.question, r.answer, r.category]}
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
            options: [{ value: "all", label: "Todas las categorías" }, ...categories.map((c) => ({ value: c, label: c }))],
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
        emptyTitle="Sin preguntas frecuentes"
        emptyAction={<Button onClick={openNew} className="rounded-2xl"><Plus className="h-4 w-4 mr-2" />Nueva FAQ</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar FAQ" : "Nueva FAQ"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>{editing ? "Guardar cambios" : "Crear FAQ"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
