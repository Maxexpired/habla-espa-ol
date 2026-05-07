import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle, XCircle, Clock, AlertCircle, Copy } from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  account_holder: string;
  rut: string;
  email: string;
}

interface CourseOrder {
  id: string;
  status: string;
  rejection_reason: string | null;
}

interface BankTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  price: number;
  currency: string;
  userId: string;
  onOrderCreated: () => void;
}

const formatPrice = (price: number, currency: string) => {
  return `$${price.toLocaleString("es-CL")} ${currency || "CLP"}`;
};

export function BankTransferModal({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  price,
  currency,
  userId,
  onOrderCreated,
}: BankTransferModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [existingOrder, setExistingOrder] = useState<CourseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [open, courseId]);

  const fetchData = async () => {
    setLoading(true);
    const [accountsRes, ordersRes] = await Promise.all([
      supabase.from("bank_accounts").select("*").eq("active", true),
      supabase
        .from("course_orders")
        .select("id, status, rejection_reason")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .in("status", ["pending_payment", "pending_review", "rejected"])
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    if (accountsRes.data) setBankAccounts(accountsRes.data);
    if (ordersRes.data && ordersRes.data.length > 0) {
      setExistingOrder(ordersRes.data[0]);
    } else {
      setExistingOrder(null);
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Archivo muy grande", description: "El archivo no puede superar los 10MB", variant: "destructive" });
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Tipo no permitido", description: "Solo se permiten imágenes (JPG, PNG, WEBP) o PDF", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({ title: "Selecciona un comprobante", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      let orderId = existingOrder?.id;

      if (!orderId) {
        const { data: order, error: orderError } = await supabase
          .from("course_orders")
          .insert({
            user_id: userId,
            course_id: courseId,
            amount: price,
            currency: currency || "CLP",
            status: "pending_review",
          })
          .select("id")
          .single();

        if (orderError) throw orderError;
        orderId = order.id;
      } else {
        const { error: updateError } = await supabase
          .from("course_orders")
          .update({ status: "pending_review", rejection_reason: null })
          .eq("id", orderId);
        if (updateError) throw updateError;
      }

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${orderId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      const { error: proofError } = await supabase.from("payment_proofs").insert({
        order_id: orderId,
        user_id: userId,
        file_url: urlData.publicUrl,
        file_name: selectedFile.name,
      });

      if (proofError) throw proofError;

      toast({
        title: "¡Comprobante enviado!",
        description: "Tu comprobante fue enviado. Un administrador lo revisará pronto.",
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      onOrderCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el comprobante",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado al portapapeles" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprar Curso</DialogTitle>
          <DialogDescription>Realiza una transferencia bancaria para adquirir el curso</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="font-semibold">{courseTitle}</p>
              <p className="text-2xl font-bold text-serene-primary mt-1">
                {formatPrice(price, currency)}
              </p>
            </div>

            {existingOrder && existingOrder.status === "pending_review" && (
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-blue-800">Comprobante en revisión</p>
                </div>
                <p className="text-sm text-blue-700">
                  Ya enviaste un comprobante para este curso. Un administrador lo revisará pronto.
                </p>
              </div>
            )}

            {existingOrder && existingOrder.status === "rejected" && (
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="font-semibold text-red-800">Pago rechazado</p>
                </div>
                {existingOrder.rejection_reason && (
                  <p className="text-sm text-red-700">Motivo: {existingOrder.rejection_reason}</p>
                )}
                <p className="text-sm text-red-700">Puedes volver a enviar un comprobante.</p>
              </div>
            )}

            {bankAccounts.length === 0 ? (
              <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    No hay datos bancarios configurados. Contacta al administrador.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Datos para transferencia
                </h3>
                {bankAccounts.map((account) => (
                  <div key={account.id} className="p-4 rounded-lg border space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Banco</span>
                      <span className="font-medium">{account.bank_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium">{account.account_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">N° Cuenta</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{account.account_number}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(account.account_number)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Titular</span>
                      <span className="font-medium">{account.account_holder}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">RUT</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{account.rut}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(account.rut)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{account.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(!existingOrder || existingOrder.status !== "pending_review") && bankAccounts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Subir comprobante de transferencia
                </h3>

                <div className="relative border-2 border-dashed rounded-lg p-6 text-center">
                  {previewUrl ? (
                    <div className="space-y-3">
                      <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded" />
                      <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                    </div>
                  ) : selectedFile ? (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Arrastra o selecciona tu comprobante
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WEBP o PDF (máx. 10MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!selectedFile || uploading}
                  onClick={handleSubmit}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Enviar comprobante
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
