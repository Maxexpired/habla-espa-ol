import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Loader2, Plus, Trash2, Pencil, DollarSign, Building } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CourseOrder {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  course_title?: string;
  user_email?: string;
  user_name?: string;
  proof_url?: string;
  proof_name?: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder: string;
  rut: string;
  email: string;
  active: boolean;
}

const formatPrice = (price: number, currency: string) => {
  return `$${price.toLocaleString("es-CL")} ${currency || "CLP"}`;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_payment: { label: "Pendiente de pago", variant: "outline" },
  pending_review: { label: "En revisión", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "outline" },
};

export function PaymentsManager() {
  const [orders, setOrders] = useState<CourseOrder[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CourseOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({
    bank_name: "",
    account_type: "",
    account_number: "",
    account_holder: "",
    rut: "",
    email: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchBankAccounts();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: ordersData, error } = await supabase
      .from("course_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !ordersData) {
      setLoading(false);
      return;
    }

    // Enrich with course titles, user info, and proofs
    const enriched = await Promise.all(
      ordersData.map(async (order) => {
        const [courseRes, profileRes, proofRes] = await Promise.all([
          supabase.from("courses").select("title").eq("id", order.course_id).single(),
          supabase.from("profiles").select("email, full_name").eq("id", order.user_id).single(),
          supabase.from("payment_proofs").select("file_url, file_name").eq("order_id", order.id).order("uploaded_at", { ascending: false }).limit(1),
        ]);

        return {
          ...order,
          course_title: courseRes.data?.title || "Curso desconocido",
          user_email: profileRes.data?.email || "—",
          user_name: profileRes.data?.full_name || "—",
          proof_url: proofRes.data?.[0]?.file_url,
          proof_name: proofRes.data?.[0]?.file_name,
        };
      })
    );

    setOrders(enriched);
    setLoading(false);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase.from("bank_accounts").select("*").order("created_at", { ascending: false });
    if (data) setBankAccounts(data);
  };

  const handleApprove = async (order: CourseOrder) => {
    setProcessing(true);
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from("course_orders")
        .update({ status: "approved" })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Create enrollment
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", order.user_id)
        .eq("course_id", order.course_id)
        .maybeSingle();

      if (!existing) {
        const { error: enrollError } = await supabase.from("enrollments").insert({
          user_id: order.user_id,
          course_id: order.course_id,
          status: "active",
        });
        if (enrollError) throw enrollError;
      } else {
        await supabase
          .from("enrollments")
          .update({ status: "active" })
          .eq("id", existing.id);
      }

      toast({ title: "Pago aprobado", description: "El usuario ya tiene acceso al curso." });
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason.trim()) {
      toast({ title: "Ingresa un motivo de rechazo", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("course_orders")
        .update({ status: "rejected", rejection_reason: rejectionReason.trim() })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({ title: "Pago rechazado" });
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveBank = async () => {
    const { bank_name, account_type, account_number, account_holder, rut, email } = bankForm;
    if (!bank_name || !account_type || !account_number || !account_holder || !rut || !email) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }

    try {
      if (editingBank) {
        const { error } = await supabase.from("bank_accounts").update(bankForm).eq("id", editingBank.id);
        if (error) throw error;
        toast({ title: "Cuenta actualizada" });
      } else {
        const { error } = await supabase.from("bank_accounts").insert({ ...bankForm, active: true });
        if (error) throw error;
        toast({ title: "Cuenta creada" });
      }

      setShowBankForm(false);
      setEditingBank(null);
      setBankForm({ bank_name: "", account_type: "", account_number: "", account_holder: "", rut: "", email: "" });
      fetchBankAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta bancaria?")) return;
    await supabase.from("bank_accounts").delete().eq("id", id);
    fetchBankAccounts();
  };

  const pendingOrders = orders.filter((o) => o.status === "pending_review");
  const otherOrders = orders.filter((o) => o.status !== "pending_review");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="all">Todas las órdenes</TabsTrigger>
          <TabsTrigger value="banks">Cuentas bancarias</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : pendingOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay pagos pendientes de revisión</p>
          ) : (
            pendingOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{order.course_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user_name} ({order.user_email})
                      </p>
                      <p className="text-lg font-bold text-serene-primary">
                        {formatPrice(order.amount, order.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {order.proof_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowProofDialog(true);
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" /> Ver comprobante
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={processing}
                        onClick={() => handleApprove(order)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" /> Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={processing}
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRejectDialog(true);
                        }}
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay órdenes registradas</p>
          ) : (
            orders.map((order) => {
              const st = statusLabels[order.status] || { label: order.status, variant: "outline" as const };
              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{order.course_title}</p>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.user_name} ({order.user_email})
                        </p>
                        <p className="text-lg font-bold text-serene-primary">
                          {formatPrice(order.amount, order.currency)}
                        </p>
                        {order.rejection_reason && (
                          <p className="text-sm text-red-600">Motivo: {order.rejection_reason}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {order.proof_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowProofDialog(true);
                            }}
                          >
                            <Eye className="mr-1 h-4 w-4" /> Ver comprobante
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="banks" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingBank(null); setBankForm({ bank_name: "", account_type: "", account_number: "", account_holder: "", rut: "", email: "" }); setShowBankForm(true); }}>
              <Plus className="mr-1 h-4 w-4" /> Agregar cuenta
            </Button>
          </div>

          {bankAccounts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay cuentas bancarias configuradas</p>
          ) : (
            bankAccounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold flex items-center gap-2">
                        <Building className="h-4 w-4" /> {account.bank_name}
                        {!account.active && <Badge variant="outline">Inactiva</Badge>}
                      </p>
                      <p>{account.account_type} — {account.account_number}</p>
                      <p>{account.account_holder} — RUT: {account.rut}</p>
                      <p>{account.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingBank(account);
                          setBankForm({
                            bank_name: account.bank_name,
                            account_type: account.account_type,
                            account_number: account.account_number,
                            account_holder: account.account_holder,
                            rut: account.rut,
                            email: account.email,
                          });
                          setShowBankForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteBank(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pago</DialogTitle>
            <DialogDescription>Ingresa el motivo del rechazo</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo del rechazo..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={processing} onClick={handleReject}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rechazar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof viewer dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprobante de pago</DialogTitle>
            <DialogDescription>{selectedOrder?.proof_name}</DialogDescription>
          </DialogHeader>
          {selectedOrder?.proof_url && (
            <div className="max-h-[60vh] overflow-auto">
              {selectedOrder.proof_url.match(/\.pdf$/i) ? (
                <iframe src={selectedOrder.proof_url} className="w-full h-[60vh]" />
              ) : (
                <img src={selectedOrder.proof_url} alt="Comprobante" className="w-full rounded" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bank form dialog */}
      <Dialog open={showBankForm} onOpenChange={setShowBankForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBank ? "Editar cuenta" : "Nueva cuenta bancaria"}</DialogTitle>
            <DialogDescription>Estos datos se mostrarán a los usuarios al momento de pagar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Banco</Label><Input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="Ej: Banco Estado" /></div>
            <div><Label>Tipo de cuenta</Label><Input value={bankForm.account_type} onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })} placeholder="Ej: Cuenta Corriente" /></div>
            <div><Label>Número de cuenta</Label><Input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} /></div>
            <div><Label>Titular</Label><Input value={bankForm.account_holder} onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })} /></div>
            <div><Label>RUT</Label><Input value={bankForm.rut} onChange={(e) => setBankForm({ ...bankForm, rut: e.target.value })} placeholder="Ej: 12.345.678-9" /></div>
            <div><Label>Email</Label><Input type="email" value={bankForm.email} onChange={(e) => setBankForm({ ...bankForm, email: e.target.value })} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBankForm(false)}>Cancelar</Button>
              <Button onClick={handleSaveBank}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
