-- Repair stale and cross-language links stored in the five localized blog bodies.
--
-- Audited production snapshot (2026-09-12):
--   * 17 published posts / 85 localized content fields
--   * 434 absolute internal article links
--   * 335 links to 19 stale URL variants
--     (309 render in SSG output; 26 sit in legacy Recommended sections that the
--      frontend removes before rendering, but are cleaned at the data source too)
--   * 79 live links that incorrectly point to /en/ from DE/IT/PT/ES content
--   * 15 posts / 75 content fields require a change
--
-- This migration intentionally does NOT populate public.url_redirects. That table
-- is consumed by a React effect and therefore produces a client-side navigation
-- after an HTTP 200 response, not an SEO-valid HTTP 301/308 redirect.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

LOCK TABLE public.blog_posts IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE _blog_link_map (
  old_href TEXT PRIMARY KEY,
  target_post_id UUID NOT NULL,
  link_kind TEXT NOT NULL CHECK (link_kind IN ('stale', 'valid_en')),
  expected_before_count INTEGER NOT NULL CHECK (expected_before_count > 0)
) ON COMMIT DROP;

-- target_post_id is used instead of a literal destination slug so every content
-- language is rewritten to the target post's current slug_<language> value.
-- The stale mappings below are editorial consolidations into the closest live
-- article, not assertions that the old and new slugs identify the same article.
INSERT INTO _blog_link_map (
  old_href,
  target_post_id,
  link_kind,
  expected_before_count
) VALUES
  -- 19 stale URL variants / 335 occurrences.
  ('https://revillion-partners.com/en/blog/promoting-online-casinos-winning-strategies-for-igaming-affiliates', 'a8f3e6ad-4704-4abd-95ac-1ced8263be09', 'stale', 54),
  ('https://revillion-partners.com/es/blog/estrategias-ganadoras-para-afiliados-de-igaming-en-la-promocion-de-casinos-online', 'a8f3e6ad-4704-4abd-95ac-1ced8263be09', 'stale', 1),
  ('https://revillion-partners.com/en/blog/igaming-data-analysis-optimizing-affiliate-conversions-to-the-top', '61489a44-4b26-475f-afc3-144b5b6c12cf', 'stale', 40),
  ('https://revillion-partners.com/en/blog/profitable-online-casino-niches-2025-igaming-affiliate-guide', '63bf1de3-1802-443f-9da4-6bf3fd028573', 'stale', 35),
  ('https://revillion-partners.com/en/blog/why-track-affiliate-campaigns-for-maximum-revenue', 'b5ac8ccd-94d1-47d9-9588-9da6320461c3', 'stale', 35),
  ('https://revillion-partners.com/en/blog/high-roi-igaming-markets-where-affiliates-earn-the-most', '0979c4c4-d1a1-4708-84d3-9eb236fbcf3c', 'stale', 34),
  ('https://revillion-partners.com/en/blog/high-roi-igaming-markets-where-affiliates-earm-the-most', '0979c4c4-d1a1-4708-84d3-9eb236fbcf3c', 'stale', 1),
  ('https://revillion-partners.com/en/blog/igaming-affiliate-metrics-essential-guide-to-monitoring-your-success', '61489a44-4b26-475f-afc3-144b5b6c12cf', 'stale', 30),
  ('https://revillion-partners.com/en/blog/scaling-igaming-affiliation-a-practical-guide-with-strategies-and-automations', '5f44bc95-a246-42d7-a9ff-e3704ef12493', 'stale', 20),
  ('https://revillion-partners.com/en/blog/igaming-creativity-landing-pages-ctas-and-banners-for-high-conversions', '4e79c2b4-1756-48bb-9d19-45e462fe20ce', 'stale', 20),
  ('https://revillion-partners.com/en/blog/how-to-choose-the-best-traffic-sources-for-igaming-affiliate-campaigns', 'a8f3e6ad-4704-4abd-95ac-1ced8263be09', 'stale', 14),
  ('https://revillion-partners.com/es/blog/como-elegir-las-mejores-fuentes-de-trafico-para-campanas-de-afiliacion-de-igaming', 'a8f3e6ad-4704-4abd-95ac-1ced8263be09', 'stale', 1),
  ('https://revillion-partners.com/en/blog/emerging-technologies-in-igaming-an-affiliate-guide-to-ai-vr-and-blockchain', '0979c4c4-d1a1-4708-84d3-9eb236fbcf3c', 'stale', 10),
  ('https://revillion-partners.com/en/blog/building-an-igaming-personal-brand-a-success-guide-for-affiliates', '07364748-219d-4f54-8ec5-52e9ccdd7a87', 'stale', 10),
  ('https://revillion-partners.com/en/blog/premium-casino-brands-what-sets-them-apart', 'dcb4752b-c060-4c10-a859-00b4ef86c0a1', 'stale', 10),
  ('https://revillion-partners.com/en/blog/common-igaming-affiliate-mistakes-my-guide-to-not-failing-and-prospering', '13601ca1-4278-4d2e-85a8-5422c9ca6ed8', 'stale', 9),
  ('https://revillion-partners.com/es/blog/errores-comunes-de-los-afiliados-de-igaming-mi-guia-para-no-fracasar-y-prosperar', '13601ca1-4278-4d2e-85a8-5422c9ca6ed8', 'stale', 1),
  ('https://revillion-partners.com/en/blog/casino-affiliate-seo-rank-on-google-and-beat-the-competition', 'a8f3e6ad-4704-4abd-95ac-1ced8263be09', 'stale', 5),
  ('https://revillion-partners.com/en/blog/boosting-casino-ltv-innovative-strategies-for-player-retention', '5f44bc95-a246-42d7-a9ff-e3704ef12493', 'stale', 5),

  -- Six live English destinations / 99 occurrences. Twenty occurrences are
  -- already correct in content_en; the other 79 must use localized URLs.
  ('https://revillion-partners.com/en/blog/7-examples-of-casino-content-strategies-for-affiliates', '07364748-219d-4f54-8ec5-52e9ccdd7a87', 'valid_en', 10),
  ('https://revillion-partners.com/en/blog/casino-offer-conversion-tips-for-maximum-affiliate-revenue', '4e79c2b4-1756-48bb-9d19-45e462fe20ce', 'valid_en', 20),
  ('https://revillion-partners.com/en/blog/online-casino-verticals-driving-affiliate-revenue-growth', '0979c4c4-d1a1-4708-84d3-9eb236fbcf3c', 'valid_en', 10),
  ('https://revillion-partners.com/en/blog/role-of-affiliate-networks-in-casinos-impact-on-revenue', 'e2797afe-65eb-4479-b12e-d20cedc8b27b', 'valid_en', 25),
  ('https://revillion-partners.com/en/blog/role-of-trusted-casino-brands-in-affiliate-success', 'bc49fc13-8060-4b6e-80ba-3e052b2d0d88', 'valid_en', 25),
  ('https://revillion-partners.com/en/blog/what-is-traffic-monetization-and-its-impact-on-igaming', '98ebf6d9-077e-4afe-b1ae-011f722786b1', 'valid_en', 9);

