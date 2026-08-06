import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, Music, Trash2, Upload, Video, Image as ImageIcon } from "lucide-react";
import { useMediaLibrary, formatBytes, type MediaItem } from "@/hooks/useMediaLibrary";

const kindIcon = (kind: string) =>
  kind === "image" ? ImageIcon : kind === "video" ? Video : kind === "audio" ? Music : FileText;

interface Props {
  courseId?: string;
  /** Filter shown items: image | video | audio | file (pdf + other) | all */
  accept?: "image" | "video" | "audio" | "file" | "all";
  label?: string;
  onSelect: (item: MediaItem) => void;
}

/** Media manager: upload, browse, inspect and delete course assets. */
export const MediaLibraryDialog = ({ courseId, accept = "all", label = "Biblioteca multimedia", onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { items, loading, upload, uploading, remove } = useMediaLibrary(courseId);

  const filtered = items.filter((i) => {
    const matchKind =
      accept === "all" ||
      (accept === "file" ? i.kind === "file" || i.kind === "pdf" : i.kind === accept);
    return matchKind && i.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full rounded-xl">
          <Upload className="mr-2 h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Biblioteca multimedia</DialogTitle>
          <DialogDescription>Sube archivos nuevos o reutiliza los existentes.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Buscar archivo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl"
          />
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const created = await upload(file);
              e.target.value = "";
              if (created) {
                onSelect(created);
                setOpen(false);
              }
            }}
          />
          <Button className="rounded-xl" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Subir
          </Button>
        </div>

        <ScrollArea className="max-h-[55vh]">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No hay archivos todavía.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3">
              {filtered.map((item) => {
                const Icon = kindIcon(item.kind);
                return (
                  <div key={item.id} className="group overflow-hidden rounded-2xl border transition-shadow hover:shadow-sm">
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                    >
                      <div className="flex h-24 items-center justify-center bg-muted/40">
                        {item.kind === "image" ? (
                          <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <Icon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1 p-2">
                        <p className="truncate text-xs font-medium">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Badge variant="outline" className="rounded-lg text-[10px]">{item.kind}</Badge>
                          <span>{formatBytes(item.size_bytes)}</span>
                          <span>· {item.usage_count} usos</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    </button>
                    <div className="flex justify-end border-t px-2 py-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg"
                        title="Eliminar archivo"
                        onClick={() => remove.mutate(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

/** Convenience wrapper used inside the inspector. */
export const MediaPickerButton = (props: Props) => <MediaLibraryDialog {...props} />;
