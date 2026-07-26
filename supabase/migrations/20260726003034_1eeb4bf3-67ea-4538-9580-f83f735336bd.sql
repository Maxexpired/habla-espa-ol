
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'CLP',
  buy_order text NOT NULL UNIQUE,
  session_id text NOT NULL,
  transaction_token text UNIQUE,
  authorization_code text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','approved','rejected','cancelled','failed')),
  payment_type text,
  installments integer,
  response_code integer,
  transaction_date timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX purchases_unique_approved_per_course
  ON public.purchases (user_id, course_id)
  WHERE payment_status = 'approved';

CREATE INDEX purchases_user_id_idx ON public.purchases (user_id);
CREATE INDEX purchases_course_id_idx ON public.purchases (course_id);
CREATE INDEX purchases_status_idx ON public.purchases (payment_status);

GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  event text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  status_code integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payment_logs_purchase_idx ON public.payment_logs (purchase_id);
CREATE INDEX payment_logs_event_idx ON public.payment_logs (event);
CREATE INDEX payment_logs_created_idx ON public.payment_logs (created_at DESC);

GRANT SELECT ON public.payment_logs TO authenticated;
GRANT ALL ON public.payment_logs TO service_role;

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all payment logs"
  ON public.payment_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
