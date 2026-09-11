-- Reserve one Autopilot queue item and its task in the same transaction.
-- This migration does not create or enable a scheduler and does not touch secrets.

CREATE UNIQUE INDEX agent_tasks_autopilot_schedule_slot_key
  ON public.agent_tasks ((input ->> 'schedule_slot'))
  WHERE type = 'content_generation' AND input ? 'schedule_slot';

CREATE OR REPLACE FUNCTION public.claim_autopilot_queue_item(
  p_daily_limit INTEGER,
  p_force BOOLEAN DEFAULT FALSE,
  p_queue_item_id UUID DEFAULT NULL,
  p_schedule_slot TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  outcome TEXT,
  queue_item JSONB,
  task_id UUID,
  today_count INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ;
  v_day_start TIMESTAMPTZ;
  v_item public.blog_queue%ROWTYPE;
  v_task_id UUID;
  v_today_count INTEGER := 0;
  v_slot_key TEXT;
  v_task_input JSONB;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;

  IF p_daily_limit IS NULL OR p_daily_limit < 1 OR p_daily_limit > 10 THEN
    RAISE EXCEPTION 'daily limit out of range' USING ERRCODE = '22023';
  END IF;

  IF p_force IS NULL THEN
    RAISE EXCEPTION 'force flag is required' USING ERRCODE = '22023';
  END IF;

  IF p_force IS FALSE AND p_queue_item_id IS NOT NULL THEN
    RAISE EXCEPTION 'scheduled claims cannot select a queue item' USING ERRCODE = '22023';
  END IF;

  IF p_force IS FALSE AND p_schedule_slot IS NULL THEN
    RAISE EXCEPTION 'scheduled claims require a schedule slot' USING ERRCODE = '22023';
  END IF;

  IF p_force IS TRUE AND p_schedule_slot IS NOT NULL THEN
    RAISE EXCEPTION 'forced claims cannot reserve a schedule slot' USING ERRCODE = '22023';
  END IF;

  IF p_schedule_slot IS NOT NULL AND p_schedule_slot IS DISTINCT FROM (
    date_trunc('hour', p_schedule_slot AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
  ) THEN
    RAISE EXCEPTION 'schedule slot must be aligned to a UTC hour' USING ERRCODE = '22023';
  END IF;

  -- One transaction at a time may evaluate quota, slot dedupe, queue claim, and
  -- task creation. The unique slot index is an independent last line of defense.
  PERFORM pg_catalog.pg_advisory_xact_lock(73298746110201);

  v_now := clock_timestamp();
  v_day_start := date_trunc('day', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  SELECT count(*)::INTEGER
    INTO v_today_count
    FROM public.agent_tasks AS task
   WHERE task.type = 'content_generation'
     -- Scheduled failures still consumed an AI-generation attempt and therefore
     -- reserve daily quota. Legacy tasks have no trigger and count conservatively.
     AND COALESCE(task.input ->> 'trigger', 'scheduled') = 'scheduled'
     AND task.created_at >= v_day_start
     AND task.created_at < v_day_start + INTERVAL '1 day';

  IF p_force IS FALSE THEN
    IF p_schedule_slot IS DISTINCT FROM (
      date_trunc('hour', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    ) THEN
      RETURN QUERY SELECT 'stale_schedule_slot', NULL::JSONB, NULL::UUID, v_today_count;
      RETURN;
    END IF;

    v_slot_key := to_char(
      p_schedule_slot AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:00:00"Z"'
    );

    IF EXISTS (
      SELECT 1
        FROM public.agent_tasks AS task
       WHERE task.type = 'content_generation'
         AND task.input ->> 'schedule_slot' = v_slot_key
    ) THEN
      RETURN QUERY SELECT 'slot_already_started', NULL::JSONB, NULL::UUID, v_today_count;
      RETURN;
    END IF;

    IF v_today_count >= p_daily_limit THEN
      RETURN QUERY SELECT 'daily_limit_reached', NULL::JSONB, NULL::UUID, v_today_count;
      RETURN;
    END IF;
  END IF;

  SELECT queue.*
    INTO v_item
    FROM public.blog_queue AS queue
   WHERE queue.status = 'pending'
     AND queue.generated_post_id IS NULL
     AND (
       (p_queue_item_id IS NOT NULL AND queue.id = p_queue_item_id)
       OR
       (p_queue_item_id IS NULL AND queue.scheduled_for <= v_now)
     )
   ORDER BY queue.priority DESC NULLS LAST, queue.scheduled_for ASC, queue.created_at ASC, queue.id ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'queue_empty', NULL::JSONB, NULL::UUID, v_today_count;
    RETURN;
  END IF;

  v_task_input := jsonb_build_object(
    'queue_id', v_item.id,
    'title', v_item.title,
    'trigger', CASE WHEN p_force IS TRUE THEN 'admin_manual' ELSE 'scheduled' END
  );
  IF v_slot_key IS NOT NULL THEN
    v_task_input := v_task_input || jsonb_build_object('schedule_slot', v_slot_key);
  END IF;

  INSERT INTO public.agent_tasks (type, status, input, agents, created_at, updated_at)
  VALUES (
    'content_generation',
    'running',
    v_task_input,
    jsonb_build_array(jsonb_build_object(
      'ts', v_now,
      'step', 'start',
      'msg', 'Avvio generazione: "' || v_item.title || '"'
    )),
    v_now,
    v_now
  )
  ON CONFLICT ((input ->> 'schedule_slot'))
    WHERE type = 'content_generation' AND input ? 'schedule_slot'
    DO NOTHING
  RETURNING id INTO v_task_id;

  IF v_task_id IS NULL THEN
    RETURN QUERY SELECT 'slot_already_started', NULL::JSONB, NULL::UUID, v_today_count;
    RETURN;
  END IF;

  UPDATE public.blog_queue AS queue
     SET status = 'processing',
         error_message = NULL,
         processed_at = NULL
   WHERE queue.id = v_item.id
     AND queue.status = 'pending'
  RETURNING queue.* INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'queue reservation lost' USING ERRCODE = '40001';
  END IF;

  RETURN QUERY
    SELECT 'started', to_jsonb(v_item), v_task_id, v_today_count + 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_and_link_autopilot_post(
  p_queue_item_id UUID,
  p_task_id UUID,
  p_post JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_linked_post_id UUID;
  v_post_id UUID;
  v_updated_id UUID;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_queue_item_id IS NULL OR p_task_id IS NULL OR p_post IS NULL OR
     jsonb_typeof(p_post) IS DISTINCT FROM 'object' OR pg_column_size(p_post) > 1048576 OR
     NULLIF(btrim(p_post ->> 'slug'), '') IS NULL OR
     NULLIF(btrim(p_post ->> 'title_it'), '') IS NULL OR
     NULLIF(btrim(p_post ->> 'content_it'), '') IS NULL OR
     NULLIF(btrim(p_post ->> 'title_en'), '') IS NULL OR
     NULLIF(btrim(p_post ->> 'content_en'), '') IS NULL THEN
    RAISE EXCEPTION 'invalid post payload' USING ERRCODE = '22023';
  END IF;
  IF p_post ? 'keywords' AND jsonb_typeof(p_post -> 'keywords') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid post keywords' USING ERRCODE = '22023';
  END IF;
  IF p_post ? 'faq_items' AND jsonb_typeof(p_post -> 'faq_items') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid post FAQ items' USING ERRCODE = '22023';
  END IF;

  -- Lock in the same order used by completion/failure: task before queue.
  PERFORM task.id
    FROM public.agent_tasks AS task
   WHERE task.id = p_task_id
     AND task.status = 'running'
     AND task.input ->> 'queue_id' = p_queue_item_id::TEXT
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'running task not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT queue.generated_post_id
    INTO v_linked_post_id
    FROM public.blog_queue AS queue
   WHERE queue.id = p_queue_item_id
     AND queue.status = 'processing'
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'processing queue item not found' USING ERRCODE = 'P0002';
  END IF;

  -- A retry after a committed response loss returns the already linked post.
  IF v_linked_post_id IS NOT NULL THEN
    SELECT post.id
      INTO v_post_id
      FROM public.blog_posts AS post
     WHERE post.id = v_linked_post_id
       AND post.status = 'draft'
       AND post.source = 'blog_queue'
       AND post.external_source_id = p_queue_item_id::TEXT
       AND post.external_ingest_status = 'processing'
     FOR UPDATE;
    IF v_post_id IS NULL THEN
      RAISE EXCEPTION 'linked draft post not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN v_post_id;
  END IF;

  INSERT INTO public.blog_posts (
    slug,
    slug_it,
    slug_en,
    title_it,
    content_it,
    meta_description_it,
    title_en,
    content_en,
    meta_description_en,
    category,
    status,
    featured_image_url,
    featured_image_alt,
    keywords,
    faq_items,
    schema_type,
    views,
    source,
    source_language,
    external_source_id,
    external_ingest_status
  )
  VALUES (
    p_post ->> 'slug',
    COALESCE(NULLIF(p_post ->> 'slug_it', ''), p_post ->> 'slug'),
    COALESCE(NULLIF(p_post ->> 'slug_en', ''), p_post ->> 'slug'),
    p_post ->> 'title_it',
    p_post ->> 'content_it',
    p_post ->> 'meta_description_it',
    p_post ->> 'title_en',
    p_post ->> 'content_en',
    p_post ->> 'meta_description_en',
    COALESCE(NULLIF(p_post ->> 'category', ''), 'news'),
    'draft',
    p_post ->> 'featured_image_url',
    p_post ->> 'featured_image_alt',
    CASE
      WHEN p_post ? 'keywords'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_post -> 'keywords'))
      ELSE '{}'::TEXT[]
    END,
    CASE WHEN p_post ? 'faq_items' THEN p_post -> 'faq_items' ELSE '[]'::JSONB END,
    COALESCE(NULLIF(p_post ->> 'schema_type', ''), 'Article'),
    0,
    'blog_queue',
    'it',
    p_queue_item_id::TEXT,
    'processing'
  )
  ON CONFLICT (source, external_source_id)
    WHERE external_source_id IS NOT NULL
    DO NOTHING
  RETURNING id INTO v_post_id;

  -- This also recovers a durable post identity if a prior caller committed the
  -- insert but never persisted the queue link under older code.
  IF v_post_id IS NULL THEN
    SELECT post.id
      INTO v_post_id
      FROM public.blog_posts AS post
     WHERE post.source = 'blog_queue'
       AND post.external_source_id = p_queue_item_id::TEXT
       AND post.status = 'draft'
       AND post.external_ingest_status = 'processing'
     FOR UPDATE;
    IF v_post_id IS NULL THEN
      RAISE EXCEPTION 'durable draft post not found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  UPDATE public.blog_queue AS queue
     SET generated_post_id = v_post_id
   WHERE queue.id = p_queue_item_id
     AND queue.status = 'processing'
     AND queue.generated_post_id IS NULL
  RETURNING queue.id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'queue/post link failed' USING ERRCODE = '40001';
  END IF;

  RETURN v_post_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_autopilot_queue_item(
  p_queue_item_id UUID,
  p_task_id UUID,
  p_post_id UUID,
  p_summary JSONB,
  p_score INTEGER,
  p_publish BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_updated_id UUID;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_queue_item_id IS NULL OR p_task_id IS NULL OR p_post_id IS NULL OR p_summary IS NULL OR
     p_score IS NULL OR p_score < 0 OR p_score > 100 OR p_publish IS NULL THEN
    RAISE EXCEPTION 'invalid finalization payload' USING ERRCODE = '22023';
  END IF;

  UPDATE public.agent_tasks AS task
     SET status = 'completed',
         summary = p_summary,
         score = p_score,
         agents = (
           CASE WHEN jsonb_typeof(task.agents) = 'array' THEN task.agents ELSE '[]'::JSONB END
         ) || jsonb_build_array(jsonb_build_object(
           'ts', v_now,
           'step', CASE WHEN p_publish IS TRUE THEN 'published' ELSE 'not_published' END,
           'score', p_score,
           'msg', CASE
             WHEN p_publish IS TRUE THEN '✅ Pubblicato dopo il superamento della soglia di revisione'
             ELSE '⚠️ Non pubblicato: rimane in draft dopo la revisione'
           END
         )),
         completed_at = v_now,
         updated_at = v_now
   WHERE task.id = p_task_id
     AND task.status = 'running'
     AND task.input ->> 'queue_id' = p_queue_item_id::TEXT
  RETURNING task.id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'running task not found' USING ERRCODE = 'P0002';
  END IF;

  v_updated_id := NULL;
  UPDATE public.blog_posts AS post
     SET status = CASE WHEN p_publish IS TRUE THEN 'published' ELSE 'draft' END,
         published_at = CASE WHEN p_publish IS TRUE THEN v_now ELSE NULL END,
         external_ingest_status = 'complete',
         external_ingested_at = v_now
   WHERE post.id = p_post_id
     AND post.status = 'draft'
     AND post.source = 'blog_queue'
     AND post.external_source_id = p_queue_item_id::TEXT
     AND post.external_ingest_status = 'processing'
  RETURNING post.id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'draft post not found' USING ERRCODE = 'P0002';
  END IF;

  v_updated_id := NULL;
  UPDATE public.blog_queue AS queue
     SET status = 'completed',
         processed_at = v_now,
         error_message = NULL
   WHERE queue.id = p_queue_item_id
     AND queue.status = 'processing'
     AND queue.generated_post_id = p_post_id
  RETURNING queue.id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'processing queue item not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fail_autopilot_queue_item(
  p_queue_item_id UUID,
  p_task_id UUID,
  p_error_message TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_message TEXT := left(COALESCE(NULLIF(trim(p_error_message), ''), 'Autopilot pipeline failed'), 500);
  v_updated_id UUID;
BEGIN
  IF (SELECT auth.role()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required' USING ERRCODE = '42501';
  END IF;
  IF p_queue_item_id IS NULL OR p_task_id IS NULL THEN
    RAISE EXCEPTION 'invalid failure payload' USING ERRCODE = '22023';
  END IF;

  UPDATE public.agent_tasks AS task
     SET status = 'failed',
         agents = (
           CASE WHEN jsonb_typeof(task.agents) = 'array' THEN task.agents ELSE '[]'::JSONB END
         ) || jsonb_build_array(jsonb_build_object(
           'ts', v_now,
           'step', 'error',
           'msg', 'Errore: ' || v_message
         )),
         completed_at = v_now,
         updated_at = v_now
   WHERE task.id = p_task_id
     AND task.status = 'running'
     AND task.input ->> 'queue_id' = p_queue_item_id::TEXT
  RETURNING task.id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'running task not found' USING ERRCODE = 'P0002';
  END IF;

  v_updated_id := NULL;
  UPDATE public.blog_queue AS queue
     SET status = 'failed',
         processed_at = v_now,
         error_message = v_message,
         retry_count = COALESCE(queue.retry_count, 0) + 1
   WHERE queue.id = p_queue_item_id
     AND queue.status = 'processing'
  RETURNING queue.id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'processing queue item not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_blog_queue_pipeline_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  -- Pipeline RPCs use service_role and already enforce their own exact states.
  IF (SELECT auth.role()) = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'pending' OR NEW.generated_post_id IS NOT NULL THEN
      RAISE EXCEPTION 'new queue items must be pending and unlinked'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'processing' OR OLD.generated_post_id IS NOT NULL THEN
      RAISE EXCEPTION 'linked or processing queue items require controlled reconciliation'
        USING ERRCODE = '55000';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.generated_post_id IS DISTINCT FROM OLD.generated_post_id THEN
    RAISE EXCEPTION 'queue/post links are managed by the pipeline'
      USING ERRCODE = '55000';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
    OLD.status = 'failed' AND
    NEW.status = 'pending' AND
    NEW.generated_post_id IS NULL
  ) THEN
    RAISE EXCEPTION 'queue state transition requires the pipeline or controlled reconciliation'
      USING ERRCODE = '55000';
  END IF;
  IF NEW.status = 'pending' AND NEW.generated_post_id IS NOT NULL THEN
    RAISE EXCEPTION 'linked queue items cannot be pending'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_blog_queue_pipeline_integrity
  ON public.blog_queue;
CREATE TRIGGER enforce_blog_queue_pipeline_integrity
  BEFORE INSERT OR UPDATE OR DELETE ON public.blog_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_blog_queue_pipeline_integrity();

CREATE OR REPLACE FUNCTION public.protect_content_generation_task_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'content_generation' THEN
      RAISE EXCEPTION 'content-generation tasks are an immutable quota and audit ledger'
        USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.type = 'content_generation' OR NEW.type = 'content_generation' THEN
      RAISE EXCEPTION 'content-generation tasks are an immutable quota and audit ledger'
        USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
  ELSIF OLD.type = 'content_generation' THEN
    RAISE EXCEPTION 'content-generation tasks are an immutable quota and audit ledger'
      USING ERRCODE = '55000';
  END IF;
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS protect_content_generation_task_ledger
  ON public.agent_tasks;
CREATE TRIGGER protect_content_generation_task_ledger
  BEFORE INSERT OR UPDATE OR DELETE ON public.agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_content_generation_task_ledger();

REVOKE ALL ON FUNCTION public.claim_autopilot_queue_item(INTEGER, BOOLEAN, UUID, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_autopilot_queue_item(INTEGER, BOOLEAN, UUID, TIMESTAMPTZ)
  TO service_role;

REVOKE ALL ON FUNCTION public.create_and_link_autopilot_post(UUID, UUID, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_and_link_autopilot_post(UUID, UUID, JSONB)
  TO service_role;

REVOKE ALL ON FUNCTION public.complete_autopilot_queue_item(UUID, UUID, UUID, JSONB, INTEGER, BOOLEAN)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_autopilot_queue_item(UUID, UUID, UUID, JSONB, INTEGER, BOOLEAN)
  TO service_role;

REVOKE ALL ON FUNCTION public.fail_autopilot_queue_item(UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_autopilot_queue_item(UUID, UUID, TEXT)
  TO service_role;

COMMENT ON FUNCTION public.claim_autopilot_queue_item(INTEGER, BOOLEAN, UUID, TIMESTAMPTZ)
  IS 'Atomically reserves one Autopilot queue item and task; service-role only.';
COMMENT ON FUNCTION public.create_and_link_autopilot_post(UUID, UUID, JSONB)
  IS 'Atomically creates one draft post and links it to its running Autopilot queue item; service-role only.';
COMMENT ON FUNCTION public.complete_autopilot_queue_item(UUID, UUID, UUID, JSONB, INTEGER, BOOLEAN)
  IS 'Atomically publishes or retains a draft post and completes its linked Autopilot task and queue item; service-role only.';
COMMENT ON FUNCTION public.fail_autopilot_queue_item(UUID, UUID, TEXT)
  IS 'Atomically fails one running Autopilot task and queue item; service-role only.';