-- Avoid creating links from an article back to itself when a stale topic is
-- consolidated into the closest live article. These eight overrides choose the
-- next-best related live article only for the affected source post.
CREATE TEMP TABLE _blog_link_override (
  source_post_id UUID NOT NULL,
  old_href TEXT NOT NULL REFERENCES _blog_link_map(old_href),
  target_post_id UUID NOT NULL,
  PRIMARY KEY (source_post_id, old_href)
) ON COMMIT DROP;

INSERT INTO _blog_link_override (source_post_id, old_href, target_post_id) VALUES
  ('61489a44-4b26-475f-afc3-144b5b6c12cf', 'https://revillion-partners.com/en/blog/igaming-data-analysis-optimizing-affiliate-conversions-to-the-top', 'b5ac8ccd-94d1-47d9-9588-9da6320461c3'),
  ('b5ac8ccd-94d1-47d9-9588-9da6320461c3', 'https://revillion-partners.com/en/blog/why-track-affiliate-campaigns-for-maximum-revenue', '61489a44-4b26-475f-afc3-144b5b6c12cf'),
  ('0979c4c4-d1a1-4708-84d3-9eb236fbcf3c', 'https://revillion-partners.com/en/blog/high-roi-igaming-markets-where-affiliates-earn-the-most', '63bf1de3-1802-443f-9da4-6bf3fd028573'),
  ('61489a44-4b26-475f-afc3-144b5b6c12cf', 'https://revillion-partners.com/en/blog/igaming-affiliate-metrics-essential-guide-to-monitoring-your-success', 'b5ac8ccd-94d1-47d9-9588-9da6320461c3'),
  ('4e79c2b4-1756-48bb-9d19-45e462fe20ce', 'https://revillion-partners.com/en/blog/igaming-creativity-landing-pages-ctas-and-banners-for-high-conversions', '07364748-219d-4f54-8ec5-52e9ccdd7a87'),
  ('0979c4c4-d1a1-4708-84d3-9eb236fbcf3c', 'https://revillion-partners.com/en/blog/emerging-technologies-in-igaming-an-affiliate-guide-to-ai-vr-and-blockchain', '5f44bc95-a246-42d7-a9ff-e3704ef12493'),
  ('dcb4752b-c060-4c10-a859-00b4ef86c0a1', 'https://revillion-partners.com/en/blog/premium-casino-brands-what-sets-them-apart', 'bc49fc13-8060-4b6e-80ba-3e052b2d0d88'),
  ('13601ca1-4278-4d2e-85a8-5422c9ca6ed8', 'https://revillion-partners.com/en/blog/common-igaming-affiliate-mistakes-my-guide-to-not-failing-and-prospering', 'df9dffcc-bb47-4b74-ab67-d2e78c883813');

