import { ReactNode, useMemo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid,
  Rows3,
  Columns3,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";

export type DataTableView = "table" | "cards" | "list" | "kanban";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** value used for sorting and CSV export */
  value?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  defaultHidden?: boolean;
  className?: string;
  hideable?: boolean;
}

export interface DataTableFilter {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export interface DataTableBulkAction<T> {
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  onClick: (rows: T[]) => void | Promise<void>;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: unknown;
  searchPlaceholder?: string;
  searchFields?: (row: T) => (string | null | undefined)[];
  filters?: DataTableFilter[];
  bulkActions?: DataTableBulkAction<T>[];
  rowActions?: (row: T) => ReactNode;
  toolbarActions?: ReactNode;
  exportFileName?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Views supported by the module. Defaults to table only. */
  views?: DataTableView[];
  defaultView?: DataTableView;
  /** Card renderer, required when "cards" view is enabled */
  renderCard?: (row: T) => ReactNode;
  /** Compact list renderer, required when "list" view is enabled */
  renderListItem?: (row: T) => ReactNode;
  /** Kanban grouping (prepared for future use) */
  kanban?: {
    columns: { key: string; label: string }[];
    groupOf: (row: T) => string;
  };
  /** Called when the row body is clicked (opens the side panel) */
  onRowClick?: (row: T) => void;
}

const viewIcons: Record<DataTableView, ReactNode> = {
  table: <TableIcon className="h-4 w-4" />,
  cards: <LayoutGrid className="h-4 w-4" />,
  list: <Rows3 className="h-4 w-4" />,
  kanban: <Columns3 className="h-4 w-4" />,
};

const viewLabels: Record<DataTableView, string> = {
  table: "Tabla",
  cards: "Tarjetas",
  list: "Lista",
  kanban: "Kanban",
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading,
  error,
  searchPlaceholder = "Buscar...",
  searchFields,
  filters = [],
  bulkActions = [],
  rowActions,
  toolbarActions,
  exportFileName,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  emptyAction,
  views = ["table"],
  defaultView,
  renderCard,
  renderListItem,
  kanban,
  onRowClick,
}: DataTableProps<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<DataTableView>(defaultView ?? views[0] ?? "table");
  const searchRef = useRef<HTMLInputElement>(null);
  const [hidden, setHidden] = useState<string[]>(
    columns.filter((c) => c.defaultHidden).map((c) => c.key)
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const editing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (editing) return;
      if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (q && searchFields) {
      const t = q.toLowerCase();
      rows = rows.filter((r) =>
        searchFields(r).some((f) => (f ?? "").toString().toLowerCase().includes(t))
      );
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.value) {
        rows = [...rows].sort((a, b) => {
          const av = col.value!(a) ?? "";
          const bv = col.value!(b) ?? "";
          if (typeof av === "number" && typeof bv === "number") {
            return sort.dir === "asc" ? av - bv : bv - av;
          }
          return sort.dir === "asc"
            ? String(av).localeCompare(String(bv), "es")
            : String(bv).localeCompare(String(av), "es");
        });
      }
    }
    return rows;
  }, [data, q, sort, columns, searchFields]);

  useEffect(() => {
    setPage(1);
  }, [q, perPage, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const selectedRows = (data ?? []).filter((r) => selected.includes(getRowId(r)));
  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(getRowId(r)));

  const toggleAllPage = () => {
    const ids = pageRows.map(getRowId);
    setSelected((prev) =>
      allPageSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const toggleSort = (key: string) => {
    setSort((prev) =>
      prev?.key === key
        ? prev.dir === "asc"
          ? { key, dir: "desc" }
          : null
        : { key, dir: "asc" }
    );
  };

  const exportCsv = () => {
    const cols = visibleColumns;
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      cols.map((c) => escape(c.header)).join(","),
      ...filtered.map((row) =>
        cols.map((c) => escape(c.value ? c.value(row) : "")).join(",")
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName || "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {searchFields && (
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 pr-10 rounded-2xl transition-shadow focus-visible:shadow-sm"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              F
            </kbd>
          </div>
        )}

        {filters.map((f) => (
          <Select key={f.key} value={f.value} onValueChange={f.onChange}>
            <SelectTrigger className="w-[170px] rounded-2xl">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-2xl">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Columnas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns
              .filter((c) => c.hideable !== false)
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={!hidden.includes(c.key)}
                  onCheckedChange={(v) =>
                    setHidden((prev) =>
                      v ? prev.filter((k) => k !== c.key) : [...prev, c.key]
                    )
                  }
                >
                  {c.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="rounded-2xl" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> CSV
        </Button>

        {toolbarActions}
      </div>

      {/* Bulk bar */}
      {bulkActions.length > 0 && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/40 px-4 py-2">
          <Badge variant="secondary">{selected.length} seleccionados</Badge>
          {bulkActions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.destructive ? "destructive" : "outline"}
              className="rounded-2xl"
              onClick={async () => {
                await a.onClick(selectedRows);
                setSelected([]);
              }}
            >
              {a.icon}
              <span className={a.icon ? "ml-2" : ""}>{a.label}</span>
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Limpiar
          </Button>
        </div>
      )}

      {/* Body */}
      {error ? (
        <div className="flex items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium">No se pudieron cargar los datos</p>
            <p className="text-muted-foreground">
              {(error as Error)?.message || "Error desconocido"}
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <LoadingState rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? (q ? "Sin resultados" : "Sin datos todavía")}
          description={
            emptyDescription ??
            (q ? "Prueba con otros términos de búsqueda o filtros." : undefined)
          }
          action={emptyAction}
        />
      ) : (
        <div className="rounded-3xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  {bulkActions.length > 0 && (
                    <TableHead className="w-10">
                      <Checkbox checked={allPageSelected} onCheckedChange={toggleAllPage} />
                    </TableHead>
                  )}
                  {visibleColumns.map((c) => (
                    <TableHead key={c.key} className={c.className}>
                      {c.sortable && c.value ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {c.header}
                          {sort?.key === c.key ? (
                            sort.dir === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                    </TableHead>
                  ))}
                  {rowActions && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => {
                  const id = getRowId(row);
                  return (
                    <TableRow key={id}>
                      {bulkActions.length > 0 && (
                        <TableCell>
                          <Checkbox
                            checked={selected.includes(id)}
                            onCheckedChange={(v) =>
                              setSelected((prev) =>
                                v ? [...prev, id] : prev.filter((s) => s !== id)
                              )
                            }
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((c) => (
                        <TableCell key={c.key} className={c.className}>
                          {c.cell(row)}
                        </TableCell>
                      ))}
                      {rowActions && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">{rowActions(row)}</div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {filtered.length} registro{filtered.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                <SelectTrigger className="h-8 w-[110px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-xl"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-xl"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
