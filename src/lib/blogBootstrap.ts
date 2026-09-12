import type { Database, Json } from '@/integrations/supabase/types';

export type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];

const BLOG_BOOTSTRAP_ID = 'revillion-blog-bootstrap';
const BLOG_LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;

type BlogLanguage = (typeof BLOG_LANGUAGES)[number];

type BlogBootstrapPayload = {
  version: 1;
  lang: BlogLanguage;
  slug: string;
  post: BlogPostRow;
};

const requiredStringFields = [
  'category',
  'content_en',
  'id',
  'slug',
  'status',
  'title_en',
] as const satisfies readonly (keyof BlogPostRow)[];

const nullableStringFields = [
  'author_id',
  'content_de',
  'content_es',
  'content_it',
  'content_pt',
  'created_at',
  'excerpt_de',
  'excerpt_en',
  'excerpt_es',
  'excerpt_it',
  'excerpt_pt',
  'external_ingest_status',
  'external_ingested_at',
  'external_source_id',
  'featured_image_alt',
  'featured_image_url',
  'meta_description_de',
  'meta_description_en',
  'meta_description_es',
  'meta_description_it',
  'meta_description_pt',
  'published_at',
  'schema_type',
  'slug_de',
  'slug_en',
  'slug_es',
  'slug_it',
  'slug_pt',
  'source',
  'source_language',
  'title_de',
  'title_es',
  'title_it',
  'title_pt',
  'updated_at',
] as const satisfies readonly (keyof BlogPostRow)[];

const cachedPosts = new Map<string, BlogPostRow>();
let documentPayloadConsumed = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isJson(value: unknown): value is Json {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJson);
  }

  return isRecord(value) && Object.values(value).every(
    (entry) => entry === undefined || isJson(entry),
  );
}

function isBlogLanguage(value: unknown): value is BlogLanguage {
  return typeof value === 'string' && BLOG_LANGUAGES.some((lang) => lang === value);
}

function isSafeSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]+$/.test(value);
}

function isBlogPostRow(value: unknown): value is BlogPostRow {
  if (!isRecord(value)) return false;

  if (!requiredStringFields.every((field) => typeof value[field] === 'string')) {
    return false;
  }

  if (!nullableStringFields.every((field) => isNullableString(value[field]))) {
    return false;
  }

  const keywords = value.keywords;
  if (keywords !== null && (!Array.isArray(keywords) || !keywords.every((item) => typeof item === 'string'))) {
    return false;
  }

  if (!isJson(value.faq_items)) return false;

  return value.views === null || (typeof value.views === 'number' && Number.isFinite(value.views));
}

function getLocalizedSlug(post: BlogPostRow, lang: BlogLanguage): string {
  const localizedSlugs: Record<BlogLanguage, string | null> = {
    en: post.slug_en,
    de: post.slug_de,
    it: post.slug_it,
    pt: post.slug_pt,
    es: post.slug_es,
  };

  return localizedSlugs[lang] || post.slug_en || post.slug;
}

function isBlogBootstrapPayload(value: unknown): value is BlogBootstrapPayload {
  if (!isRecord(value)) return false;

  return (
    value.version === 1 &&
    isBlogLanguage(value.lang) &&
    isSafeSlug(value.slug) &&
    isBlogPostRow(value.post) &&
    value.post.status === 'published' &&
    getLocalizedSlug(value.post, value.lang) === value.slug
  );
}

function cacheKey(lang: BlogLanguage, slug: string): string {
  return `${lang}:${slug}`;
}

function consumeDocumentPayload(): void {
  if (documentPayloadConsumed || typeof document === 'undefined') return;

  const script = document.getElementById(BLOG_BOOTSTRAP_ID);
  if (!script || script.tagName !== 'SCRIPT' || script.getAttribute('type') !== 'application/json') {
    return;
  }

  documentPayloadConsumed = true;
  const serializedPayload = script.textContent || '';
  script.remove();

  try {
    const payload: unknown = JSON.parse(serializedPayload);
    if (!isBlogBootstrapPayload(payload)) return;

    cachedPosts.set(cacheKey(payload.lang, payload.slug), payload.post);
  } catch {
    // Static bootstrap data is an optional optimization. The query remains the source of truth.
  }
}

/**
 * Returns a generated article bootstrap only when it matches the requested route.
 * The payload is consumed once in the browser and cached so React Strict Mode can
 * safely call the initializer more than once.
 */
export function getBlogBootstrapPost(lang: string, slug: string): BlogPostRow | undefined {
  if (!isBlogLanguage(lang) || !isSafeSlug(slug)) return undefined;

  consumeDocumentPayload();
  return cachedPosts.get(cacheKey(lang, slug));
}
