-- Agent tasks table: stores all agent runs, status and results
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,           -- 'article_review' | 'content_generation' | 'production_check'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
  input JSONB,                  -- input params (e.g. post_id, lang)
  agents JSONB,                 -- per-agent results
  summary JSONB,                -- consolidated result
  score INTEGER,                -- 0-100 overall score
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage agent tasks"
  ON public.agent_tasks FOR ALL TO authenticated USING (true);

-- Index for dashboard queries
CREATE INDEX agent_tasks_type_idx ON public.agent_tasks(type);
CREATE INDEX agent_tasks_status_idx ON public.agent_tasks(status);
CREATE INDEX agent_tasks_created_at_idx ON public.agent_tasks(created_at DESC);
