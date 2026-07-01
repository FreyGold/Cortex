-- Migration 044: Fix search_daily_logs search path to include extensions for pgvector operators
CREATE OR REPLACE FUNCTION public.search_daily_logs(
  query_embedding   vector(384),
  user_id_filter    UUID,
  match_threshold   FLOAT DEFAULT 0.5,
  match_count       INT   DEFAULT 10
)
RETURNS TABLE (
  id           UUID,
  date         DATE,
  highlight    TEXT,
  content_text TEXT,
  similarity   FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.id,
    dl.date,
    dl.highlight,
    dl.content_text,
    1 - (dl.embedding <=> query_embedding) AS similarity
  FROM public.daily_logs dl
  WHERE
    dl.user_id = user_id_filter
    AND dl.embedding IS NOT NULL
    AND 1 - (dl.embedding <=> query_embedding) > match_threshold
  ORDER BY dl.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
