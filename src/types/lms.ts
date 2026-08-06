import {
  AlertTriangle,
  Blocks,
  Code2,
  Download,
  FileText,
  Files,
  Frame,
  Heading1,
  Image as ImageIcon,
  Images,
  Link2,
  List,
  ListChecks,
  Minus,
  MousePointerClick,
  Music,
  Quote,
  Table2,
  Type,
  Video,
  HelpCircle,
  FileCode2,
  BookMarked,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Content block catalogue used by the visual course builder and the player. */
export type BlockType =
  | "video"
  | "richtext"
  | "image"
  | "gallery"
  | "pdf"
  | "audio"
  | "code"
  | "file"
  | "button"
  | "divider"
  | "list"
  | "table"
  | "quote"
  | "alert"
  | "html"
  | "iframe"
  | "embed"
  | "markdown"
  | "checklist"
  | "faq"
  | "resources";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: LucideIcon;
  group: "Medios" | "Texto" | "Interactivo" | "Estructura";
  defaultContent: Record<string, unknown>;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: "video", label: "Video", icon: Video, group: "Medios", defaultContent: { url: "", provider: "url" } },
  { type: "image", label: "Imagen", icon: ImageIcon, group: "Medios", defaultContent: { url: "", alt: "", caption: "" } },
  { type: "gallery", label: "Galería", icon: Images, group: "Medios", defaultContent: { items: [] } },
  { type: "pdf", label: "PDF", icon: FileText, group: "Medios", defaultContent: { url: "", name: "" } },
  { type: "audio", label: "Audio", icon: Music, group: "Medios", defaultContent: { url: "" } },
  { type: "file", label: "Archivo descargable", icon: Download, group: "Medios", defaultContent: { url: "", name: "" } },
  { type: "richtext", label: "Texto enriquecido", icon: Type, group: "Texto", defaultContent: { html: "" } },
  { type: "markdown", label: "Markdown", icon: FileCode2, group: "Texto", defaultContent: { text: "" } },
  { type: "code", label: "Código", icon: Code2, group: "Texto", defaultContent: { code: "", language: "ts" } },
  { type: "quote", label: "Cita", icon: Quote, group: "Texto", defaultContent: { text: "", author: "" } },
  { type: "list", label: "Lista", icon: List, group: "Texto", defaultContent: { items: [""], ordered: false } },
  { type: "table", label: "Tabla", icon: Table2, group: "Texto", defaultContent: { headers: ["Columna 1", "Columna 2"], rows: [["", ""]] } },
  { type: "alert", label: "Alerta", icon: AlertTriangle, group: "Texto", defaultContent: { text: "", variant: "info" } },
  { type: "checklist", label: "Checklist", icon: ListChecks, group: "Interactivo", defaultContent: { items: [""] } },
  { type: "faq", label: "Preguntas frecuentes", icon: HelpCircle, group: "Interactivo", defaultContent: { items: [{ q: "", a: "" }] } },
  { type: "button", label: "Botón", icon: MousePointerClick, group: "Interactivo", defaultContent: { label: "Ver más", url: "" } },
  { type: "resources", label: "Recursos relacionados", icon: BookMarked, group: "Interactivo", defaultContent: { items: [{ title: "", url: "" }] } },
  { type: "iframe", label: "Iframe", icon: Frame, group: "Estructura", defaultContent: { url: "", height: 400 } },
  { type: "embed", label: "Embed", icon: Link2, group: "Estructura", defaultContent: { url: "" } },
  { type: "html", label: "Contenido HTML", icon: Blocks, group: "Estructura", defaultContent: { html: "" } },
  { type: "divider", label: "Separador", icon: Minus, group: "Estructura", defaultContent: {} },
];

export const BLOCK_MAP: Record<string, BlockDefinition> = Object.fromEntries(
  BLOCK_DEFINITIONS.map((b) => [b.type, b])
);

export const BLOCK_GROUPS = ["Medios", "Texto", "Interactivo", "Estructura"] as const;

export const FALLBACK_BLOCK_ICON = Files;

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_visible: boolean;
  archived_at: string | null;
}

export interface CourseLesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  is_visible: boolean;
  is_required: boolean;
  is_preview: boolean;
  estimated_minutes: number;
  available_from: string | null;
  available_until: string | null;
  archived_at: string | null;
}

export interface LessonBlock {
  id: string;
  lesson_id: string;
  course_id: string;
  type: string;
  title: string | null;
  description: string | null;
  icon: string | null;
  color: string | null;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  archived_at: string | null;
}

export const COURSE_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programado",
  published: "Publicado",
  archived: "Archivado",
  hidden: "Oculto",
};
