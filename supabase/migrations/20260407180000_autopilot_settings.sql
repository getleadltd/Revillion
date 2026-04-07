-- Autopilot settings
INSERT INTO public.site_settings (key, value) VALUES
  ('autopilot_enabled', 'false'),
  ('autopilot_min_score', '70'),
  ('autopilot_daily_limit', '2'),
  ('autopilot_schedule_hours', '9,15')
ON CONFLICT (key) DO NOTHING;