CREATE OR REPLACE FUNCTION pg_temp.count_token(haystack TEXT, needle TEXT)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN haystack IS NULL OR needle IS NULL OR needle = '' THEN 0
    ELSE (
      (length(haystack) - length(replace(haystack, needle, '')))
      / length(needle)
    )::INTEGER
  END
$$;

CREATE TEMP TABLE _blog_link_migration_state (
  migration_state TEXT PRIMARY KEY CHECK (migration_state IN ('before', 'after')),
  stale_count INTEGER NOT NULL,
  cross_language_count INTEGER NOT NULL,
  internal_article_count INTEGER NOT NULL
) ON COMMIT DROP;

DO $preflight$
DECLARE
  published_count INTEGER;
  stale_count INTEGER;
  cross_language_count INTEGER;
  internal_article_count INTEGER;
  target_count INTEGER;
  invalid_target_count INTEGER;
  single_quoted_count INTEGER;
  mapping RECORD;
  mapping_count INTEGER;
BEGIN
  SELECT count(*)
  INTO published_count
  FROM public.blog_posts
  WHERE status = 'published';

  IF published_count <> 17 THEN
    RAISE EXCEPTION
      'Blog link preflight failed: expected 17 published posts, found %',
      published_count;
  END IF;

  SELECT count(DISTINCT target_post_id)
  INTO target_count
  FROM (
    SELECT target_post_id FROM _blog_link_map
    UNION ALL
    SELECT target_post_id FROM _blog_link_override
  ) targets;

  IF target_count <> 14 THEN
    RAISE EXCEPTION
      'Blog link preflight failed: expected 14 distinct live targets, found %',
      target_count;
  END IF;

  SELECT count(*)
  INTO invalid_target_count
  FROM (
    SELECT DISTINCT target_post_id FROM _blog_link_map
    UNION
    SELECT DISTINCT target_post_id FROM _blog_link_override
  ) targets
  LEFT JOIN public.blog_posts post ON post.id = targets.target_post_id
  WHERE post.id IS NULL
     OR post.status <> 'published'
     OR post.slug_en IS NULL OR post.slug_en !~ '^[a-z0-9-]+$'
     OR post.slug_de IS NULL OR post.slug_de !~ '^[a-z0-9-]+$'
     OR post.slug_it IS NULL OR post.slug_it !~ '^[a-z0-9-]+$'
     OR post.slug_pt IS NULL OR post.slug_pt !~ '^[a-z0-9-]+$'
     OR post.slug_es IS NULL OR post.slug_es !~ '^[a-z0-9-]+$';

  IF invalid_target_count <> 0 THEN
    RAISE EXCEPTION
      'Blog link preflight failed: % target posts are missing, unpublished, or have invalid localized slugs',
      invalid_target_count;
  END IF;

  SELECT coalesce(sum(
    pg_temp.count_token(post.content_en, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_de, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_it, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_pt, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_es, 'href="' || link_map.old_href || '"')
  ), 0)::INTEGER
  INTO stale_count
  FROM _blog_link_map link_map
  CROSS JOIN public.blog_posts post
  WHERE link_map.link_kind = 'stale'
    AND post.status = 'published';

  SELECT coalesce(sum(
    pg_temp.count_token(post.content_de, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_it, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_pt, 'href="' || link_map.old_href || '"')
    + pg_temp.count_token(post.content_es, 'href="' || link_map.old_href || '"')
  ), 0)::INTEGER
  INTO cross_language_count
  FROM _blog_link_map link_map
  CROSS JOIN public.blog_posts post
  WHERE link_map.link_kind = 'valid_en'
    AND post.status = 'published';

  SELECT count(*)::INTEGER
  INTO internal_article_count
  FROM (
    SELECT 1
    FROM public.blog_posts post
    CROSS JOIN LATERAL regexp_matches(
      coalesce(post.content_en, ''),
      'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
      'g'
    ) AS captures(groups)
    WHERE post.status = 'published'
    UNION ALL
    SELECT 1
    FROM public.blog_posts post
    CROSS JOIN LATERAL regexp_matches(
      coalesce(post.content_de, ''),
      'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
      'g'
    ) AS captures(groups)
    WHERE post.status = 'published'
    UNION ALL
    SELECT 1
    FROM public.blog_posts post
    CROSS JOIN LATERAL regexp_matches(
      coalesce(post.content_it, ''),
      'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
      'g'
    ) AS captures(groups)
    WHERE post.status = 'published'
    UNION ALL
    SELECT 1
    FROM public.blog_posts post
    CROSS JOIN LATERAL regexp_matches(
      coalesce(post.content_pt, ''),
      'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
      'g'
    ) AS captures(groups)
    WHERE post.status = 'published'
    UNION ALL
    SELECT 1
    FROM public.blog_posts post
    CROSS JOIN LATERAL regexp_matches(
      coalesce(post.content_es, ''),
      'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
      'g'
    ) AS captures(groups)
    WHERE post.status = 'published'
  ) links;

  SELECT coalesce(sum(
    pg_temp.count_token(post.content_en, 'href=''' || link_map.old_href || '''')
    + pg_temp.count_token(post.content_de, 'href=''' || link_map.old_href || '''')
    + pg_temp.count_token(post.content_it, 'href=''' || link_map.old_href || '''')
    + pg_temp.count_token(post.content_pt, 'href=''' || link_map.old_href || '''')
    + pg_temp.count_token(post.content_es, 'href=''' || link_map.old_href || '''')
  ), 0)::INTEGER
  INTO single_quoted_count
  FROM _blog_link_map link_map
  CROSS JOIN public.blog_posts post
  WHERE post.status = 'published';

  IF single_quoted_count <> 0 THEN
    RAISE EXCEPTION
      'Blog link preflight failed: expected no single-quoted mapped hrefs, found %',
      single_quoted_count;
  END IF;

  IF internal_article_count <> 434 THEN
    RAISE EXCEPTION
      'Blog link preflight failed: expected 434 internal article links, found %',
      internal_article_count;
  END IF;

  IF stale_count = 335 AND cross_language_count = 79 THEN
    FOR mapping IN
      SELECT
        link_map.old_href,
        link_map.expected_before_count,
        coalesce(sum(
          pg_temp.count_token(post.content_en, 'href="' || link_map.old_href || '"')
          + pg_temp.count_token(post.content_de, 'href="' || link_map.old_href || '"')
          + pg_temp.count_token(post.content_it, 'href="' || link_map.old_href || '"')
          + pg_temp.count_token(post.content_pt, 'href="' || link_map.old_href || '"')
          + pg_temp.count_token(post.content_es, 'href="' || link_map.old_href || '"')
        ), 0)::INTEGER AS actual_count
      FROM _blog_link_map link_map
      CROSS JOIN public.blog_posts post
      WHERE post.status = 'published'
      GROUP BY link_map.old_href, link_map.expected_before_count
    LOOP
      IF mapping.actual_count <> mapping.expected_before_count THEN
        RAISE EXCEPTION
          'Blog link preflight failed for %: expected %, found %',
          mapping.old_href,
          mapping.expected_before_count,
          mapping.actual_count;
      END IF;
    END LOOP;

    INSERT INTO _blog_link_migration_state (
      migration_state,
      stale_count,
      cross_language_count,
      internal_article_count
    ) VALUES ('before', stale_count, cross_language_count, internal_article_count);
  ELSIF stale_count = 0 AND cross_language_count = 0 THEN
    INSERT INTO _blog_link_migration_state (
      migration_state,
      stale_count,
      cross_language_count,
      internal_article_count
    ) VALUES ('after', stale_count, cross_language_count, internal_article_count);
  ELSE
    RAISE EXCEPTION
      'Blog link preflight failed: unexpected/partial state (stale %, cross-language %, total %)',
      stale_count,
      cross_language_count,
      internal_article_count;
  END IF;
END;
$preflight$;

-- Durable rollback source. It is intentionally inaccessible to anon/authenticated
-- clients: RLS is enabled and no read policy is created.
CREATE TABLE IF NOT EXISTS public.migration_backup_blog_links_20260912 (
  blog_post_id UUID PRIMARY KEY,
  content_en TEXT,
  content_de TEXT,
  content_it TEXT,
  content_pt TEXT,
  content_es TEXT,
  migrated_content_en TEXT,
  migrated_content_de TEXT,
  migrated_content_it TEXT,
  migrated_content_pt TEXT,
  migrated_content_es TEXT,
  original_updated_at TIMESTAMPTZ,
  migration_updated_at TIMESTAMPTZ,
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.migration_backup_blog_links_20260912 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.migration_backup_blog_links_20260912 FROM PUBLIC;
REVOKE ALL ON TABLE public.migration_backup_blog_links_20260912 FROM anon, authenticated;

COMMENT ON TABLE public.migration_backup_blog_links_20260912 IS
  'Pre-migration copy of localized blog HTML for the 2026-09-12 internal-link repair. No public policies.';

INSERT INTO public.migration_backup_blog_links_20260912 (
  blog_post_id,
  content_en,
  content_de,
  content_it,
  content_pt,
  content_es,
  original_updated_at
)
SELECT
  id,
  content_en,
  content_de,
  content_it,
  content_pt,
  content_es,
  updated_at
FROM public.blog_posts
WHERE status = 'published'
  AND (SELECT migration_state FROM _blog_link_migration_state) = 'before'
ON CONFLICT (blog_post_id) DO NOTHING;

DO $backup_preflight$
DECLARE
  migration_state TEXT;
  backup_count INTEGER;
  backup_mismatch_count INTEGER;
BEGIN
  SELECT state.migration_state
  INTO migration_state
  FROM _blog_link_migration_state state;

  SELECT count(*)
  INTO backup_count
  FROM public.migration_backup_blog_links_20260912;

  IF backup_count <> 17 THEN
    RAISE EXCEPTION
      'Blog link backup preflight failed: expected 17 backup rows, found %',
      backup_count;
  END IF;

  IF migration_state = 'before' THEN
    SELECT count(*)
    INTO backup_mismatch_count
    FROM public.blog_posts post
    JOIN public.migration_backup_blog_links_20260912 backup
      ON backup.blog_post_id = post.id
    WHERE post.status = 'published'
      AND ROW(
        post.content_en,
        post.content_de,
        post.content_it,
        post.content_pt,
        post.content_es,
        post.updated_at
      ) IS DISTINCT FROM ROW(
        backup.content_en,
        backup.content_de,
        backup.content_it,
        backup.content_pt,
        backup.content_es,
        backup.original_updated_at
      );

    IF backup_mismatch_count <> 0 THEN
      RAISE EXCEPTION
        'Blog link backup preflight failed: % backup rows do not match the locked source snapshot',
        backup_mismatch_count;
    END IF;
  END IF;
END;
$backup_preflight$;

DO $rewrite$
DECLARE
  migration_state TEXT;
  source_post RECORD;
  mapping RECORD;
  target_post RECORD;
  chosen_target_id UUID;
  new_content_en TEXT;
  new_content_de TEXT;
  new_content_it TEXT;
  new_content_pt TEXT;
  new_content_es TEXT;
  changed_rows INTEGER := 0;
BEGIN
  SELECT state.migration_state
  INTO migration_state
  FROM _blog_link_migration_state state;

  IF migration_state = 'after' THEN
    RETURN;
  END IF;

  FOR source_post IN
    SELECT
      id,
      content_en,
      content_de,
      content_it,
      content_pt,
      content_es
    FROM public.blog_posts
    WHERE status = 'published'
    ORDER BY id
    FOR UPDATE
  LOOP
    new_content_en := source_post.content_en;
    new_content_de := source_post.content_de;
    new_content_it := source_post.content_it;
    new_content_pt := source_post.content_pt;
    new_content_es := source_post.content_es;

    FOR mapping IN
      SELECT old_href, target_post_id
      FROM _blog_link_map
      ORDER BY old_href
    LOOP
      SELECT coalesce(link_override.target_post_id, mapping.target_post_id)
      INTO chosen_target_id
      FROM (SELECT 1) singleton
      LEFT JOIN _blog_link_override link_override
        ON link_override.source_post_id = source_post.id
       AND link_override.old_href = mapping.old_href;

      SELECT slug_en, slug_de, slug_it, slug_pt, slug_es
      INTO STRICT target_post
      FROM public.blog_posts
      WHERE id = chosen_target_id
        AND status = 'published';

      new_content_en := replace(
        replace(
          new_content_en,
          'href="' || mapping.old_href || '"',
          'href="https://revillion-partners.com/en/blog/' || target_post.slug_en || '"'
        ),
        'href=''' || mapping.old_href || '''',
        'href=''https://revillion-partners.com/en/blog/' || target_post.slug_en || ''''
      );
      new_content_de := replace(
        replace(
          new_content_de,
          'href="' || mapping.old_href || '"',
          'href="https://revillion-partners.com/de/blog/' || target_post.slug_de || '"'
        ),
        'href=''' || mapping.old_href || '''',
        'href=''https://revillion-partners.com/de/blog/' || target_post.slug_de || ''''
      );
      new_content_it := replace(
        replace(
          new_content_it,
          'href="' || mapping.old_href || '"',
          'href="https://revillion-partners.com/it/blog/' || target_post.slug_it || '"'
        ),
        'href=''' || mapping.old_href || '''',
        'href=''https://revillion-partners.com/it/blog/' || target_post.slug_it || ''''
      );
      new_content_pt := replace(
        replace(
          new_content_pt,
          'href="' || mapping.old_href || '"',
          'href="https://revillion-partners.com/pt/blog/' || target_post.slug_pt || '"'
        ),
        'href=''' || mapping.old_href || '''',
        'href=''https://revillion-partners.com/pt/blog/' || target_post.slug_pt || ''''
      );
      new_content_es := replace(
        replace(
          new_content_es,
          'href="' || mapping.old_href || '"',
          'href="https://revillion-partners.com/es/blog/' || target_post.slug_es || '"'
        ),
        'href=''' || mapping.old_href || '''',
        'href=''https://revillion-partners.com/es/blog/' || target_post.slug_es || ''''
      );
    END LOOP;

    IF ROW(
      new_content_en,
      new_content_de,
      new_content_it,
      new_content_pt,
      new_content_es
    ) IS DISTINCT FROM ROW(
      source_post.content_en,
      source_post.content_de,
      source_post.content_it,
      source_post.content_pt,
      source_post.content_es
    ) THEN
      UPDATE public.blog_posts
      SET
        content_en = new_content_en,
        content_de = new_content_de,
        content_it = new_content_it,
        content_pt = new_content_pt,
        content_es = new_content_es
      WHERE id = source_post.id;

      changed_rows := changed_rows + 1;
    END IF;
  END LOOP;

  IF changed_rows <> 15 THEN
    RAISE EXCEPTION
      'Blog link rewrite failed: expected 15 changed rows, changed %',
      changed_rows;
  END IF;
END;
$rewrite$;

-- Capture the exact post-migration timestamps used by the guarded restore below.
UPDATE public.migration_backup_blog_links_20260912 backup
SET
  migrated_content_en = post.content_en,
  migrated_content_de = post.content_de,
  migrated_content_it = post.content_it,
  migrated_content_pt = post.content_pt,
  migrated_content_es = post.content_es,
  migration_updated_at = post.updated_at
FROM public.blog_posts post
WHERE backup.blog_post_id = post.id
  AND (SELECT migration_state FROM _blog_link_migration_state) = 'before'
  AND ROW(
    post.content_en,
    post.content_de,
    post.content_it,
    post.content_pt,
    post.content_es
  ) IS DISTINCT FROM ROW(
    backup.content_en,
    backup.content_de,
    backup.content_it,
    backup.content_pt,
    backup.content_es
  );

CREATE TEMP TABLE _blog_links_after ON COMMIT DROP AS
  SELECT
    post.id AS source_post_id,
    'en'::TEXT AS content_language,
    (captures.groups)[1] AS url_language,
    (captures.groups)[2] AS target_slug
  FROM public.blog_posts post
  CROSS JOIN LATERAL regexp_matches(
    coalesce(post.content_en, ''),
    'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
    'g'
  ) AS captures(groups)
  WHERE post.status = 'published'
UNION ALL
  SELECT post.id, 'de', (captures.groups)[1], (captures.groups)[2]
  FROM public.blog_posts post
  CROSS JOIN LATERAL regexp_matches(
    coalesce(post.content_de, ''),
    'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
    'g'
  ) AS captures(groups)
  WHERE post.status = 'published'
UNION ALL
  SELECT post.id, 'it', (captures.groups)[1], (captures.groups)[2]
  FROM public.blog_posts post
  CROSS JOIN LATERAL regexp_matches(
    coalesce(post.content_it, ''),
    'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
    'g'
  ) AS captures(groups)
  WHERE post.status = 'published'
UNION ALL
  SELECT post.id, 'pt', (captures.groups)[1], (captures.groups)[2]
  FROM public.blog_posts post
  CROSS JOIN LATERAL regexp_matches(
    coalesce(post.content_pt, ''),
    'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
    'g'
  ) AS captures(groups)
  WHERE post.status = 'published'
UNION ALL
  SELECT post.id, 'es', (captures.groups)[1], (captures.groups)[2]
  FROM public.blog_posts post
  CROSS JOIN LATERAL regexp_matches(
    coalesce(post.content_es, ''),
    'href="https://revillion-partners\.com/(en|de|it|pt|es)/blog/([^"?#/]+)"',
    'g'
  ) AS captures(groups)
  WHERE post.status = 'published';

DO $postflight$
DECLARE
  total_links INTEGER;
  wrong_language_links INTEGER;
  missing_target_links INTEGER;
  self_links INTEGER;
  changed_rows INTEGER;
  changed_fields INTEGER;
  migrated_backup_rows INTEGER;
BEGIN
  SELECT count(*) INTO total_links FROM _blog_links_after;

  SELECT count(*)
  INTO wrong_language_links
  FROM _blog_links_after
  WHERE content_language <> url_language;

  SELECT count(*)
  INTO missing_target_links
  FROM _blog_links_after link
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.blog_posts target
    WHERE target.status = 'published'
      AND CASE link.url_language
        WHEN 'en' THEN target.slug_en = link.target_slug
        WHEN 'de' THEN target.slug_de = link.target_slug
        WHEN 'it' THEN target.slug_it = link.target_slug
        WHEN 'pt' THEN target.slug_pt = link.target_slug
        WHEN 'es' THEN target.slug_es = link.target_slug
        ELSE false
      END
  );

  SELECT count(*)
  INTO self_links
  FROM _blog_links_after link
  WHERE EXISTS (
    SELECT 1
    FROM public.blog_posts target
    WHERE target.id = link.source_post_id
      AND target.status = 'published'
      AND CASE link.url_language
        WHEN 'en' THEN target.slug_en = link.target_slug
        WHEN 'de' THEN target.slug_de = link.target_slug
        WHEN 'it' THEN target.slug_it = link.target_slug
        WHEN 'pt' THEN target.slug_pt = link.target_slug
        WHEN 'es' THEN target.slug_es = link.target_slug
        ELSE false
      END
  );

  SELECT count(*)
  INTO changed_rows
  FROM public.blog_posts post
  JOIN public.migration_backup_blog_links_20260912 backup
    ON backup.blog_post_id = post.id
  WHERE ROW(
    post.content_en,
    post.content_de,
    post.content_it,
    post.content_pt,
    post.content_es
  ) IS DISTINCT FROM ROW(
    backup.content_en,
    backup.content_de,
    backup.content_it,
    backup.content_pt,
    backup.content_es
  );

  SELECT coalesce(sum(
    (post.content_en IS DISTINCT FROM backup.content_en)::INTEGER
    + (post.content_de IS DISTINCT FROM backup.content_de)::INTEGER
    + (post.content_it IS DISTINCT FROM backup.content_it)::INTEGER
    + (post.content_pt IS DISTINCT FROM backup.content_pt)::INTEGER
    + (post.content_es IS DISTINCT FROM backup.content_es)::INTEGER
  ), 0)::INTEGER
  INTO changed_fields
  FROM public.blog_posts post
  JOIN public.migration_backup_blog_links_20260912 backup
    ON backup.blog_post_id = post.id;

  SELECT count(*)
  INTO migrated_backup_rows
  FROM public.migration_backup_blog_links_20260912
  WHERE migration_updated_at IS NOT NULL;

  IF total_links <> 434
     OR wrong_language_links <> 0
     OR missing_target_links <> 0
     OR self_links <> 0
     OR changed_rows <> 15
     OR changed_fields <> 75
     OR migrated_backup_rows <> 15 THEN
    RAISE EXCEPTION
      'Blog link postflight failed: total %, wrong-lang %, missing %, self %, rows %, fields %, backup timestamps %',
      total_links,
      wrong_language_links,
      missing_target_links,
      self_links,
      changed_rows,
      changed_fields,
      migrated_backup_rows;
  END IF;
END;
$postflight$;

COMMIT;

-- ---------------------------------------------------------------------------
-- GUARDED RESTORE (documentation only; run as a separate approved migration)
-- ---------------------------------------------------------------------------
-- The restore must abort if any of the 15 migrated HTML bodies has been edited
-- after this migration. The guard compares content rather than updated_at because
-- the current views counter also fires the generic updated_at trigger.
--
-- BEGIN;
-- LOCK TABLE public.blog_posts IN SHARE ROW EXCLUSIVE MODE;
-- DO $restore_preflight$
-- DECLARE
--   expected_restore_rows INTEGER;
--   current_restore_rows INTEGER;
--   changed_after_migration INTEGER;
-- BEGIN
--   SELECT count(*)
--   INTO expected_restore_rows
--   FROM public.migration_backup_blog_links_20260912
--   WHERE migration_updated_at IS NOT NULL;
--
--   SELECT count(*)
--   INTO current_restore_rows
--   FROM public.blog_posts post
--   JOIN public.migration_backup_blog_links_20260912 backup
--     ON backup.blog_post_id = post.id
--   WHERE backup.migration_updated_at IS NOT NULL;
--
--   IF expected_restore_rows <> 15 OR current_restore_rows <> expected_restore_rows THEN
--     RAISE EXCEPTION
--       'Restore aborted: expected 15 migrated posts, backup has %, current table has %',
--       expected_restore_rows,
--       current_restore_rows;
--   END IF;
--
--   SELECT count(*)
--   INTO changed_after_migration
--   FROM public.blog_posts post
--   JOIN public.migration_backup_blog_links_20260912 backup
--     ON backup.blog_post_id = post.id
--   WHERE backup.migration_updated_at IS NOT NULL
--     AND ROW(
--       post.content_en,
--       post.content_de,
--       post.content_it,
--       post.content_pt,
--       post.content_es
--     ) IS DISTINCT FROM ROW(
--       backup.migrated_content_en,
--       backup.migrated_content_de,
--       backup.migrated_content_it,
--       backup.migrated_content_pt,
--       backup.migrated_content_es
--     );
--
--   IF changed_after_migration <> 0 THEN
--     RAISE EXCEPTION
--       'Restore aborted: % migrated posts were edited after the link migration',
--       changed_after_migration;
--   END IF;
-- END;
-- $restore_preflight$;
--
-- UPDATE public.blog_posts post
-- SET
--   content_en = backup.content_en,
--   content_de = backup.content_de,
--   content_it = backup.content_it,
--   content_pt = backup.content_pt,
--   content_es = backup.content_es
-- FROM public.migration_backup_blog_links_20260912 backup
-- WHERE post.id = backup.blog_post_id
--   AND backup.migration_updated_at IS NOT NULL;
-- COMMIT;
