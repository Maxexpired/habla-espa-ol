DROP TABLE IF EXISTS public.payment_proofs CASCADE;
DROP TABLE IF EXISTS public.course_orders CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual ILIKE '%payment-proofs%' OR with_check ILIKE '%payment-proofs%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;