import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

interface PurchaseRow {
  id: string;
  amount: number;
  currency: string;
  payment_status: string;
  authorization_code: string | null;
  transaction_date: string | null;
  approved_at: string | null;
  created_at: string;
  buy_order: string;
  courses: { title: string } | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    approved: { label: "Aprobado", variant: "default" },
    pending: { label: "Pendiente", variant: "secondary" },
    rejected: { label: "Rechazado", variant: "destructive" },
    cancelled: { label: "Cancelado", variant: "outline" },
    failed: { label: "Fallido", variant: "destructive" },
  };
  const cfg = map[status] || { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const money = (n: number, c: string) => `$${Number(n).toLocaleString("es-CL")} ${c || "CLP"}`;

export function MyPurchases() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, amount, currency, payment_status, authorization_code, transaction_date, approved_at, created_at, buy_order, courses:course_id(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-serene-primary" />
          Mis Compras
        </CardTitle>
        <CardDescription>Historial de tus compras de cursos.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has realizado ninguna compra.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-medium">{r.courses?.title || "Curso"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.approved_at || r.transaction_date || r.created_at).toLocaleString("es-CL")}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">Orden: {r.buy_order}</div>
                  {r.authorization_code && (
                    <div className="text-xs text-muted-foreground font-mono">Autorización: {r.authorization_code}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{money(r.amount, r.currency)}</span>
                  {statusBadge(r.payment_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
