import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { LoadingState } from "@/components/dashboard/shared/LoadingState";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Download, Search } from "lucide-react";

const currency = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; cls: string }> = {
  approved: { label: "Aprobada", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700 border-red-200" },
  failed: { label: "Fallida", cls: "bg-red-100 text-red-700 border-red-200" },
  refunded: { label: "Reembolsada", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

export default function FinancePage() {
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["finance-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, user_id, course_id, amount, discount_amount, currency, payment_status, buy_order, created_at, approved_at, refunded_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!data?.length) return [];
      const courseIds = [...new Set(data.map((d) => d.course_id))];
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const [{ data: courses }, { data: profiles }] = await Promise.all([
        supabase.from("courses").select("id, title").in("id", courseIds),
        supabase.from("profiles").select("id, email, full_name").in("id", userIds),
      ]);
      const cMap = new Map((courses || []).map((c) => [c.id, c]));
      const pMap = new Map((profiles || []).map((p) => [p.id, p]));
      return data.map((d) => ({ ...d, course: cMap.get(d.course_id), user: pMap.get(d.user_id) }));
    },
  });

  const filtered = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter((p: any) => {
      if (status !== "all" && p.payment_status !== status) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!(
          p.course?.title?.toLowerCase().includes(t) ||
          p.user?.email?.toLowerCase().includes(t) ||
          p.user?.full_name?.toLowerCase().includes(t) ||
          p.buy_order?.toLowerCase().includes(t)
        )) return false;
      }
      return true;
    });
  }, [purchases, status, q]);

  const totals = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const approved = (purchases || []).filter((p: any) => p.payment_status === "approved");
    const sum = (arr: any[]) => arr.reduce((s, p) => s + Number(p.amount || 0) - Number(p.discount_amount || 0), 0);
    const today = approved.filter((p: any) => new Date(p.created_at).getTime() >= dayStart);
    const month = approved.filter((p: any) => new Date(p.created_at).getTime() >= monthStart);
    return {
      today: sum(today),
      month: sum(month),
      total: sum(approved),
      count: approved.length,
      avg: approved.length ? sum(approved) / approved.length : 0,
      pending: (purchases || []).filter((p: any) => p.payment_status === "pending").length,
      rejected: (purchases || []).filter((p: any) => ["rejected", "failed"].includes(p.payment_status)).length,
      refunded: (purchases || []).filter((p: any) => p.payment_status === "refunded").length,
    };
  }, [purchases]);

  const exportCsv = () => {
    const rows = [
      ["Fecha", "Orden", "Alumno", "Email", "Curso", "Monto", "Descuento", "Estado"],
      ...filtered.map((p: any) => [
        new Date(p.created_at).toISOString(),
        p.buy_order,
        p.user?.full_name || "",
        p.user?.email || "",
        p.course?.title || "",
        p.amount,
        p.discount_amount,
        p.payment_status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finanzas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: "Ventas hoy", value: currency(totals.today) },
    { label: "Ventas del mes", value: currency(totals.month) },
    { label: "Ingresos totales", value: currency(totals.total), sub: `${totals.count} compras aprobadas` },
    { label: "Ticket promedio", value: currency(Math.round(totals.avg)) },
  ];

  return (
    <div>
      <PageHeader
        title="Panel Financiero"
        description="Ventas, ingresos y estado de compras vía Webpay"
        icon={<Wallet className="h-5 w-5" />}
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        }
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
        {kpis.map((k) => (
          <Card key={k.label} className="rounded-3xl">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold mt-2">{k.value}</p>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-3 mb-6">
        <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-xs uppercase text-muted-foreground">Pendientes</p><p className="text-xl font-semibold text-amber-600">{totals.pending}</p></CardContent></Card>
        <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-xs uppercase text-muted-foreground">Rechazadas</p><p className="text-xl font-semibold text-red-600">{totals.rejected}</p></CardContent></Card>
        <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-xs uppercase text-muted-foreground">Reembolsadas</p><p className="text-xl font-semibold text-blue-600">{totals.refunded}</p></CardContent></Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Compras</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 sm:w-64" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="approved">Aprobadas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="failed">Fallidas</SelectItem>
                <SelectItem value="refunded">Reembolsadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState title="Sin compras" description="No hay compras con los filtros actuales." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2">Fecha</th>
                    <th>Orden</th>
                    <th>Alumno</th>
                    <th>Curso</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => {
                    const m = statusMap[p.payment_status] || { label: p.payment_status, cls: "" };
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="py-2 whitespace-nowrap">{new Date(p.created_at).toLocaleString("es-CL")}</td>
                        <td className="font-mono text-xs">{p.buy_order}</td>
                        <td className="max-w-[180px] truncate">{p.user?.full_name || p.user?.email || "—"}</td>
                        <td className="max-w-[220px] truncate">{p.course?.title || "—"}</td>
                        <td>{currency(Number(p.amount || 0))}</td>
                        <td><Badge variant="outline" className={m.cls}>{m.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
