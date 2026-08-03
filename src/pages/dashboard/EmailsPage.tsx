import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { EditSheet } from "@/components/dashboard/shared/EditSheet";
import { RowActions } from "@/components/dashboard/shared/RowActions";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Mail, Plus, Edit, Copy, Trash2, Send, FileText, History,
  CheckCircle2, XCircle, Wand2, Eye,
} from "lucide-react";

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

const logStatusTone = (s: string): "success" | "warning" | "danger" | "neutral" => {
  if (s === "sent") return "success";
  if (s === "pending") return "warning";
  if (s === "error" || s === "failed") return "danger";
  return "neutral";
};

const logLabels: Record<string, string> = { sent: "Enviado", pending: "Pendiente", error: "Error", failed: "Fallido" };

// Very basic sanitizer for the live preview: strips script/style/event-handler
// attributes so admin-authored HTML can't execute JS inside the dashboard.
const sanitizeHtml = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
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

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

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
      <StatusBadge label={t.active ? "Activa" : "Inactiva"} tone={t.active ? "success" : "muted"} />
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
    { key: "status", header: "Estado", sortable: true, value: (l) => l.status, cell: (l) => (
      <StatusBadge label={logLabels[l.status] ?? l.status} tone={logStatusTone(l.status)} />
    ) },
    { key: "attempts", header: "Intentos", sortable: true, defaultHidden: true, value: (l) => l.attempts, cell: (l) => l.attempts },
    { key: "error_message", header: "Error", defaultHidden: true, value: (l) => l.error_message ?? "", cell: (l) => (
      <span className="text-xs text-destructive">{l.error_message ?? "—"}</span>
    ) },
  ];

  const filteredLogs = useMemo(
    () => (logsQ.data ?? []).filter((l) => logStatus === "all" || l.status === logStatus),
    [logsQ.data, logStatus]
  );

  const templates = templatesQ.data ?? [];
  const logs = logsQ.data ?? [];

  const kpis = [
    { label: "Plantillas", value: templates.length, icon: <FileText className="h-4 w-4" /> },
    { label: "Activas", value: templates.filter((t) => t.active).length, icon: <CheckCircle2 className="h-4 w-4" />, accent: "text-emerald-600" },
    { label: "Enviados", value: logs.filter((l) => l.status === "sent").length, icon: <Send className="h-4 w-4" />, accent: "text-blue-600" },
    { label: "Errores", value: logs.filter((l) => ["error", "failed"].includes(l.status)).length, icon: <XCircle className="h-4 w-4" />, accent: "text-red-600" },
  ];

  const rowActions = (t: Template) => (
    <RowActions
      actions={[
        { label: "Editar", icon: <Edit className="h-4 w-4" />, inline: true, onClick: () => openEdit(t) },
        { label: "Duplicar", icon: <Copy className="h-4 w-4" />, onClick: () => duplicate.mutate(t) },
        t.active
          ? { label: "Desactivar", icon: <XCircle className="h-4 w-4" />, onClick: () => toggleActive.mutate({ ids: [t.id], active: false }) }
          : { label: "Activar", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => toggleActive.mutate({ ids: [t.id], active: true }) },
        { label: "Enviar prueba", icon: <Send className="h-4 w-4" />, inline: true, onClick: () => setTestOpen(t) },
        { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: () => setToDelete(t) },
      ]}
    />
  );

  return (
    <div>
      <PageHeader
        title="Correos"
        description="Plantillas, envíos de prueba e historial de correos"
        icon={<Mail className="h-5 w-5" />}
        actions={
          <Button className="rounded-2xl" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nueva plantilla
          </Button>
        }
      />

      <KpiGrid items={kpis} loading={templatesQ.isLoading || logsQ.isLoading} />

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
            onRowClick={openEdit}
            bulkActions={[
              { label: "Activar", onClick: (rows) => toggleActive.mutate({ ids: rows.map((r) => r.id), active: true }) },
              { label: "Desactivar", onClick: (rows) => toggleActive.mutate({ ids: rows.map((r) => r.id), active: false }) },
              { label: "Eliminar", destructive: true, icon: <Trash2 className="h-4 w-4" />, onClick: (rows) => remove.mutate(rows.map((r) => r.id)) },
            ]}
            rowActions={rowActions}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
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
      <EditSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Editar plantilla" : "Nueva plantilla"}
        description="Guarda con Ctrl + S o cierra con Esc."
        onSubmit={() => upsert.mutate()}
        saving={upsert.isPending}
        submitLabel={editing ? "Guardar cambios" : "Crear plantilla"}
        width="xl"
        aside={
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="rounded-2xl mb-3">
              <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1.5" />Vista previa</TabsTrigger>
              <TabsTrigger value="visual"><Wand2 className="h-3.5 w-3.5 mr-1.5" />Editor visual</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="space-y-3 mt-0">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Asunto</p>
                <p className="font-medium text-sm">{form.subject || "Sin asunto"}</p>
              </div>
              <div className="rounded-xl border bg-background p-3 max-h-64 overflow-auto">
                {form.html_content ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.html_content) }} />
                ) : (
                  <p className="text-xs text-muted-foreground">Sin contenido HTML todavía.</p>
                )}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Variables</p>
                <div className="flex flex-wrap gap-1">
                  {form.variables.split(",").map((v) => v.trim()).filter(Boolean).map((v) => (
                    <Badge key={v} variant="outline" className="text-[10px] font-mono">{`{{${v}}}`}</Badge>
                  ))}
                  {!form.variables.trim() && <span className="text-xs text-muted-foreground">Sin variables definidas</span>}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="visual" className="mt-0">
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Editor visual (próximamente) — por ahora edita el HTML directamente en el formulario.
              </div>
            </TabsContent>
          </Tabs>
        }
      >
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
      </EditSheet>

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
