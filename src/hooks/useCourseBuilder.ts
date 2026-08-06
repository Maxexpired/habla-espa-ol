import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CourseLesson, CourseSection, LessonBlock } from "@/types/lms";
import { BLOCK_MAP } from "@/types/lms";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Central data layer of the visual course builder.
 * All writes go through mutations that report an autosave state and invalidate
 * the React Query cache so tree / canvas / inspector stay in sync.
 */
export function useCourseBuilder(courseId?: string) {
  const qc = useQueryClient();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const markSaved = useCallback((ok: boolean) => {
    setSaveState(ok ? "saved" : "error");
    clearTimeout(timer.current);
    if (ok) timer.current = setTimeout(() => setSaveState("idle"), 2500);
  }, []);

  const course = useQuery({
    queryKey: ["builder", "course", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const sections = useQuery({
    queryKey: ["builder", "sections", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_sections")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseSection[];
    },
  });

  const lessons = useQuery({
    queryKey: ["builder", "lessons", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseLesson[];
    },
  });

  const blocks = useQuery({
    queryKey: ["builder", "blocks", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_blocks")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((b) => ({
        ...b,
        content: (b.content ?? {}) as Record<string, unknown>,
        settings: (b.settings ?? {}) as Record<string, unknown>,
      })) as LessonBlock[];
    },
  });

  const invalidate = useCallback(
    (keys: string[]) => {
      keys.forEach((k) => qc.invalidateQueries({ queryKey: ["builder", k, courseId] }));
    },
    [qc, courseId]
  );

  /** Generic write wrapper that drives the autosave indicator. */
  const run = useCallback(
    async (fn: () => Promise<{ error: unknown }>, keys: string[]) => {
      setSaveState("saving");
      const { error } = await fn();
      if (error) {
        console.error("Builder save error:", error);
        markSaved(false);
        return false;
      }
      invalidate(keys);
      markSaved(true);
      return true;
    },
    [invalidate, markSaved]
  );

  // ---------------- Sections ----------------
  const addSection = useCallback(
    (title = "Nueva sección") =>
      run(
        () =>
          supabase.from("course_sections").insert({
            course_id: courseId!,
            title,
            sort_order: (sections.data?.length ?? 0) + 1,
          }) as unknown as Promise<{ error: unknown }>,
        ["sections"]
      ),
    [run, courseId, sections.data]
  );

  const updateSection = useCallback(
    (id: string, patch: Partial<CourseSection>) =>
      run(
        () => supabase.from("course_sections").update(patch).eq("id", id) as unknown as Promise<{ error: unknown }>,
        ["sections"]
      ),
    [run]
  );

  const deleteSection = useCallback(
    (id: string) =>
      run(
        () => supabase.from("course_sections").delete().eq("id", id) as unknown as Promise<{ error: unknown }>,
        ["sections", "lessons", "blocks"]
      ),
    [run]
  );

  const duplicateSection = useCallback(
    async (id: string) => {
      const src = sections.data?.find((s) => s.id === id);
      if (!src) return false;
      setSaveState("saving");
      const { data: newSection, error } = await supabase
        .from("course_sections")
        .insert({
          course_id: src.course_id,
          title: `${src.title} (copia)`,
          description: src.description,
          icon: src.icon,
          color: src.color,
          sort_order: src.sort_order + 1,
        })
        .select()
        .single();
      if (error || !newSection) {
        markSaved(false);
        return false;
      }
      const srcLessons = (lessons.data ?? []).filter((l) => l.section_id === id);
      for (const l of srcLessons) {
        const { data: nl } = await supabase
          .from("course_lessons")
          .insert({
            section_id: newSection.id,
            course_id: l.course_id,
            title: l.title,
            description: l.description,
            icon: l.icon,
            color: l.color,
            thumbnail_url: l.thumbnail_url,
            sort_order: l.sort_order,
            estimated_minutes: l.estimated_minutes,
            is_required: l.is_required,
          })
          .select()
          .single();
        if (!nl) continue;
        const srcBlocks = (blocks.data ?? []).filter((b) => b.lesson_id === l.id);
        if (srcBlocks.length) {
          await supabase.from("lesson_blocks").insert(
            srcBlocks.map((b) => ({
              lesson_id: nl.id,
              course_id: b.course_id,
              type: b.type,
              title: b.title,
              description: b.description,
              icon: b.icon,
              color: b.color,
              content: b.content as never,
              settings: b.settings as never,
              sort_order: b.sort_order,
            }))
          );
        }
      }
      invalidate(["sections", "lessons", "blocks"]);
      markSaved(true);
      return true;
    },
    [sections.data, lessons.data, blocks.data, invalidate, markSaved]
  );

  // ---------------- Lessons ----------------
  const addLesson = useCallback(
    (sectionId: string, title = "Nueva lección") =>
      run(
        () =>
          supabase.from("course_lessons").insert({
            section_id: sectionId,
            course_id: courseId!,
            title,
            sort_order:
              (lessons.data?.filter((l) => l.section_id === sectionId).length ?? 0) + 1,
          }) as unknown as Promise<{ error: unknown }>,
        ["lessons"]
      ),
    [run, courseId, lessons.data]
  );

  const updateLesson = useCallback(
    (id: string, patch: Partial<CourseLesson>) =>
      run(
        () => supabase.from("course_lessons").update(patch).eq("id", id) as unknown as Promise<{ error: unknown }>,
        ["lessons"]
      ),
    [run]
  );

  const deleteLesson = useCallback(
    (id: string) =>
      run(
        () => supabase.from("course_lessons").delete().eq("id", id) as unknown as Promise<{ error: unknown }>,
        ["lessons", "blocks"]
      ),
    [run]
  );

  const duplicateLesson = useCallback(
    async (id: string) => {
      const src = lessons.data?.find((l) => l.id === id);
      if (!src) return false;
      setSaveState("saving");
      const { data: nl, error } = await supabase
        .from("course_lessons")
        .insert({
          section_id: src.section_id,
          course_id: src.course_id,
          title: `${src.title} (copia)`,
          description: src.description,
          icon: src.icon,
          color: src.color,
          thumbnail_url: src.thumbnail_url,
          sort_order: src.sort_order + 1,
          estimated_minutes: src.estimated_minutes,
          is_required: src.is_required,
        })
        .select()
        .single();
      if (error || !nl) {
        markSaved(false);
        return false;
      }
      const srcBlocks = (blocks.data ?? []).filter((b) => b.lesson_id === id);
      if (srcBlocks.length) {
        await supabase.from("lesson_blocks").insert(
          srcBlocks.map((b) => ({
            lesson_id: nl.id,
            course_id: b.course_id,
            type: b.type,
            title: b.title,
            description: b.description,
            content: b.content as never,
            settings: b.settings as never,
            sort_order: b.sort_order,
          }))
        );
      }
      invalidate(["lessons", "blocks"]);
      markSaved(true);
      return nl.id;
    },
    [lessons.data, blocks.data, invalidate, markSaved]
  );

  const reorderLessons = useCallback(
    async (ordered: CourseLesson[]) => {
      setSaveState("saving");
      qc.setQueryData(["builder", "lessons", courseId], (prev: CourseLesson[] | undefined) => {
        if (!prev) return prev;
        const map = new Map(ordered.map((l, i) => [l.id, i + 1]));
        return prev.map((l) => (map.has(l.id) ? { ...l, sort_order: map.get(l.id)! } : l));
      });
      const results = await Promise.all(
        ordered.map((l, i) => supabase.from("course_lessons").update({ sort_order: i + 1 }).eq("id", l.id))
      );
      const ok = results.every((r) => !r.error);
      invalidate(["lessons"]);
      markSaved(ok);
    },
    [qc, courseId, invalidate, markSaved]
  );

  const reorderSections = useCallback(
    async (ordered: CourseSection[]) => {
      setSaveState("saving");
      const results = await Promise.all(
        ordered.map((s, i) => supabase.from("course_sections").update({ sort_order: i + 1 }).eq("id", s.id))
      );
      invalidate(["sections"]);
      markSaved(results.every((r) => !r.error));
    },
    [invalidate, markSaved]
  );

  // ---------------- Blocks ----------------
  const addBlock = useCallback(
    async (lessonId: string, type: string) => {
      const def = BLOCK_MAP[type];
      const count = (blocks.data ?? []).filter((b) => b.lesson_id === lessonId).length;
      setSaveState("saving");
      const { data, error } = await supabase
        .from("lesson_blocks")
        .insert({
          lesson_id: lessonId,
          course_id: courseId!,
          type,
          title: def?.label ?? type,
          content: (def?.defaultContent ?? {}) as never,
          sort_order: count + 1,
        })
        .select()
        .single();
      invalidate(["blocks"]);
      markSaved(!error);
      return data?.id as string | undefined;
    },
    [blocks.data, courseId, invalidate, markSaved]
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<LessonBlock>) =>
      run(
        () =>
          supabase
            .from("lesson_blocks")
            .update(patch as never)
            .eq("id", id) as unknown as Promise<{ error: unknown }>,
        ["blocks"]
      ),
    [run]
  );

  const deleteBlock = useCallback(
    (id: string) =>
      run(
        () => supabase.from("lesson_blocks").delete().eq("id", id) as unknown as Promise<{ error: unknown }>,
        ["blocks"]
      ),
    [run]
  );

  const duplicateBlock = useCallback(
    async (id: string) => {
      const src = blocks.data?.find((b) => b.id === id);
      if (!src) return false;
      return run(
        () =>
          supabase.from("lesson_blocks").insert({
            lesson_id: src.lesson_id,
            course_id: src.course_id,
            type: src.type,
            title: src.title,
            description: src.description,
            icon: src.icon,
            color: src.color,
            content: src.content as never,
            settings: src.settings as never,
            sort_order: src.sort_order + 1,
          }) as unknown as Promise<{ error: unknown }>,
        ["blocks"]
      );
    },
    [blocks.data, run]
  );

  const reorderBlocks = useCallback(
    async (ordered: LessonBlock[]) => {
      setSaveState("saving");
      qc.setQueryData(["builder", "blocks", courseId], (prev: LessonBlock[] | undefined) => {
        if (!prev) return prev;
        const map = new Map(ordered.map((b, i) => [b.id, i + 1]));
        return prev.map((b) => (map.has(b.id) ? { ...b, sort_order: map.get(b.id)! } : b));
      });
      const results = await Promise.all(
        ordered.map((b, i) => supabase.from("lesson_blocks").update({ sort_order: i + 1 }).eq("id", b.id))
      );
      invalidate(["blocks"]);
      markSaved(results.every((r) => !r.error));
    },
    [qc, courseId, invalidate, markSaved]
  );

  const tree = useMemo(() => {
    const ls = lessons.data ?? [];
    return (sections.data ?? []).map((s) => ({
      ...s,
      lessons: ls.filter((l) => l.section_id === s.id).sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [sections.data, lessons.data]);

  return {
    course: course.data,
    courseQuery: course,
    sections: sections.data ?? [],
    lessons: lessons.data ?? [],
    blocks: blocks.data ?? [],
    tree,
    loading: sections.isLoading || lessons.isLoading || blocks.isLoading,
    saveState,
    setSaveState,
    addSection,
    updateSection,
    deleteSection,
    duplicateSection,
    reorderSections,
    addLesson,
    updateLesson,
    deleteLesson,
    duplicateLesson,
    reorderLessons,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    reorderBlocks,
  };
}
