ALTER TABLE public.embedding_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "embedding_jobs_owner_access" ON public.embedding_jobs;
CREATE POLICY "embedding_jobs_owner_access"
  ON public.embedding_jobs
  FOR ALL
  TO authenticated
  USING (
    triggered_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    triggered_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );
