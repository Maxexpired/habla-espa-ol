
-- Retirar política amplia y vista, dejar solo own+admin
DROP POLICY IF EXISTS "Public can read basic profile fields via view" ON public.profiles;
DROP VIEW IF EXISTS public.profiles_public;

-- Column grants: authenticated NO puede leer email en filas ajenas (la policy ya lo bloquea,
-- pero limitamos también a nivel de columnas para defensa en profundidad)
REVOKE SELECT ON public.profiles FROM anon;

-- Función segura: devuelve datos públicos de autores dado un conjunto de user_ids
CREATE OR REPLACE FUNCTION public.get_review_authors(_user_ids uuid[])
RETURNS TABLE (id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_review_authors(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_review_authors(uuid[]) TO anon, authenticated;
