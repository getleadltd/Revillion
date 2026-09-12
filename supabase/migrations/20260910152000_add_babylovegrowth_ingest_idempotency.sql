-- Persist the BabyLoveGrowth delivery identity and its small ingest state
-- machine. Nullable columns preserve every existing/manual blog post.

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS external_source_id TEXT,
  ADD COLUMN IF NOT EXISTS external_ingest_status TEXT,
  ADD COLUMN IF NOT EXISTS external_ingested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.blog_posts.external_source_id IS
  'Stable article identifier supplied by an external content source.';
COMMENT ON COLUMN public.blog_posts.external_ingest_status IS
  'External ingest state: processing until all retry-safe side effects complete, then complete.';
COMMENT ON COLUMN public.blog_posts.external_ingested_at IS
  'Time at which all external ingest side effects completed.';

-- NOT VALID avoids an unnecessary table-wide lock while installing each
-- check; validation is explicit and safe because the new columns start null.
DO $$
BEGIN
  ALTER TABLE public.blog_posts
    ADD CONSTRAINT blog_posts_external_source_id_valid
    CHECK (
      external_source_id IS NULL
      OR (
        external_source_id = btrim(external_source_id)
        AND char_length(external_source_id) BETWEEN 1 AND 200
        AND external_source_id !~ '[[:cntrl:]]'
      )
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.blog_posts
    ADD CONSTRAINT blog_posts_external_ingest_state_valid
    CHECK (
      (
        external_source_id IS NULL
        AND external_ingest_status IS NULL
        AND external_ingested_at IS NULL
      )
      OR (
        external_source_id IS NOT NULL
        AND source IS NOT NULL
        AND external_ingest_status = 'processing'
        AND external_ingested_at IS NULL
      )
      OR (
        external_source_id IS NOT NULL
        AND source IS NOT NULL
        AND external_ingest_status = 'complete'
        AND external_ingested_at IS NOT NULL
      )
    ) NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.blog_posts
  VALIDATE CONSTRAINT blog_posts_external_source_id_valid;
ALTER TABLE public.blog_posts
  VALIDATE CONSTRAINT blog_posts_external_ingest_state_valid;

-- The compound key permits different providers to use the same identifier,
-- while concurrent deliveries from one provider can create only one post.
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_source_external_source_id_uidx
  ON public.blog_posts (source, external_source_id)
  WHERE external_source_id IS NOT NULL;
