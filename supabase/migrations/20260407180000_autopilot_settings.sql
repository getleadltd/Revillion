-- Autopilot settings
INSERT INTO public.site_settings (key, value) VALUES
  ('autopilot_enabled', 'false'),
  ('autopilot_min_score', '70')
ON CONFLICT (key) DO NOTHING;
