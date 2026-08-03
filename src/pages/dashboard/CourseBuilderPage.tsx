import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { EditorLayout } from "@/components/dashboard/shared/EditorLayout";
import { ContextToolbar } from "@/components/dashboard/shared/ContextToolbar";
import { InspectorPanel } from "@/components/dashboard/shared/InspectorPanel";
import { PropertyGroup, PropertyMeta } from "@/components/dashboard/shared/PropertiesPanel";
import { DraggableItem, DropZone } from "@/components/dashboard/shared/DragDrop";
import { SortableList } from "@/components/dashboard/shared/SortableList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Blocks,
  Eye,
  Heading1,
  Image as ImageIcon,
  ListChecks,
  Redo2,
  Save,
  Type,
  Undo2,
  Video,
} from "lucide-react";

const palette = [
  { key: "heading", label: "Título", icon: Heading1 },
  { key: "text", label: "Texto", icon: Type },
  { key: "image", label: "Imagen", icon: ImageIcon },
  { key: "video", label: "Video", icon: Video },
  { key: "quiz", label: "Quiz", icon: ListChecks },
];

/**
 * Fase 3 placeholder. The full visual course builder is not implemented yet;
 * this page wires the reusable editor infrastructure (toolbar, palette,
 * canvas with drag & drop, inspector) so the builder can be dropped in later.
 */
export default function CourseBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<{ id: string; type: string }[]>([]);

  const { data: course } = useQuery({
    queryKey: ["builder-course", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, published, updated_at, topics")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
  });

  const addBlock = (type: string) =>
    setBlocks((b) => [...b, { id: `${type}-${Date.now()}`, type }]);

  return (
    <div>
      <PageHeader
        title={course?.title ? `Constructor · ${course.title}` : "Constructor de cursos"}
        description="Infraestructura lista. El editor visual llega en la Fase 3."
        icon={<Blocks className="h-5 w-5" />}
        actions={
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/dashboard/courses")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a cursos
          </Button>
        }
      />

      <EditorLayout
        toolbar={
          <ContextToolbar
            left={
              <>
                <Badge variant="outline" className="rounded-xl">Vista previa técnica</Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" disabled>
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Deshacer (Fase 3)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" disabled>
                      <Redo2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rehacer (Fase 3)</TooltipContent>
                </Tooltip>
              </>
            }
            right={
              <>
                <Button size="sm" variant="outline" className="rounded-2xl" disabled>
                  <Eye className="mr-2 h-4 w-4" /> Previsualizar
                </Button>
                <Button size="sm" className="rounded-2xl" disabled>
                  <Save className="mr-2 h-4 w-4" /> Guardar
                </Button>
              </>
            }
          />
        }
        leftTitle="Bloques"
        left={palette.map((p) => (
          <DraggableItem key={p.key} payload={p.key}>
            <p.icon className="h-4 w-4 text-muted-foreground" />
            {p.label}
          </DraggableItem>
        ))}
        right={
          <InspectorPanel
            title="Propiedades"
            tabs={[
              {
                value: "course",
                label: "Curso",
                content: (
                  <PropertyGroup title="Metadatos">
                    <PropertyMeta label="ID" value={<span className="font-mono text-[11px]">{id?.slice(0, 8)}…</span>} />
                    <PropertyMeta label="Estado" value={course?.published ? "Publicado" : "Borrador"} />
                    <PropertyMeta
                      label="Actualizado"
                      value={course?.updated_at ? new Date(course.updated_at).toLocaleDateString("es-CL") : "—"}
                    />
                    <PropertyMeta label="Bloques" value={blocks.length} />
                  </PropertyGroup>
                ),
              },
              {
                value: "block",
                label: "Bloque",
                content: (
                  <p className="text-sm text-muted-foreground">
                    Selecciona un bloque para editar sus propiedades. Disponible en la Fase 3.
                  </p>
                ),
              },
            ]}
          />
        }
      >
        <div className="space-y-4">
          {blocks.length > 0 && (
            <SortableList
              items={blocks}
              getId={(b) => b.id}
              onReorder={setBlocks}
              renderItem={(b) => (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="rounded-xl">{b.type}</Badge>
                  <span className="text-muted-foreground">Bloque de demostración</span>
                </div>
              )}
            />
          )}

          <DropZone
            onDropPayload={addBlock}
            label="Arrastra un bloque desde el panel izquierdo para probar la infraestructura"
          />

          <p className="text-center text-xs text-muted-foreground">
            Los bloques aquí son sólo una demostración de la infraestructura de arrastrar y soltar. No se guardan.
          </p>
        </div>
      </EditorLayout>
    </div>
  );
}
