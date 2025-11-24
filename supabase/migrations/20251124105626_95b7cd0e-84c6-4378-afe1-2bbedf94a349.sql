-- Crear tabla de reseñas de cursos
CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL CHECK (char_length(review) >= 10 AND char_length(review) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Índices para mejor performance
CREATE INDEX idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX idx_course_reviews_user_id ON public.course_reviews(user_id);

-- Habilitar RLS
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos pueden ver las reseñas
CREATE POLICY "Anyone can view reviews"
ON public.course_reviews
FOR SELECT
USING (true);

-- Los usuarios autenticados pueden crear reseñas
CREATE POLICY "Authenticated users can create reviews"
ON public.course_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias reseñas
CREATE POLICY "Users can update their own reviews"
ON public.course_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias reseñas
CREATE POLICY "Users can delete their own reviews"
ON public.course_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Los admins pueden hacer todo con las reseñas
CREATE POLICY "Admins can manage all reviews"
ON public.course_reviews
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_course_reviews_updated_at
BEFORE UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Función para obtener el promedio de calificaciones de un curso
CREATE OR REPLACE FUNCTION public.get_course_average_rating(course_uuid UUID)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.course_reviews
  WHERE course_id = course_uuid;
$$;

-- Función para obtener el total de reseñas de un curso
CREATE OR REPLACE FUNCTION public.get_course_reviews_count(course_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.course_reviews
  WHERE course_id = course_uuid;
$$;