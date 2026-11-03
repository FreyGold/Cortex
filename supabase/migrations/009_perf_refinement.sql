-- 009_perf_refinement.sql
-- Further performance refinements based on audit results

-- Additional indexes for RLS performance and common filters
CREATE INDEX IF NOT EXISTS idx_note_shares_note_id ON public.note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_resource_ratings_resource_id ON public.resource_ratings(resource_id);

-- Indexes for status/boolean flags that are frequently filtered
CREATE INDEX IF NOT EXISTS idx_notes_is_embedded ON public.notes(is_embedded) WHERE is_embedded = false;
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON public.notes(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned) WHERE is_pinned = true;

-- Indexes for resource categorization
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_exam_type ON public.resources(exam_type) WHERE exam_type IS NOT NULL;

-- Optimize search_notes RPC by making it STABLE (it only reads data)
CREATE OR REPLACE FUNCTION public.search_notes(query_embedding vector, user_id_filter uuid, match_threshold double precision DEFAULT 0.5, match_count integer DEFAULT 10)
 RETURNS TABLE(note_id uuid, chunk_id uuid, title text, chunk_text text, heading text, similarity double precision)
 LANGUAGE plpgsql
 STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS note_id,
    nc.id AS chunk_id,
    n.title,
    nc.chunk_text,
    nc.heading,
    1 - (nc.embedding <=> query_embedding) AS similarity
  FROM note_chunks nc
  JOIN notes n ON n.id = nc.note_id
  WHERE
    n.user_id = user_id_filter
    AND nc.embedding IS NOT NULL
    AND 1 - (nc.embedding <=> query_embedding) > match_threshold
  ORDER BY nc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
