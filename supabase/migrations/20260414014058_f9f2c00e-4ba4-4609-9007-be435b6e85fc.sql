ALTER TABLE public.courses ADD COLUMN price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN currency text NOT NULL DEFAULT 'CLP';