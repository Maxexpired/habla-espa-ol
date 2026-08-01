import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Plus, Edit, Copy, Trash2, Send, FileText, History } from "lucide-react";

interface Template {
  id: string;
  key: string;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  variables: string[];
  active: boolean;
  updated_at: string;
}

interface EmailLog {
  id: string;
  template_key: string | null;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  attempts: number;
  provider: string | null;
  sent_at: string | null;
  created_at: string;
}

const EMPTY = {
  key: "",
  name: "",
  description: "",
  subject: "",
  html_content: "",
  variables: "",
  active: false,
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    sent: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-red-100 text-red-700 border-red-200",
    failed: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = { sent: "Enviado", pending: "Pendiente", error: "Error", failed: "Fallido" };
  return <Badge variant="outline" className={map[s] ?? ""}>{labels[s] ?? s}</Badge>;
};

export default function EmailsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [testOpen, setTestOpen] = useState<Template | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [logStatus, setLogStatus] = useState("all");

  const templatesQ = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_templates").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Template[];
    },
  });

  const logsQ = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as EmailLog[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["email-templates"] });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        key: form.key.trim(),
        name: form.name.trim(),
        description: form.description || null,
        subject: form.subject,
        html_content: form.html_content,
        variables: form.variables.split(",").map((v) => v.trim()).filter(Boolean),
        active: form.active,
      };
      if (editing) {
        const { error } = await supabase.from("email_templates").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditing(null);
      setForm({ ...EMPTY });
      toast({ title: "Plantilla guardada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ ids, active }: { ids: string[]; active: boolean }) => {
      const { error } = await supabase.from("email_templates").update({ active }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Estado actualizado" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const duplicate = useMutation({
    mutationFn: async (t: Template) => {
      const { error } = await supabase.from("email_templates").insert({
        key: `${t.key}-copia-${Date.now().toString().slice(-4)}`,
        name: `${t.name} (copia)`,
        description: t.description,
        subject: t.subject,
        html_content: t.html_content,
        variables: t.variables,
        active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast({ title: "Plantilla duplicada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("email_templates").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setToDelete(null); toast({ title: "Plantilla eliminada" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      if (!testOpen) return;
      const { error } = await supabase.from("email_logs").insert({
        template_key: testOpen.key,
        recipient_email: testEmail,
        subject: `[PRUEBA] ${testOpen.subject}`,
        status: "pending",
        provider: null,
        metadata: { test: true },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-logs"] });
      setTestOpen(null);
      setTestEmail("");
      toast({
        title: "Envío de prueba encolado",
        description: "Queda registrado como pendiente hasta conectar el proveedor de correo.",
      });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (t: Template) => {
    setEditing(t.id);
    setForm({
      key: t.key,
      name: t.name,
      description: t.description ?? "",
      subject: t.subject,
      html_content: t.html_content,
      variables: (t.variables ?? []).join(", "),
      active: t.active,
    });
    setOpen(true);
  };

  const templateColumns: DataTableColumn<Template>[] = [
    { key: "name", header: "Plantilla", sortable: true, value: (t) => t.name, cell: (t) => (
      <div><p className="font-medium">{t.name}</p><p className="text-xs text-muted-foreground font-mono">{t.key}</p></div>
    ) },
    { key: "subject", header: "Asunto", sortable: true, value: (t) => t.subject, cell: (t) => <span className="text-sm">{t.subject}</span> },
    { key: "variables", header: "Variables", value: (t) => (t.variables ?? []).join(" "), cell: (t) => (
      <div className="flex flex-wrap gap-1">
        {(t.variables ?? []).slice(0, 4).map((v) => <Badge key={v} variant="outline" className="text-[10px] font-mono">{`{{${v}}}`}</Badge>)}
        {(t.variables ?? []).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
      </div>
    ) },
    { key: "active", header: "Estado", sortable: true, value: (t) => (t.active ? "Activa" : "Inactiva"), cell: (t) => (
      <Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Activa" : "Inactiva"}</Badge>
    ) },
    { key: "updated_at", header: "Actualizada", sortable: true, defaultHidden: true, value: (t) => t.updated_at, cell: (t) => (
      <span className="text-xs">{new Date(t.updated_at).toLocaleDateString("es-CL")}</span>
    ) },
  ];

  const logColumns: DataTableColumn<EmailLog>[] = [
    { key: "created_at", header: "Fecha", sortable: true, value: (l) => l.created_at, cell: (l) => (
      <span className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString("es-CL")}</span>
    ) },
    { key: "template_key", header: "Plantilla", sortable: true, value: (l) => l.template_key ?? "", cell: (l) => (
      <span className="font-mono text-xs">{l.template_key ?? "—"}</span>
    ) },
    { key: "recipient_email", header: "Destinatario", sortable: true, value: (l) => l.recipient_email, cell: (l) => l.recipient_email },
    { key: "subject", header: "Asunto", value: (l) => l.subject, cell: (l) => <span className="text-sm">{l.subject}</span> },
    { key: "status", header: "Estado", sortable: true, value: (l) => l.status, cell: (l) => statusBadge(l.status) },
    { key: "attempts", header: "Intentos", sortable: true, defaultHidden: true, value: (l) => l.attempts, cell: (l) => l.attempts },
    { key: "error_message", header: "Error", defaultHidden: true, value: (l) => l.error_message ?? "", cell: (l) => (
      <span className="text-xs text-destructive">{l.error_message ?? "—"}</span>
    ) },
  ];

  const filteredLogs = useMemo(
    () => (logsQ.data ?? []).filter((l) => logStatus === "all" || l.status === logStatus),
    [logsQ.data, logStatus]
  );

  const logStats = useMemo(() => {
    const l = logsQ.data ?? [];
    return {
      total: l.length,
      sent: l.filter((x) => x.status === "sent").length,
      pending: l.filter((x) => x.status === "pending").length,
      errors: l.filter((x) => ["error", "failed"].includes(x.status)).length,
    };
  }, [logsQ.data]);

  return (
    <div>
      <PageHeader
        title="Correos"
        description="Plantillas, envíos de prueba e historial de correos"
        icon={<Mail className="h-5 w-5" />}
        actions={
          <Button className="rounded-2xl" onClick={() => { setEditing(null); setForm({ ...EMPTY }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nueva plantilla
          </Button>
        }
      />

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-2" />Plantillas</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-4 w-4 mr-2" />Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <DataTable
            data={templatesQ.data}
            isLoading={templatesQ.isLoading}
            error={templatesQ.error}
            columns={templateColumns}
            getRowId={(t) => t.id}
            searchPlaceholder="Buscar plantilla…"
            searchFields={(t) => [t.name, t.key, t.subject]}
            exportFileName="plantillas-correo"
            emptyTitle="Sin plantillas"
            emptyDescription="Crea tu primera plantilla de correo para empezar."
            bulkActions={[
              { label: "Activar", onClick: (rows) => toggleActive.mutate({ ids: rows.map((r) => r.id), active: true }) },
              { label: "Desactivar", onClick: (rows) => toggleActive.mutate({ ids: rows.map((r) => r.id), active: false }) },
              { label: "Eliminar", destructive: true, icon: <Trash2 className="h-4 w-4" />, onClick: (rows) => remove.mutate(rows.map((r) => r.id)) },
            ]}
            rowActions={(t) => (
              <>
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => duplicate.mutate(t)}><Copy className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => setTestOpen(t)}><Send className="h-4 w-4" /></Button>
                <Button size="sm" variant="destructive" onClick={() => setToDelete(t)}><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total registros" value={logStats.total} loading={logsQ.isLoading} />
            <StatCard label="Enviados" value={logStats.sent} accent="text-emerald-600" loading={logsQ.isLoading} />
            <StatCard label="Pendientes" value={logStats.pending} accent="text-amber-600" loading={logsQ.isLoading} />
            <StatCard label="Errores" value={logStats.errors} accent="text-red-600" loading={logsQ.isLoading} />
          </div>

          <DataTable
            data={filteredLogs}
            isLoading={logsQ.isLoading}
            error={logsQ.error}
            columns={logColumns}
            getRowId={(l) => l.id}
            searchPlaceholder="Buscar por destinatario o asunto…"
            searchFields={(l) => [l.recipient_email, l.subject, l.template_key]}
            exportFileName="historial-correos"
            emptyTitle="Sin envíos registrados"
            emptyDescription="Aquí aparecerán los correos enviados, pendientes y con error."
            filters={[
              {
                key: "status",
                label: "Estado",
                value: logStatus,
                onChange: setLogStatus,
                options: [
                  { value: "all", label: "Todos los estados" },
                  { value: "sent", label: "Enviados" },
                  { value: "pending", label: "Pendientes" },
                  { value: "error", label: "Errores" },
                  { value: "failed", label: "Fallidos" },
                ],
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Clave (key)</Label>
              <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="compra-aprobada" />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Descripción</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Asunto</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Variables disponibles (separadas por comas)</Label>
              <Input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="nombre, curso, monto" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Contenido HTML</Label>
              <Textarea
                rows={12}
                className="font-mono text-xs"
                value={form.html_content}
                onChange={(e) => setForm({ ...form, html_content: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Plantilla activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending || !form.key || !form.name || !form.subject}>
              {upsert.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Envío de prueba */}
      <Dialog open={!!testOpen} onOpenChange={(v) => !v && setTestOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar correo de prueba</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Plantilla: <span className="font-medium">{testOpen?.name}</span>
            </p>
            <div className="space-y-2">
              <Label>Correo destinatario</Label>
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="tu@correo.cl" />
            </div>
            <p className="text-xs text-muted-foreground">
              El envío queda registrado en el historial como pendiente y se procesará automáticamente cuando se conecte el proveedor de correo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(null)}>Cancelar</Button>
            <Button onClick={() => sendTest.mutate()} disabled={!testEmail || sendTest.isPending}>
              <Send className="h-4 w-4 mr-2" /> Enviar prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar plantilla?"
        description={`Se eliminará "${toDelete?.name}". Esta acción no se puede deshacer.`}
        destructive
        confirmLabel="Eliminar"
        onConfirm={() => toDelete && remove.mutate([toDelete.id])}
      />
    </div>
  );
}
