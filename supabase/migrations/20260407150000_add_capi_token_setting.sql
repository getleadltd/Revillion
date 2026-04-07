-- Add meta_capi_access_token to site_settings
INSERT INTO public.site_settings (key, value, label, description, category)
VALUES (
  'meta_capi_access_token',
  '',
  'Meta CAPI Access Token',
  'Token di accesso per il Conversions API server-side Meta',
  'meta_ads'
)
ON CONFLICT (key) DO NOTHING;
