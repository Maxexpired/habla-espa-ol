import { memo } from "react";
import { useResolvedMediaUrl } from "@/hooks/useMediaLibrary";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Download, ExternalLink, FileText, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LessonBlock } from "@/types/lms";

const C = (b: LessonBlock) => (b.content ?? {}) as Record<string, never>;

const MediaSource = ({
  block,
  render,
}: {
  block: LessonBlock;
  render: (url: string | null) => JSX.Element;
}) => {
  const c = C(block);
  const url = useResolvedMediaUrl(
    (c.bucket as string) ?? null,
    (c.path as string) ?? null,
    (c.url as string) ?? null
  );
  return render(url);
};

const embedUrl = (raw: string) => {
  if (!raw) return "";
  const yt = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = raw.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return raw;
};

/** Renders a single content block. Shared by the builder preview and the student player. */
export const BlockRenderer = memo(({ block }: { block: LessonBlock }) => {
  const c = C(block);

  switch (block.type) {
    case "video": {
      const raw = (c.url as string) ?? "";
      if (!raw && !c.path) return <Placeholder text="Video sin fuente" />;
      if (c.path)
        return (
          <MediaSource
            block={block}
            render={(url) =>
              url ? (
                <video src={url} controls className="w-full rounded-2xl bg-black" preload="metadata" />
              ) : (
                <Placeholder text="Cargando video…" />
              )
            }
          />
        );
      return (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            src={embedUrl(raw)}
            title={block.title ?? "Video"}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    case "image":
      return (
        <figure className="space-y-2">
          <img
            src={(c.url as string) ?? ""}
            alt={(c.alt as string) ?? block.title ?? "Imagen"}
            loading="lazy"
            className="w-full rounded-2xl object-cover"
          />
          {c.caption ? (
            <figcaption className="text-xs text-muted-foreground">{c.caption as string}</figcaption>
          ) : null}
        </figure>
      );

    case "gallery": {
      const items = ((c.items as unknown[]) ?? []) as { url: string; alt?: string }[];
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it, i) => (
            <img key={i} src={it.url} alt={it.alt ?? ""} loading="lazy" className="aspect-square w-full rounded-2xl object-cover" />
          ))}
        </div>
      );
    }

    case "pdf":
      return (
        <MediaSource
          block={block}
          render={(url) =>
            url ? (
              <div className="space-y-2">
                <iframe src={url} title={block.title ?? "PDF"} className="h-[520px] w-full rounded-2xl border" loading="lazy" />
                <Button asChild variant="outline" size="sm" className="rounded-2xl">
                  <a href={url} target="_blank" rel="noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> Abrir PDF
                  </a>
                </Button>
              </div>
            ) : (
              <Placeholder text="PDF no disponible" />
            )
          }
        />
      );

    case "audio":
      return (
        <MediaSource
          block={block}
          render={(url) => (url ? <audio src={url} controls className="w-full" /> : <Placeholder text="Audio no disponible" />)}
        />
      );

    case "file":
      return (
        <MediaSource
          block={block}
          render={(url) => (
            <Button asChild variant="outline" className="rounded-2xl" disabled={!url}>
              <a href={url ?? "#"} target="_blank" rel="noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                {(c.name as string) || block.title || "Descargar archivo"}
              </a>
            </Button>
          )}
        />
      );

    case "richtext":
    case "html":
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert [&_a]:text-serene-primary"
          dangerouslySetInnerHTML={{ __html: (c.html as string) ?? "" }}
        />
      );

    case "markdown":
      return <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{(c.text as string) ?? ""}</pre>;

    case "code":
      return (
        <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-xs">
          <code className="font-mono">{(c.code as string) ?? ""}</code>
        </pre>
      );

    case "quote":
      return (
        <blockquote className="rounded-2xl border-l-4 border-serene-primary bg-muted/40 p-4 italic">
          {(c.text as string) ?? ""}
          {c.author ? <footer className="mt-2 text-xs not-italic text-muted-foreground">— {c.author as string}</footer> : null}
        </blockquote>
      );

    case "list": {
      const items = ((c.items as string[]) ?? []).filter(Boolean);
      const Tag = c.ordered ? "ol" : "ul";
      return (
        <Tag className={`space-y-1 pl-5 text-sm ${c.ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </Tag>
      );
    }

    case "table": {
      const headers = ((c.headers as string[]) ?? []) as string[];
      const rows = ((c.rows as string[][]) ?? []) as string[][];
      return (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "alert": {
      const variant = (c.variant as string) ?? "info";
      const Icon = variant === "warning" ? AlertTriangle : variant === "success" ? CheckCircle2 : Info;
      return (
        <Alert className="rounded-2xl">
          <Icon className="h-4 w-4" />
          <AlertDescription>{(c.text as string) ?? ""}</AlertDescription>
        </Alert>
      );
    }

    case "checklist": {
      const items = ((c.items as string[]) ?? []).filter(Boolean);
      return (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Checkbox id={`${block.id}-${i}`} />
              <label htmlFor={`${block.id}-${i}`}>{it}</label>
            </li>
          ))}
        </ul>
      );
    }

    case "faq": {
      const items = ((c.items as unknown[]) ?? []) as { q: string; a: string }[];
      return (
        <Accordion type="single" collapsible className="rounded-2xl border px-3">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`i-${i}`}>
              <AccordionTrigger className="text-sm">{it.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );
    }

    case "resources": {
      const items = ((c.items as unknown[]) ?? []) as { title: string; url: string }[];
      return (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i}>
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-2xl border p-3 text-sm transition-colors hover:bg-muted/50"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                {it.title || it.url}
              </a>
            </li>
          ))}
        </ul>
      );
    }

    case "button":
      return (
        <Button asChild className="rounded-2xl">
          <a href={(c.url as string) ?? "#"} target="_blank" rel="noreferrer">
            {(c.label as string) ?? "Ver más"}
          </a>
        </Button>
      );

    case "iframe":
    case "embed":
      return (
        <iframe
          src={embedUrl((c.url as string) ?? "")}
          title={block.title ?? "Contenido embebido"}
          className="w-full rounded-2xl border"
          style={{ height: Number(c.height ?? 400) }}
          loading="lazy"
        />
      );

    case "divider":
      return <Separator className="my-4" />;

    default:
      return <Placeholder text={`Bloque "${block.type}" no soportado`} />;
  }
});
BlockRenderer.displayName = "BlockRenderer";

const Placeholder = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">{text}</div>
);
