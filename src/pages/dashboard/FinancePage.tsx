import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { DataTable, DataTableColumn } from "@/components/dashboard/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

const currency = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

const statusMap: Record<string, { label: string; cls: string }> = {
  approved: { label: "Aprobada", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700 border-red-200" },
  failed: { label: "Fallida", cls: "bg-red-100 text-red-700 border-red-200" },
  refunded: { label: "Reembolsada", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

interface PurchaseRow {
  id: string;
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

export default function FinancePage() {
  const [status, setStatus] = useState<string>("all");

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

  const filtered = useMemo(
    () => (purchases ?? []).filter((p) => status === "all" || p.payment_status === status),
    [purchases, status]
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
        const m = statusMap[p.payment_status] ?? { label: p.payment_status, cls: "" };
        return <Badge variant="outline" className={m.cls}>{m.label}</Badge>;
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

  return (
    <div>
      <PageHeader
        title="Panel Financiero"
        description="Ventas, ingresos y estado de compras vía Webpay"
        icon={<Wallet className="h-5 w-5" />}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard label="Ventas hoy" value={currency(totals.today)} loading={isLoading} />
        <StatCard label="Ventas del mes" value={currency(totals.month)} loading={isLoading} />
        <StatCard label="Ingresos totales" value={currency(totals.total)} sub={`${totals.count} compras aprobadas`} loading={isLoading} />
        <StatCard label="Ticket promedio" value={currency(Math.round(totals.avg))} loading={isLoading} />
      </div>

      <div className="grid gap-4 grid-cols-3 mb-6">
        <StatCard label="Pendientes" value={totals.pending} accent="text-amber-600" loading={isLoading} />
        <StatCard label="Rechazadas" value={totals.rejected} accent="text-red-600" loading={isLoading} />
        <StatCard label="Reembolsadas" value={totals.refunded} accent="text-blue-600" loading={isLoading} />
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
    </div>
  );
}
