-- Create blog_queue table for automated blog post generation
CREATE TABLE public.blog_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  generated_post_id UUID REFERENCES public.blog_posts(id),
  retry_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.blog_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view queue"
ON public.blog_queue
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert queue items"
ON public.blog_queue
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update queue items"
ON public.blog_queue
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete queue items"
ON public.blog_queue
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_blog_queue_status ON public.blog_queue(status);
CREATE INDEX idx_blog_queue_scheduled ON public.blog_queue(scheduled_for);
CREATE INDEX idx_blog_queue_created_by ON public.blog_queue(created_by);