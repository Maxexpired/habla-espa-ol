import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MediaKind = "image" | "video" | "pdf" | "audio" | "file";

export interface MediaItem {
  id: string;
  bucket: string;
  path: string;
  url: string;
  name: string;
  kind: string;
  mime_type: string | null;
  size_bytes: number;
  usage_count: number;
  created_at: string;
}

const PUBLIC_BUCKET = "course-images";
const PRIVATE_BUCKET = "course-files";

export const kindFromFile = (file: File): MediaKind => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "file";
};

export const bucketForKind = (kind: MediaKind) => (kind === "image" ? PUBLIC_BUCKET : PRIVATE_BUCKET);

/** Resolves a playable/downloadable URL, signing private objects on demand. */
export function useResolvedMediaUrl(bucket?: string | null, path?: string | null, fallback?: string | null) {
  const [url, setUrl] = useState<string | null>(fallback ?? null);

  useEffect(() => {
    let active = true;
    if (bucket === PRIVATE_BUCKET && path) {
      supabase.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(path, 3600)
        .then(({ data }) => {
          if (active && data?.signedUrl) setUrl(data.signedUrl);
        });
    } else {
      setUrl(fallback ?? null);
    }
    return () => {
      active = false;
    };
  }, [bucket, path, fallback]);

  return url;
}

export function useMediaLibrary(courseId?: string) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const items = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
  });

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        if (file.size > 200 * 1024 * 1024) throw new Error("El archivo supera los 200 MB");
        const kind = kindFromFile(file);
        const bucket = bucketForKind(kind);
        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const path = `${courseId ?? "general"}/${Date.now()}-${safeName}`;

        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;

        const publicUrl =
          bucket === PUBLIC_BUCKET ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : path;

        const { data, error } = await supabase
          .from("media_library")
          .insert({
            bucket,
            path,
            url: publicUrl,
            name: file.name,
            kind,
            mime_type: file.type,
            size_bytes: file.size,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["media-library"] });
        return data as MediaItem;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al subir el archivo");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [courseId, qc]
  );

  const remove = useMutation({
    mutationFn: async (item: MediaItem) => {
      await supabase.storage.from(item.bucket).remove([item.path]);
      const { error } = await supabase.from("media_library").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Archivo eliminado");
      qc.invalidateQueries({ queryKey: ["media-library"] });
    },
    onError: () => toast.error("No se pudo eliminar el archivo"),
  });

  const markUsed = useCallback(async (item: MediaItem) => {
    await supabase
      .from("media_library")
      .update({ usage_count: item.usage_count + 1 })
      .eq("id", item.id);
  }, []);

  return { items: items.data ?? [], loading: items.isLoading, upload, uploading, remove, markUsed };
}

export const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};
