-- Create seo_monitoring_logs table for automated SEO checks
CREATE TABLE IF NOT EXISTS seo_monitoring_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('broken_links', 'missing_alt_tags', 'hreflang_errors')),
  
  -- Statistics
  total_items_checked INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Error details (JSON)
  error_details JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_logs_scan_date ON seo_monitoring_logs(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_logs_scan_type ON seo_monitoring_logs(scan_type);
CREATE INDEX IF NOT EXISTS idx_seo_logs_status ON seo_monitoring_logs(status);

-- Enable RLS
ALTER TABLE seo_monitoring_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view SEO logs"
  ON seo_monitoring_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert SEO logs"
  ON seo_monitoring_logs FOR INSERT
  WITH CHECK (true);