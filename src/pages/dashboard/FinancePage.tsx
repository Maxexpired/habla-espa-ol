import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { KpiGrid } from "@/components/dashboard/shared/KpiGrid";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Wallet, DollarSign, TrendingUp, Receipt, Clock, XCircle, RotateCcw, ExternalLink } from "lucide-react";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

const statusMap: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  approved: { label: "Aprobada", tone: "success" },
  pending: { label: "Pendiente", tone: "warning" },
  rejected: { label: "Rechazada", tone: "danger" },
  failed: { label: "Fallida", tone: "danger" },
  refunded: { label: "Reembolsada", tone: "info" },
};

interface PurchaseRow {
  id: string;
  user_id: string;
  course_id: string;
  buy_order: string;
  amount: number;
  discount_amount: number;
  currency: string;
  payment_status: string;
  coupon_code: string | null;
  created_at: string;
  approved_at: string | null;
  refunded_at: string | null;
  course_title: string;
  email: string;
  full_name: string | null;
}

type QuickRange = "all" | "today" | "7d" | "30d" | "month";

export default function FinancePage() {
  const [status, setStatus] = useState<string>("all");
  const [quickRange, setQuickRange] = useState<QuickRange>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<PurchaseRow | null>(null);
  const navigate = useNavigate();

  const { data: purchases, isLoading, error } = useQuery({
    queryKey: ["finance-purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(
          "id, user_id, course_id, amount, discount_amount, currency, payment_status, buy_order, coupon_code, created_at, approved_at, refunded_at"
        )
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      if (!data?.length) return [] as PurchaseRow[];

      const courseIds = [...new Set(data.map((d) => d.course_id))];
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const [{ data: courses }, { data: profiles }] = await Promise.all([
        supabase.from("courses").select("id, title").in("id", courseIds),
        supabase.from("profiles").select("id, email, full_name").in("id", userIds),
      ]);
      const cMap = new Map((courses ?? []).map((c) => [c.id, c]));
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return data.map((d) => ({
        ...d,
        course_title: cMap.get(d.course_id)?.title ?? "—",
        email: pMap.get(d.user_id)?.email ?? "—",
        full_name: pMap.get(d.user_id)?.full_name ?? null,
      })) as PurchaseRow[];
    },
  });

  const quickFiltered = useMemo(() => {
    const list = purchases ?? [];
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let out = list;
    if (quickRange === "today") out = list.filter((p) => new Date(p.created_at).getTime() >= dayStart);
    else if (quickRange === "7d") out = list.filter((p) => new Date(p.created_at).getTime() >= dayStart - 6 * 86400000);
    else if (quickRange === "30d") out = list.filter((p) => new Date(p.created_at).getTime() >= dayStart - 29 * 86400000);
    else if (quickRange === "month") out = list.filter((p) => new Date(p.created_at).getTime() >= monthStart);

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      out = out.filter((p) => new Date(p.created_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000 - 1;
      out = out.filter((p) => new Date(p.created_at).getTime() <= to);
    }
    return out;
  }, [purchases, quickRange, dateFrom, dateTo]);

  const filtered = useMemo(
    () => quickFiltered.filter((p) => status === "all" || p.payment_status === status),
    [quickFiltered, status]
  );

  const totals = useMemo(() => {
    const list = purchases ?? [];
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const net = (p: PurchaseRow) => Number(p.amount || 0) - Number(p.discount_amount || 0);
    const approved = list.filter((p) => p.payment_status === "approved");
    const sum = (arr: PurchaseRow[]) => arr.reduce((s, p) => s + net(p), 0);
    return {
      today: sum(approved.filter((p) => new Date(p.created_at).getTime() >= dayStart)),
      month: sum(approved.filter((p) => new Date(p.created_at).getTime() >= monthStart)),
      total: sum(approved),
      count: approved.length,
      avg: approved.length ? sum(approved) / approved.length : 0,
      pending: list.filter((p) => p.payment_status === "pending").length,
      rejected: list.filter((p) => ["rejected", "failed"].includes(p.payment_status)).length,
      refunded: list.filter((p) => p.payment_status === "refunded").length,
    };
  }, [purchases]);

  const kpis = [
    { label: "Ventas hoy", value: currency(totals.today), icon: <Wallet className="h-4 w-4" /> },
    { label: "Ventas del mes", value: currency(totals.month), icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Ingresos totales", value: currency(totals.total), sub: `${totals.count} compras aprobadas`, icon: <DollarSign className="h-4 w-4" />, accent: "text-emerald-600" },
    { label: "Ticket promedio", value: currency(Math.round(totals.avg)), icon: <Receipt className="h-4 w-4" /> },
    { label: "Pendientes", value: totals.pending, icon: <Clock className="h-4 w-4" />, accent: "text-amber-600" },
    { label: "Rechazadas", value: totals.rejected, icon: <XCircle className="h-4 w-4" />, accent: "text-red-600" },
    { label: "Reembolsadas", value: totals.refunded, icon: <RotateCcw className="h-4 w-4" />, accent: "text-blue-600" },
  ];

  const columns: DataTableColumn<PurchaseRow>[] = [
    {
      key: "created_at",
      header: "Fecha",
      sortable: true,
      value: (p) => p.created_at,
      cell: (p) => <span className="text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleString("es-CL")}</span>,
    },
    { key: "buy_order", header: "Orden", sortable: true, value: (p) => p.buy_order, cell: (p) => <span className="font-mono text-xs">{p.buy_order}</span> },
    {
      key: "student",
      header: "Alumno",
      sortable: true,
      value: (p) => p.full_name || p.email,
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate max-w-[170px]">{p.full_name || "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[170px]">{p.email}</p>
        </div>
      ),
    },
    { key: "course_title", header: "Curso", sortable: true, value: (p) => p.course_title, cell: (p) => <span className="truncate block max-w-[200px]">{p.course_title}</span> },
    { key: "amount", header: "Monto", sortable: true, value: (p) => Number(p.amount), cell: (p) => <span className="whitespace-nowrap">{currency(Number(p.amount))}</span> },
    { key: "discount_amount", header: "Descuento", sortable: true, defaultHidden: true, value: (p) => Number(p.discount_amount), cell: (p) => currency(Number(p.discount_amount)) },
    { key: "coupon_code", header: "Cupón", defaultHidden: true, value: (p) => p.coupon_code ?? "", cell: (p) => p.coupon_code ?? "—" },
    {
      key: "payment_status",
      header: "Estado",
      sortable: true,
      value: (p) => p.payment_status,
      cell: (p) => {
        const m = statusMap[p.payment_status] ?? { label: p.payment_status, tone: "neutral" as const };
        return <StatusBadge label={m.label} tone={m.tone} />;
      },
    },
    {
      key: "approved_at",
      header: "Aprobada",
      sortable: true,
      defaultHidden: true,
      value: (p) => p.approved_at ?? "",
      cell: (p) => <span className="text-xs">{p.approved_at ? new Date(p.approved_at).toLocaleString("es-CL") : "—"}</span>,
    },
    {
      key: "refunded_at",
      header: "Reembolsada",
      sortable: true,
      defaultHidden: true,
      value: (p) => p.refunded_at ?? "",
      cell: (p) => <span className="text-xs">{p.refunded_at ? new Date(p.refunded_at).toLocaleString("es-CL") : "—"}</span>,
    },
  ];

  const quickRanges: { value: QuickRange; label: string }[] = [
    { value: "today", label: "Hoy" },
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
    { value: "month", label: "Este mes" },
    { value: "all", label: "Todo" },
  ];

  return (
    <div>
      <PageHeader
        title="Panel Financiero"
        description="Ventas, ingresos y estado de compras vía Webpay"
        icon={<Wallet className="h-5 w-5" />}
      />

      <KpiGrid items={kpis} loading={isLoading} columns={4} />

      <div className="flex flex-wrap items-center gap-3 mb-4 rounded-2xl border bg-background/60 p-3">
        <div className="flex flex-wrap gap-1.5">
          {quickRanges.map((r) => (
            <Button
              key={r.value}
              size="sm"
              variant={quickRange === r.value ? "default" : "outline"}
              className="rounded-2xl h-8"
              onClick={() => setQuickRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input type="date" className="h-8 w-[150px] rounded-xl" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-muted-foreground">a</span>
          <Input type="date" className="h-8 w-[150px] rounded-xl" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && (
            <Button size="sm" variant="ghost" className="h-8" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={filtered}
        isLoading={isLoading}
        error={error}
        columns={columns}
        getRowId={(p) => p.id}
        searchPlaceholder="Buscar por orden, alumno o curso…"
        searchFields={(p) => [p.buy_order, p.email, p.full_name, p.course_title]}
        exportFileName="finanzas"
        emptyTitle="Sin compras"
        emptyDescription="No hay compras con los filtros actuales."
        pageSize={25}
        onRowClick={(row) => setSelected(row)}
        filters={[
          {
            key: "status",
            label: "Estado",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "Todos los estados" },
              { value: "approved", label: "Aprobadas" },
              { value: "pending", label: "Pendientes" },
              { value: "rejected", label: "Rechazadas" },
              { value: "failed", label: "Fallidas" },
              { value: "refunded", label: "Reembolsadas" },
            ],
          },
        ]}
      />

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="sm:max-w-lg w-full p-0 flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b space-y-1">
            <SheetTitle>Detalle de compra</SheetTitle>
            <SheetDescription className="font-mono">{selected?.buy_order}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="flex items-center gap-2">
                {(() => {
                  const m = statusMap[selected.payment_status] ?? { label: selected.payment_status, tone: "neutral" as const };
                  return <StatusBadge label={m.label} tone={m.tone} />;
                })()}
                {selected.coupon_code && <Badge variant="outline">Cupón: {selected.coupon_code}</Badge>}
              </div>

              <div className="rounded-2xl border p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Alumno</p>
                <p className="font-medium">{selected.full_name || "Sin nombre"}</p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                <Button size="sm" variant="outline" className="rounded-xl mt-1" onClick={() => navigate("/dashboard/enrollments")}>
                  Ver alumno <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </Button>
              </div>

              <div className="rounded-2xl border p-4 space-y-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Curso</p>
                <p className="font-medium">{selected.course_title}</p>
                <Button size="sm" variant="outline" className="rounded-xl mt-1" onClick={() => navigate("/dashboard/courses")}>
                  Ver curso <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </Button>
              </div>

              <div className="rounded-2xl border p-4 space-y-2 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Montos</p>
                <div className="flex justify-between"><span>Monto</span><span className="font-medium">{currency(Number(selected.amount))}</span></div>
                <div className="flex justify-between"><span>Descuento</span><span>{currency(Number(selected.discount_amount))}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Neto</span>
                  <span>{currency(Number(selected.amount) - Number(selected.discount_amount))}</span>
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-2 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Fechas</p>
                <div className="flex justify-between"><span>Creada</span><span>{new Date(selected.created_at).toLocaleString("es-CL")}</span></div>
                <div className="flex justify-between"><span>Aprobada</span><span>{selected.approved_at ? new Date(selected.approved_at).toLocaleString("es-CL") : "—"}</span></div>
                <div className="flex justify-between"><span>Reembolsada</span><span>{selected.refunded_at ? new Date(selected.refunded_at).toLocaleString("es-CL") : "—"}</span></div>
              </div>

              <div className="rounded-2xl border p-4 space-y-2 text-sm">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Transbank</p>
                <div className="flex justify-between"><span>Buy order</span><span className="font-mono text-xs">{selected.buy_order}</span></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
