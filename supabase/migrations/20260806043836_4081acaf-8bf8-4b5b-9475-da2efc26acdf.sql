
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft','scheduled','published','archived','hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ COURSES EXTRA COLUMNS ============
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status public.course_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

UPDATE public.courses SET status = 'published' WHERE published = true AND status = 'draft';

-- ============ HELPER: is enrolled ============
CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = _user_id AND course_id = _course_id AND status <> 'cancelled'
  );
$$;

-- ============ SECTIONS ============
CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_sections TO authenticated;
GRANT SELECT ON public.course_sections TO anon;
GRANT ALL ON public.course_sections TO service_role;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sections" ON public.course_sections FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Public views sections of published courses" ON public.course_sections FOR SELECT TO anon, authenticated
  USING (archived_at IS NULL AND is_visible = true AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.published = true));
CREATE POLICY "Enrolled users view sections" ON public.course_sections FOR SELECT TO authenticated
  USING (archived_at IS NULL AND public.is_enrolled(auth.uid(), course_id));

-- ============ LESSONS ============
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  color text,
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT false,
  is_preview boolean NOT NULL DEFAULT false,
  estimated_minutes integer NOT NULL DEFAULT 0,
  available_from timestamptz,
  available_until timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT SELECT ON public.course_lessons TO anon;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lessons" ON public.course_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Public views preview lessons" ON public.course_lessons FOR SELECT TO anon, authenticated
  USING (archived_at IS NULL AND is_visible = true AND is_preview = true AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.published = true));
CREATE POLICY "Enrolled users view lessons" ON public.course_lessons FOR SELECT TO authenticated
  USING (archived_at IS NULL AND public.is_enrolled(auth.uid(), course_id));

-- ============ BLOCKS ============
CREATE TABLE IF NOT EXISTS public.lesson_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  description text,
  icon text,
  color text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_blocks TO authenticated;
GRANT SELECT ON public.lesson_blocks TO anon;
GRANT ALL ON public.lesson_blocks TO service_role;
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocks" ON public.lesson_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Public views preview blocks" ON public.lesson_blocks FOR SELECT TO anon, authenticated
  USING (archived_at IS NULL AND is_visible = true AND EXISTS (
    SELECT 1 FROM public.course_lessons l JOIN public.courses c ON c.id = l.course_id
    WHERE l.id = lesson_id AND l.is_preview = true AND c.published = true));
CREATE POLICY "Enrolled users view blocks" ON public.lesson_blocks FOR SELECT TO authenticated
  USING (archived_at IS NULL AND public.is_enrolled(auth.uid(), course_id));

-- ============ RESOURCES ============
CREATE TABLE IF NOT EXISTS public.course_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_resources TO authenticated;
GRANT ALL ON public.course_resources TO service_role;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage resources" ON public.course_resources FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Enrolled users view resources" ON public.course_resources FOR SELECT TO authenticated
  USING (archived_at IS NULL AND public.is_enrolled(auth.uid(), course_id));

-- ============ QUIZZES ============
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  passing_score integer NOT NULL DEFAULT 60,
  max_attempts integer NOT NULL DEFAULT 3,
  time_limit_minutes integer,
  is_visible boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Enrolled users view quizzes" ON public.quizzes FOR SELECT TO authenticated
  USING (archived_at IS NULL AND public.is_enrolled(auth.uid(), course_id));

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  type text NOT NULL DEFAULT 'single',
  feedback text,
  points integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Enrolled users view questions" ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND public.is_enrolled(auth.uid(), q.course_id)));

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  feedback text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage options" ON public.quiz_options FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Enrolled users view options" ON public.quiz_options FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quiz_questions qq JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = question_id AND public.is_enrolled(auth.uid(), q.course_id)));

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  attempt_number integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Users manage own attempts" ON public.quiz_attempts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ PROGRESS ============
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  seconds_spent integer NOT NULL DEFAULT 0,
  last_position integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view progress" ON public.lesson_progress FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Users manage own progress" ON public.lesson_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NOTES ============
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_notes TO authenticated;
GRANT ALL ON public.lesson_notes TO service_role;
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.lesson_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ VERSIONS ============
CREATE TABLE IF NOT EXISTS public.course_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  label text,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.course_versions TO authenticated;
GRANT ALL ON public.course_versions TO service_role;
ALTER TABLE public.course_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage versions" ON public.course_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ MEDIA LIBRARY ============
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  bucket text NOT NULL,
  path text NOT NULL,
  url text NOT NULL,
  name text NOT NULL,
  mime_type text,
  kind text NOT NULL DEFAULT 'image',
  size_bytes bigint NOT NULL DEFAULT 0,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_library TO authenticated;
GRANT SELECT ON public.media_library TO anon;
GRANT ALL ON public.media_library TO service_role;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage media" ON public.media_library FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============ TRIGGERS ============
CREATE TRIGGER course_sections_updated_at BEFORE UPDATE ON public.course_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER lesson_blocks_updated_at BEFORE UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER course_resources_updated_at BEFORE UPDATE ON public.course_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER lesson_notes_updated_at BEFORE UPDATE ON public.lesson_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER media_library_updated_at BEFORE UPDATE ON public.media_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_sections_course ON public.course_sections(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_section ON public.course_lessons(section_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_blocks_lesson ON public.lesson_blocks(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_progress_user_course ON public.lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_resources_course ON public.course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_versions_course ON public.course_versions(course_id, created_at DESC);

-- ============ ACADEMIC ANALYTICS ============
CREATE OR REPLACE FUNCTION public.get_course_progress(_user_id uuid, _course_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN total.c = 0 THEN 0
    ELSE ROUND((done.c::numeric / total.c::numeric) * 100, 0) END
  FROM
    (SELECT COUNT(*) c FROM public.course_lessons WHERE course_id = _course_id AND archived_at IS NULL AND is_visible) total,
    (SELECT COUNT(*) c FROM public.lesson_progress WHERE course_id = _course_id AND user_id = _user_id AND completed) done;
$$;

CREATE OR REPLACE FUNCTION public.get_academic_analytics()
RETURNS TABLE (
  course_id uuid,
  course_title text,
  students integer,
  lessons integer,
  avg_progress numeric,
  completion_rate numeric,
  avg_minutes numeric,
  abandoned integer
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.id,
    c.title,
    (SELECT COUNT(DISTINCT e.user_id)::int FROM public.enrollments e WHERE e.course_id = c.id),
    (SELECT COUNT(*)::int FROM public.course_lessons l WHERE l.course_id = c.id AND l.archived_at IS NULL),
    COALESCE((SELECT ROUND(AVG(public.get_course_progress(e.user_id, c.id)),1) FROM public.enrollments e WHERE e.course_id = c.id), 0),
    COALESCE((SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE e.completed_at IS NOT NULL) / NULLIF(COUNT(*),0), 1) FROM public.enrollments e WHERE e.course_id = c.id), 0),
    COALESCE((SELECT ROUND(AVG(lp.seconds_spent)/60.0, 1) FROM public.lesson_progress lp WHERE lp.course_id = c.id), 0),
    COALESCE((SELECT COUNT(DISTINCT lp.user_id)::int FROM public.lesson_progress lp WHERE lp.course_id = c.id AND lp.completed = false AND lp.last_activity_at < now() - interval '30 days'), 0)
  FROM public.courses c
  WHERE has_role(auth.uid(),'admin');
$$;
