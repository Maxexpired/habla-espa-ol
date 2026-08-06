
CREATE POLICY "Admins manage course files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'course-files' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'course-files' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Enrolled users read course files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'course-files'
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = auth.uid()
        AND e.status <> 'cancelled'
        AND (storage.foldername(name))[1] = e.course_id::text
    )
  );
