import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/shared/PageHeader";
import { ContextToolbar } from "@/components/dashboard/shared/ContextToolbar";
import { CourseTree } from "@/components/dashboard/builder/CourseTree";
import { BlockInspector } from "@/components/dashboard/builder/BlockInspector";
import { BlockRenderer } from "@/components/lms/BlockRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCourseBuilder } from "@/hooks/useCourseBuilder";
import { BLOCK_DEFINITIONS, BLOCK_GROUPS, type CourseLesson, type LessonBlock } from "@/types/lms";
import {
  ArrowLeft,
  Blocks,
  CheckCircle2,
  Copy,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  TriangleAlert,
  GripVertical,
} from "lucide-react";

const previewWidths = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

export default function CourseBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const b = useCourseBuilder(id);

  const [lessonId, setLessonId] = useState<string | null>(null);
  const [blockId, setBlockId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [device, setDevice] = useState<keyof typeof previewWidths>("desktop");
  const [dragBlock, setDragBlock] = useState<string | null>(null);

  const lesson = b.lessons.find((l) => l.id === lessonId) ?? null;
  const lessonBlocks = useMemo(
    () => b.blocks.filter((x) => x.lesson_id === lessonId).sort((x, y) => x.sort_order - y.sort_order),
    [b.blocks, lessonId]
  );
  const block = lessonBlocks.find((x) => x.id === blockId) ?? null;

  const moveBlock = (from: string, to: string) => {
    if (from === to) return;
    const list = [...lessonBlocks];
    const f = list.findIndex((x) => x.id === from);
    const t = list.findIndex((x) => x.id === to);
    if (f < 0 || t < 0) return;
    const [m] = list.splice(f, 1);
    list.splice(t, 0, m);
    b.reorderBlocks(list);
  };

  const status =
    b.saveState === "saving" ? (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</span>
    ) : b.saveState === "saved" ? (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Cambios guardados</span>
    ) : b.saveState === "error" ? (
      <span className="flex items-center gap-1.5 text-xs text-destructive"><TriangleAlert className="h-3.5 w-3.5" /> Error al guardar</span>
    ) : null;

  return (
    <div>
      <PageHeader
        title={b.course?.title ? `Constructor · ${b.course.title}` : "Constructor de cursos"}
        description="Organiza secciones, lecciones y bloques con arrastrar y soltar. Todo se guarda automáticamente."
        icon={<Blocks className="h-5 w-5" />}
        actions={
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate("/dashboard/courses")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a cursos
          </Button>
        }
      />

      <ContextToolbar
        left={
          <>
            {status}
            <div className="flex items-center gap-2 pl-2">
              <Switch id="arch" checked={showArchived} onCheckedChange={setShowArchived} />
              <Label htmlFor="arch" className="text-xs">Ver archivados</Label>
            </div>
          </>
        }
        right={
          <div className="flex gap-1">
            {(["desktop", "tablet", "mobile"] as const).map((d) => {
              const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
              return (
                <Button
                  key={d}
                  size="icon"
                  variant={device === d ? "secondary" : "ghost"}
                  className="h-8 w-8 rounded-xl"
                  onClick={() => setDevice(d)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              );
            })}
          </div>
        }
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="hidden max-h-[75vh] rounded-3xl border bg-background lg:block">
          <CourseTree
            tree={b.tree}
            selectedLessonId={lessonId}
            showArchived={showArchived}
            onSelectLesson={(l: CourseLesson) => {
              setLessonId(l.id);
              setBlockId(null);
            }}
            onAddSection={() => b.addSection()}
            onAddLesson={(sid) => b.addLesson(sid)}
            onDuplicateSection={(sid) => b.duplicateSection(sid)}
            onDeleteSection={(sid) => b.deleteSection(sid)}
            onArchiveSection={(s) => b.updateSection(s.id, { archived_at: s.archived_at ? null : new Date().toISOString() })}
            onDuplicateLesson={(lid) => b.duplicateLesson(lid)}
            onDeleteLesson={(lid) => {
              b.deleteLesson(lid);
              if (lid === lessonId) setLessonId(null);
            }}
            onArchiveLesson={(l) => b.updateLesson(l.id, { archived_at: l.archived_at ? null : new Date().toISOString() })}
            onReorderLessons={(_sid, list) => b.reorderLessons(list)}
            onReorderSections={(list) => b.reorderSections(list)}
          />
        </aside>

        <section className="min-h-[60vh] rounded-3xl border bg-background p-4 lg:p-6">
          {!lesson ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              Selecciona o crea una lección en el árbol del curso para editar su contenido.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{lesson.title}</h2>
                {lesson.description && <p className="text-sm text-muted-foreground">{lesson.description}</p>}
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Añadir bloque</p>
                <div className="space-y-2">
                  {BLOCK_GROUPS.map((g) => (
                    <div key={g} className="flex flex-wrap gap-1.5">
                      {BLOCK_DEFINITIONS.filter((d) => d.group === g).map((d) => (
                        <Button
                          key={d.type}
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs"
                          onClick={async () => {
                            const newId = await b.addBlock(lesson.id, d.type);
                            if (newId) setBlockId(newId);
                          }}
                        >
                          <d.icon className="mr-1.5 h-3.5 w-3.5" /> {d.label}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="max-h-[55vh]">
                <div className="mx-auto space-y-3 transition-all" style={{ maxWidth: previewWidths[device] }}>
                  {lessonBlocks.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Esta lección aún no tiene bloques.
                    </p>
                  )}
                  {lessonBlocks.map((blk: LessonBlock) => (
                    <div
                      key={blk.id}
                      draggable
                      onDragStart={() => setDragBlock(blk.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragBlock) moveBlock(dragBlock, blk.id);
                        setDragBlock(null);
                      }}
                      onClick={() => setBlockId(blk.id)}
                      className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                        blockId === blk.id ? "ring-2 ring-serene-primary/50" : "hover:shadow-sm"
                      } ${blk.is_visible ? "" : "opacity-50"}`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground" />
                        <Badge variant="outline" className="rounded-lg text-[10px]">{blk.title || blk.type}</Badge>
                        <div className="ml-auto flex opacity-0 transition-opacity group-hover:opacity-100">
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); b.duplicateBlock(blk.id); }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); b.deleteBlock(blk.id); if (blk.id === blockId) setBlockId(null); }}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <BlockRenderer block={blk} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </section>

        <div className="hidden max-h-[75vh] lg:block">
          <BlockInspector
            lesson={lesson}
            block={block}
            courseId={id}
            onUpdateLesson={(patch) => lesson && b.updateLesson(lesson.id, patch)}
            onUpdateBlock={(patch) => block && b.updateBlock(block.id, patch)}
          />
        </div>
      </div>
    </div>
  );
}
