-- Site settings table: stores configurable values (tracking IDs, API keys, etc.)
-- Readable by anyone (all values are non-sensitive frontend keys like GA4/Pixel IDs)
-- Writable only by admins

CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  label       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'general',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read (GA4 IDs, Pixel IDs are visible in page source anyway)
CREATE POLICY "Public can read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admins can modify site_settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default values (preserving existing GA4 ID already in use)
INSERT INTO public.site_settings (key, value, label, description, category) VALUES
  ('ga4_measurement_id',       'G-FKENPNYCSP', 'GA4 Measurement ID',              'Google Analytics 4 ID (e.g. G-XXXXXXXXXX). Found in GA4 → Admin → Data Streams.',                           'analytics'),
  ('meta_pixel_id',            '',              'Meta Pixel ID',                   'Facebook/Instagram Pixel ID. Found in Meta Business Manager → Events Manager → your Pixel → Settings.',      'meta_ads'),
  ('gtm_container_id',         '',              'GTM Container ID',                'Google Tag Manager container (e.g. GTM-XXXXXXX). Optional — if set, loads GTM instead of direct GA4 script.', 'analytics'),
  ('google_site_verification', '',              'Google Search Console',           'Verification meta tag content value (the part after content=). From Search Console → Settings → Ownership.', 'seo'),
  ('bing_site_verification',   '',              'Bing Webmaster Verification',     'Bing Webmaster Tools site verification meta tag content value.',                                               'seo'),
  ('hotjar_site_id',           '',              'Hotjar Site ID',                  'Hotjar site ID for heatmaps and session recordings. Found in Hotjar → Settings → Tracking Code.',             'analytics')
ON CONFLICT (key) DO NOTHING;
