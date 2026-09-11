-- site_settings is queried by the public frontend, so only identifiers that
-- are intentionally visible in page source may pass its public SELECT policy.

DROP POLICY IF EXISTS "Public can read site_settings"
  ON public.site_settings;

-- The legacy FOR ALL admin policy also applied to anonymous SELECT requests.
-- Scope it explicitly so public reads never evaluate the private role helper.
DROP POLICY IF EXISTS "Admins can modify site_settings"
  ON public.site_settings;

CREATE POLICY "Admins can modify site_settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public can read non-sensitive site settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    key = ANY (ARRAY[
      'ga4_measurement_id',
      'gtm_container_id',
      'meta_pixel_id',
      'hotjar_site_id',
      'google_site_verification',
      'bing_site_verification'
    ]::TEXT[])
  );

-- The public blog and site-settings SELECT paths are now independent from
-- this private helper.
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role)
  TO authenticated, service_role;

-- Tokens belong in Supabase Edge Function secrets, never in a browser-readable
-- table. Rotate any token that may previously have been stored in this row.
DELETE FROM public.site_settings
WHERE key = 'meta_capi_access_token';

COMMENT ON TABLE public.site_settings IS
  'Public frontend identifiers only. Server credentials must use Supabase secrets.';
