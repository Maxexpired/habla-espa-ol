import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  GripVertical,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CourseLesson, CourseSection } from "@/types/lms";

interface TreeNode extends CourseSection {
  lessons: CourseLesson[];
}

interface Props {
  tree: TreeNode[];
  selectedLessonId?: string | null;
  showArchived: boolean;
  onSelectLesson: (lesson: CourseLesson) => void;
  onAddSection: () => void;
  onAddLesson: (sectionId: string) => void;
  onDuplicateSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onArchiveSection: (s: CourseSection) => void;
  onDuplicateLesson: (id: string) => void;
  onDeleteLesson: (id: string) => void;
  onArchiveLesson: (l: CourseLesson) => void;
  onReorderLessons: (sectionId: string, lessons: CourseLesson[]) => void;
  onReorderSections: (sections: CourseSection[]) => void;
}

/** Left column: drag & drop course tree (sections → lessons). */
export const CourseTree = ({
  tree,
  selectedLessonId,
  showArchived,
  onSelectLesson,
  onAddSection,
  onAddLesson,
  onDuplicateSection,
  onDeleteSection,
  onArchiveSection,
  onDuplicateLesson,
  onDeleteLesson,
  onArchiveLesson,
  onReorderLessons,
  onReorderSections,
}: Props) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragLesson, setDragLesson] = useState<{ id: string; sectionId: string } | null>(null);
  const [dragSection, setDragSection] = useState<string | null>(null);

  const visibleTree = tree.filter((s) => (showArchived ? true : !s.archived_at));

  const moveLesson = (sectionId: string, fromId: string, toId: string) => {
    const section = tree.find((s) => s.id === sectionId);
    if (!section || fromId === toId) return;
    const list = [...section.lessons];
    const from = list.findIndex((l) => l.id === fromId);
    const to = list.findIndex((l) => l.id === toId);
    if (from < 0 || to < 0) return;
    const [m] = list.splice(from, 1);
    list.splice(to, 0, m);
    onReorderLessons(sectionId, list);
  };

  const moveSection = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const list = [...visibleTree];
    const from = list.findIndex((s) => s.id === fromId);
    const to = list.findIndex((s) => s.id === toId);
    if (from < 0 || to < 0) return;
    const [m] = list.splice(from, 1);
    list.splice(to, 0, m);
    onReorderSections(list);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Árbol del curso</p>
        <Button size="sm" variant="ghost" className="h-7 rounded-xl px-2" onClick={onAddSection}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Sección
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {visibleTree.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Aún no hay secciones. Crea la primera para comenzar.
            </p>
          )}

          {visibleTree.map((section) => {
            const isOpen = !collapsed[section.id];
            const lessons = section.lessons.filter((l) => (showArchived ? true : !l.archived_at));
            return (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDragSection(section.id);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragSection) moveSection(dragSection, section.id);
                  setDragSection(null);
                }}
                className="rounded-2xl border bg-background"
              >
                <div className="group flex items-center gap-1 px-2 py-2">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [section.id]: isOpen }))}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <Folder className="h-3.5 w-3.5 shrink-0 text-serene-primary" />
                    <span className="truncate text-sm font-medium">{section.title}</span>
                    {section.archived_at && (
                      <Badge variant="outline" className="rounded-lg text-[10px]">Archivada</Badge>
                    )}
                    {!section.is_visible && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                  </button>
                  <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconBtn title="Nueva lección" onClick={() => onAddLesson(section.id)}><Plus className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn title="Duplicar" onClick={() => onDuplicateSection(section.id)}><Copy className="h-3.5 w-3.5" /></IconBtn>
                    <IconBtn
                      title={section.archived_at ? "Restaurar" : "Archivar"}
                      onClick={() => onArchiveSection(section)}
                    >
                      {section.archived_at ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </IconBtn>
                    <IconBtn title="Eliminar" onClick={() => onDeleteSection(section.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </IconBtn>
                  </div>
                </div>

                {isOpen && (
                  <ul className="space-y-0.5 border-t px-2 py-1.5">
                    {lessons.length === 0 && (
                      <li className="px-2 py-1.5 text-[11px] text-muted-foreground">Sin lecciones</li>
                    )}
                    {lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDragLesson({ id: lesson.id, sectionId: section.id });
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragLesson?.sectionId === section.id) moveLesson(section.id, dragLesson.id, lesson.id);
                          setDragLesson(null);
                        }}
                        className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
                          selectedLessonId === lesson.id ? "bg-serene-primary/10 text-serene-primary" : "hover:bg-muted/60"
                        }`}
                      >
                        <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => onSelectLesson(lesson)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-xs">{lesson.title}</span>
                          {lesson.archived_at && <Badge variant="outline" className="rounded-lg text-[10px]">Arch.</Badge>}
                          {lesson.is_preview && <Badge variant="secondary" className="rounded-lg text-[10px]">Free</Badge>}
                        </button>
                        <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <IconBtn title="Duplicar" onClick={() => onDuplicateLesson(lesson.id)}><Copy className="h-3 w-3" /></IconBtn>
                          <IconBtn
                            title={lesson.archived_at ? "Restaurar" : "Archivar"}
                            onClick={() => onArchiveLesson(lesson)}
                          >
                            {lesson.archived_at ? <RotateCcw className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                          </IconBtn>
                          <IconBtn title="Eliminar" onClick={() => onDeleteLesson(lesson.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </IconBtn>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const IconBtn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
  <Button
    size="icon"
    variant="ghost"
    title={title}
    className="h-6 w-6 rounded-lg"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    {children}
  </Button>
);
