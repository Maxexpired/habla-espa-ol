import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InspectorPanel } from "@/components/dashboard/shared/InspectorPanel";
import { PropertyGroup, PropertyRow, PropertyMeta } from "@/components/dashboard/shared/PropertiesPanel";
import { MediaPickerButton } from "./MediaLibraryDialog";
import type { CourseLesson, LessonBlock } from "@/types/lms";
import { BLOCK_MAP } from "@/types/lms";

interface Props {
  lesson?: CourseLesson | null;
  block?: LessonBlock | null;
  courseId?: string;
  onUpdateLesson: (patch: Partial<CourseLesson>) => void;
  onUpdateBlock: (patch: Partial<LessonBlock>) => void;
}

/** Debounced text field: autosaves while the admin types. */
const AutoInput = ({
  value,
  onCommit,
  multiline,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}) => {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => setLocal(value ?? ""), [value]);
  useEffect(() => {
    if ((value ?? "") === local) return;
    const t = setTimeout(() => onCommit(local), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  const Comp = multiline ? Textarea : Input;
  return (
    <Comp
      {...rest}
      value={local}
      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocal(e.target.value)}
      className={`rounded-xl ${rest.className ?? ""}`}
    />
  );
};

const toLocalInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

/** Right column of the builder: lesson & block properties. */
export const BlockInspector = ({ lesson, block, courseId, onUpdateLesson, onUpdateBlock }: Props) => {
  const def = block ? BLOCK_MAP[block.type] : undefined;
  const content = (block?.content ?? {}) as Record<string, unknown>;

  const setContent = (patch: Record<string, unknown>) =>
    onUpdateBlock({ content: { ...content, ...patch } as Record<string, unknown> });

  const listEditor = (key: string, label: string) => {
    const items = ((content[key] as string[]) ?? []) as string[];
    return (
      <PropertyGroup title={label}>
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <AutoInput
              value={item}
              onCommit={(v) => {
                const next = [...items];
                next[i] = v;
                setContent({ [key]: next });
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 rounded-xl"
              onClick={() => setContent({ [key]: items.filter((_, j) => j !== i) })}
            >
              ×
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => setContent({ [key]: [...items, ""] })}>
          Añadir elemento
        </Button>
      </PropertyGroup>
    );
  };

  const pairEditor = (key: string, a: string, b: string, labelA: string, labelB: string) => {
    const items = ((content[key] as Record<string, string>[]) ?? []) as Record<string, string>[];
    return (
      <PropertyGroup title="Elementos">
        {items.map((item, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-2">
            <AutoInput placeholder={labelA} value={item[a] ?? ""} onCommit={(v) => {
              const next = [...items];
              next[i] = { ...next[i], [a]: v };
              setContent({ [key]: next });
            }} />
            <AutoInput placeholder={labelB} value={item[b] ?? ""} onCommit={(v) => {
              const next = [...items];
              next[i] = { ...next[i], [b]: v };
              setContent({ [key]: next });
            }} />
            <Button size="sm" variant="ghost" className="w-full rounded-xl text-destructive" onClick={() => setContent({ [key]: items.filter((_, j) => j !== i) })}>
              Quitar
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => setContent({ [key]: [...items, { [a]: "", [b]: "" }] })}>
          Añadir
        </Button>
      </PropertyGroup>
    );
  };

  const blockContentEditor = () => {
    if (!block) return null;
    switch (block.type) {
      case "video":
      case "iframe":
      case "embed":
        return (
          <PropertyGroup title="Fuente">
            <PropertyRow label="URL (YouTube, Vimeo o directa)">
              <AutoInput value={(content.url as string) ?? ""} onCommit={(v) => setContent({ url: v, bucket: null, path: null })} placeholder="https://…" />
            </PropertyRow>
            {block.type === "video" && (
              <MediaPickerButton
                courseId={courseId}
                accept="video"
                label="Subir o elegir video"
                onSelect={(m) => setContent({ url: m.url, bucket: m.bucket, path: m.path })}
              />
            )}
            {block.type === "iframe" && (
              <PropertyRow label="Alto (px)">
                <AutoInput value={String(content.height ?? 400)} onCommit={(v) => setContent({ height: Number(v) || 400 })} />
              </PropertyRow>
            )}
          </PropertyGroup>
        );

      case "image":
        return (
          <PropertyGroup title="Imagen">
            <MediaPickerButton courseId={courseId} accept="image" label="Subir o elegir imagen" onSelect={(m) => setContent({ url: m.url, bucket: m.bucket, path: m.path })} />
            <PropertyRow label="URL"><AutoInput value={(content.url as string) ?? ""} onCommit={(v) => setContent({ url: v })} /></PropertyRow>
            <PropertyRow label="Texto alternativo"><AutoInput value={(content.alt as string) ?? ""} onCommit={(v) => setContent({ alt: v })} /></PropertyRow>
            <PropertyRow label="Pie de foto"><AutoInput value={(content.caption as string) ?? ""} onCommit={(v) => setContent({ caption: v })} /></PropertyRow>
          </PropertyGroup>
        );

      case "gallery": {
        const items = ((content.items as { url: string }[]) ?? []) as { url: string }[];
        return (
          <PropertyGroup title="Galería">
            <MediaPickerButton
              courseId={courseId}
              accept="image"
              label="Añadir imagen"
              onSelect={(m) => setContent({ items: [...items, { url: m.url }] })}
            />
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <img src={it.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <span className="flex-1 truncate text-[11px] text-muted-foreground">{it.url}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => setContent({ items: items.filter((_, j) => j !== i) })}>×</Button>
              </div>
            ))}
          </PropertyGroup>
        );
      }

      case "pdf":
      case "audio":
      case "file":
        return (
          <PropertyGroup title="Archivo">
            <MediaPickerButton
              courseId={courseId}
              accept={block.type === "audio" ? "audio" : "file"}
              label="Subir o elegir archivo"
              onSelect={(m) => setContent({ url: m.url, bucket: m.bucket, path: m.path, name: m.name })}
            />
            <PropertyRow label="Nombre visible"><AutoInput value={(content.name as string) ?? ""} onCommit={(v) => setContent({ name: v })} /></PropertyRow>
            {content.path ? <PropertyMeta label="Ruta" value={<span className="font-mono text-[10px]">{String(content.path)}</span>} /> : null}
          </PropertyGroup>
        );

      case "richtext":
      case "html":
        return (
          <PropertyGroup title="Contenido HTML" description="Admite etiquetas HTML básicas.">
            <AutoInput multiline rows={10} value={(content.html as string) ?? ""} onCommit={(v) => setContent({ html: v })} />
          </PropertyGroup>
        );

      case "markdown":
        return (
          <PropertyGroup title="Markdown">
            <AutoInput multiline rows={10} value={(content.text as string) ?? ""} onCommit={(v) => setContent({ text: v })} />
          </PropertyGroup>
        );

      case "code":
        return (
          <PropertyGroup title="Código">
            <PropertyRow label="Lenguaje"><AutoInput value={(content.language as string) ?? "ts"} onCommit={(v) => setContent({ language: v })} /></PropertyRow>
            <AutoInput multiline rows={10} value={(content.code as string) ?? ""} onCommit={(v) => setContent({ code: v })} />
          </PropertyGroup>
        );

      case "quote":
        return (
          <PropertyGroup title="Cita">
            <AutoInput multiline rows={4} value={(content.text as string) ?? ""} onCommit={(v) => setContent({ text: v })} />
            <PropertyRow label="Autor"><AutoInput value={(content.author as string) ?? ""} onCommit={(v) => setContent({ author: v })} /></PropertyRow>
          </PropertyGroup>
        );

      case "alert":
        return (
          <PropertyGroup title="Alerta">
            <PropertyRow label="Tipo">
              <Select value={(content.variant as string) ?? "info"} onValueChange={(v) => setContent({ variant: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Información</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                </SelectContent>
              </Select>
            </PropertyRow>
            <AutoInput multiline rows={4} value={(content.text as string) ?? ""} onCommit={(v) => setContent({ text: v })} />
          </PropertyGroup>
        );

      case "button":
        return (
          <PropertyGroup title="Botón">
            <PropertyRow label="Etiqueta"><AutoInput value={(content.label as string) ?? ""} onCommit={(v) => setContent({ label: v })} /></PropertyRow>
            <PropertyRow label="Enlace"><AutoInput value={(content.url as string) ?? ""} onCommit={(v) => setContent({ url: v })} /></PropertyRow>
          </PropertyGroup>
        );

      case "list":
        return (
          <>
            <PropertyGroup title="Opciones">
              <PropertyRow label="Numerada" inline>
                <Switch checked={!!content.ordered} onCheckedChange={(v) => setContent({ ordered: v })} />
              </PropertyRow>
            </PropertyGroup>
            {listEditor("items", "Elementos")}
          </>
        );

      case "checklist":
        return listEditor("items", "Tareas");

      case "faq":
        return pairEditor("items", "q", "a", "Pregunta", "Respuesta");

      case "resources":
        return pairEditor("items", "title", "url", "Título", "URL");

      case "table": {
        const headers = ((content.headers as string[]) ?? []) as string[];
        const rows = ((content.rows as string[][]) ?? []) as string[][];
        return (
          <PropertyGroup title="Tabla">
            <Label className="text-xs">Encabezados</Label>
            {headers.map((h, i) => (
              <AutoInput key={i} value={h} onCommit={(v) => {
                const next = [...headers];
                next[i] = v;
                setContent({ headers: next });
              }} />
            ))}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => setContent({ headers: [...headers, `Columna ${headers.length + 1}`], rows: rows.map((r) => [...r, ""]) })}>+ Columna</Button>
              <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => setContent({ rows: [...rows, headers.map(() => "")] })}>+ Fila</Button>
            </div>
            {rows.map((row, ri) => (
              <div key={ri} className="space-y-1 rounded-xl border p-2">
                {row.map((cell, ci) => (
                  <AutoInput key={ci} placeholder={headers[ci]} value={cell} onCommit={(v) => {
                    const next = rows.map((r) => [...r]);
                    next[ri][ci] = v;
                    setContent({ rows: next });
                  }} />
                ))}
                <Button size="sm" variant="ghost" className="w-full rounded-xl text-destructive" onClick={() => setContent({ rows: rows.filter((_, j) => j !== ri) })}>Quitar fila</Button>
              </div>
            ))}
          </PropertyGroup>
        );
      }

      default:
        return <p className="text-xs text-muted-foreground">Este bloque no requiere configuración adicional.</p>;
    }
  };

  return (
    <InspectorPanel
      title="Inspector"
      className="h-full"
      tabs={[
        {
          value: "block",
          label: "Bloque",
          content: block ? (
            <div className="space-y-5">
              <Badge variant="outline" className="rounded-xl">{def?.label ?? block.type}</Badge>
              <PropertyGroup title="General">
                <PropertyRow label="Título"><AutoInput value={block.title ?? ""} onCommit={(v) => onUpdateBlock({ title: v })} /></PropertyRow>
                <PropertyRow label="Descripción"><AutoInput multiline rows={2} value={block.description ?? ""} onCommit={(v) => onUpdateBlock({ description: v })} /></PropertyRow>
                <PropertyRow label="Icono (lucide)"><AutoInput value={block.icon ?? ""} onCommit={(v) => onUpdateBlock({ icon: v })} placeholder="Video" /></PropertyRow>
                <PropertyRow label="Color" inline>
                  <input
                    type="color"
                    value={block.color ?? "#0088AA"}
                    onChange={(e) => onUpdateBlock({ color: e.target.value })}
                    className="h-8 w-12 cursor-pointer rounded-lg border bg-background"
                  />
                </PropertyRow>
                <PropertyRow label="Visible" inline>
                  <Switch checked={block.is_visible} onCheckedChange={(v) => onUpdateBlock({ is_visible: v })} />
                </PropertyRow>
              </PropertyGroup>
              {blockContentEditor()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona un bloque en el editor para configurarlo.</p>
          ),
        },
        {
          value: "lesson",
          label: "Lección",
          content: lesson ? (
            <div className="space-y-5">
              <PropertyGroup title="General">
                <PropertyRow label="Título"><AutoInput value={lesson.title} onCommit={(v) => onUpdateLesson({ title: v })} /></PropertyRow>
                <PropertyRow label="Descripción"><AutoInput multiline rows={3} value={lesson.description ?? ""} onCommit={(v) => onUpdateLesson({ description: v })} /></PropertyRow>
                <PropertyRow label="Icono (lucide)"><AutoInput value={lesson.icon ?? ""} onCommit={(v) => onUpdateLesson({ icon: v })} /></PropertyRow>
                <PropertyRow label="Color" inline>
                  <input
                    type="color"
                    value={lesson.color ?? "#0088AA"}
                    onChange={(e) => onUpdateLesson({ color: e.target.value })}
                    className="h-8 w-12 cursor-pointer rounded-lg border bg-background"
                  />
                </PropertyRow>
              </PropertyGroup>

              <PropertyGroup title="Miniatura">
                {lesson.thumbnail_url && <img src={lesson.thumbnail_url} alt="" className="h-24 w-full rounded-xl object-cover" />}
                <MediaPickerButton courseId={courseId} accept="image" label="Elegir miniatura" onSelect={(m) => onUpdateLesson({ thumbnail_url: m.url })} />
              </PropertyGroup>

              <PropertyGroup title="Disponibilidad">
                <PropertyRow label="Visible" inline>
                  <Switch checked={lesson.is_visible} onCheckedChange={(v) => onUpdateLesson({ is_visible: v })} />
                </PropertyRow>
                <PropertyRow label="Obligatoria" inline>
                  <Switch checked={lesson.is_required} onCheckedChange={(v) => onUpdateLesson({ is_required: v })} />
                </PropertyRow>
                <PropertyRow label="Vista previa gratuita" inline hint="Visible sin comprar el curso">
                  <Switch checked={lesson.is_preview} onCheckedChange={(v) => onUpdateLesson({ is_preview: v })} />
                </PropertyRow>
                <PropertyRow label="Tiempo estimado (min)">
                  <AutoInput value={String(lesson.estimated_minutes ?? 0)} onCommit={(v) => onUpdateLesson({ estimated_minutes: Number(v) || 0 })} />
                </PropertyRow>
                <PropertyRow label="Disponible desde">
                  <Input
                    type="datetime-local"
                    className="rounded-xl"
                    value={toLocalInput(lesson.available_from)}
                    onChange={(e) => onUpdateLesson({ available_from: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </PropertyRow>
                <PropertyRow label="Disponible hasta">
                  <Input
                    type="datetime-local"
                    className="rounded-xl"
                    value={toLocalInput(lesson.available_until)}
                    onChange={(e) => onUpdateLesson({ available_until: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </PropertyRow>
              </PropertyGroup>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona una lección en el árbol.</p>
          ),
        },
      ]}
    />
  );
};
