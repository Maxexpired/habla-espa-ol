
-- Allow users to update their own pending orders (to set status to pending_review)
CREATE POLICY "Users can update their own pending orders"
ON public.course_orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('pending_payment', 'rejected'));

-- Allow admins to delete bank accounts
CREATE POLICY "Admins can delete bank accounts"
ON public.bank_accounts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert enrollments
CREATE POLICY "Admins can insert enrollments"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
