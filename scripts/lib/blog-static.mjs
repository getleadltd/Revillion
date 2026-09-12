import sanitizeHtml from 'sanitize-html';
import { DomUtils, parseDocument } from 'htmlparser2';

/**
 * Pure helpers used by the static blog generator. This module deliberately has
 * no network or filesystem access so dataset validation and HTML generation can
 * be exercised independently from Supabase and the build pipeline.
 */

export const DEFAULT_LANGUAGES = Object.freeze(['en', 'de', 'it', 'pt', 'es']);
export const DEFAULT_SITE_URL = 'https://revillion-partners.com';

const DEFAULT_LOCALE_BY_LANGUAGE = Object.freeze({
  en: 'en-US',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  es: 'es-ES',
});

const DEFAULT_OG_LOCALE_BY_LANGUAGE = Object.freeze({
  en: 'en_US',
  de: 'de_DE',
  it: 'it_IT',
  pt: 'pt_PT',
  es: 'es_ES',
});

const DEFAULT_LABELS_BY_LANGUAGE = Object.freeze({
  en: { home: 'Home', blog: 'Blog', readingTime: 'min read' },
  de: { home: 'Startseite', blog: 'Blog', readingTime: 'Min. Lesezeit' },
  it: { home: 'Home', blog: 'Blog', readingTime: 'min di lettura' },
  pt: { home: 'Início', blog: 'Blog', readingTime: 'min de leitura' },
  es: { home: 'Inicio', blog: 'Blog', readingTime: 'min de lectura' },
});

const ARTICLE_ALLOWED_TAGS = Object.freeze([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'br', 'hr',
  'img', 'figure', 'figcaption', 'blockquote', 'code', 'pre',
  'span', 'div', 'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
]);

const ARTICLE_ALLOWED_ATTRIBUTES = Object.freeze({
  '*': ['class', 'id'],
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  th: ['colspan', 'rowspan', 'scope'],
  td: ['colspan', 'rowspan'],
});

const REQUIRED_POST_FIELDS = Object.freeze(['id', 'status', 'slug']);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_PATTERN = /^[a-z]{2}$/;
const MAX_POSTS = 50_000;
const MAX_SLUG_LENGTH = 200;
const RECOMMENDED_HEADING_KEYWORDS = Object.freeze([
  'consigliati',
  'recommended',
  'recomendados',
  'empfohlen',
]);

/** Escape a value for an HTML text or quoted-attribute context. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Escape a value for XML text or quoted-attribute contexts. */
export function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Serialize JSON for embedding in an HTML script element. Escaping `<` is what
 * prevents an attacker-controlled `</script>` sequence from ending the element;
 * the other escapes also make the payload safe around HTML parsers and JS tools.
 */
export function safeJsonLd(value) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError('Cannot serialize an undefined JSON payload');
  }

  return serialized
    .replaceAll('<', '\\u003C')
    .replaceAll('>', '\\u003E')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function assertPlainRecord(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
}

function normalizeLanguages(languages = DEFAULT_LANGUAGES) {
  if (!Array.isArray(languages) || languages.length === 0) {
    throw new TypeError('languages must be a non-empty array');
  }

  const normalized = languages.map((language) => asTrimmedString(language).toLowerCase());
  for (const language of normalized) {
    if (!LANGUAGE_PATTERN.test(language)) {
      throw new TypeError(`Invalid language code: ${language || '(empty)'}`);
    }
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error('languages contains duplicate codes');
  }
  return normalized;
}

function normalizeSiteUrl(siteUrl = DEFAULT_SITE_URL) {
  let parsed;
  try {
    parsed = new URL(siteUrl);
  } catch {
    throw new TypeError(`Invalid site URL: ${siteUrl}`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new TypeError(`Invalid site URL: ${siteUrl}`);
  }
  if (parsed.search || parsed.hash) {
    throw new TypeError('siteUrl cannot contain a query string or fragment');
  }
  return parsed.href.replace(/\/$/, '');
}

function assertHttpUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(`${label} must be an absolute HTTP(S) URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new TypeError(`${label} must be an absolute HTTP(S) URL`);
  }
}

function assertHttpsUrl(value, label) {
  assertHttpUrl(value, label);
  if (new URL(value).protocol !== 'https:') {
    throw new TypeError(`${label} must use HTTPS`);
  }
}

function assertValidDate(value, label) {
  if (!asTrimmedString(value) || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be a valid date`);
  }
}

function localizedFields(post, language) {
  return {
    slug: asTrimmedString(post[`slug_${language}`]),
    title: asTrimmedString(post[`title_${language}`]),
    content: asTrimmedString(post[`content_${language}`]),
    excerpt: asTrimmedString(post[`excerpt_${language}`]),
    metaDescription: asTrimmedString(post[`meta_description_${language}`]),
  };
}

function localizationState(fields) {
  const coreValues = [fields.slug, fields.title, fields.content];
  if (coreValues.every(Boolean)) return 'complete';
  if (coreValues.some(Boolean) || fields.excerpt || fields.metaDescription) return 'partial';
  return 'absent';
}

/**
 * Sanitize stored article HTML with a DOMPurify-equivalent allowlist suitable
 * for server-side generation. Content-level H1 elements become H2 elements so
 * the generated article title remains the page's only H1.
 */
export function sanitizeArticleHtml(input, { language } = {}) {
  const html = typeof input === 'string' ? input : '';
  const normalizedLanguage = language === undefined
    ? null
    : asTrimmedString(language).toLowerCase();

  if (normalizedLanguage && !LANGUAGE_PATTERN.test(normalizedLanguage)) {
    throw new TypeError(`Invalid language code: ${normalizedLanguage}`);
  }

  const sanitized = sanitizeHtml(html, {
    allowedTags: ARTICLE_ALLOWED_TAGS,
    allowedAttributes: ARTICLE_ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['https'],
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    allowVulnerableTags: false,
    disallowedTagsMode: 'discard',
    nonTextTags: [
      'script', 'style', 'textarea', 'option', 'iframe', 'object', 'embed',
      'form', 'input', 'button', 'select', 'template', 'svg', 'math', 'noscript',
    ],
    parseStyleAttributes: false,
    transformTags: {
      h1: 'h2',
      a: (tagName, attribs) => {
        const attributes = { ...attribs };
        if (normalizedLanguage && attributes.href?.startsWith('/blog/')) {
          attributes.href = `/${normalizedLanguage}${attributes.href}`;
        }
        if (attributes.target === '_blank') {
          const rel = new Set(asTrimmedString(attributes.rel).split(/\s+/).filter(Boolean));
          rel.add('noopener');
          rel.add('noreferrer');
          attributes.rel = [...rel].join(' ');
        }
        return { tagName, attribs: attributes };
      },
      img: (tagName, attribs) => {
        const attributes = { ...attribs };
        if (attributes.src && !/^https:\/\//i.test(attributes.src)) {
          delete attributes.src;
        }
        return { tagName, attribs: attributes };
      },
    },
  }).trim();

  return removeRecommendedSection(sanitized);
}

/**
 * Remove imported recommendation blocks exactly as the client article view
 * does: a matching H2/H3 and its following siblings, stopping before the next
 * H2. Running this after sanitization makes the structural scan predictable.
 */
export function removeRecommendedSection(html) {
  const normalizedHtml = typeof html === 'string' ? html : '';
  if (!normalizedHtml) return '';

  // The synthetic wrapper keeps fragment-level siblings together and lets us
  // remove nodes without ever slicing through a nested element.
  const document = parseDocument(
    `<div data-revillion-sanitize-root="">${normalizedHtml}</div>`,
  );
  const root = DomUtils.findOne(
    (node) => node.type === 'tag' && node.attribs?.['data-revillion-sanitize-root'] === '',
    document.children,
    true,
  );
  if (!root) throw new Error('Could not parse sanitized article fragment');

  const headings = DomUtils.findAll(
    (node) => node.type === 'tag' && (node.name === 'h2' || node.name === 'h3'),
    root.children,
  );
  const recommendedHeading = headings.findLast((heading) => {
    const headingText = DomUtils.textContent(heading).replace(/\s+/g, ' ').trim().toLowerCase();
    return RECOMMENDED_HEADING_KEYWORDS.some((keyword) => headingText.includes(keyword));
  });
  if (!recommendedHeading) return normalizedHtml.trim();

  let current = recommendedHeading;
  while (current) {
    if (current !== recommendedHeading && current.type === 'tag' && current.name === 'h2') {
      break;
    }
    const next = current.next;
    DomUtils.removeElement(current);
    current = next;
  }

  return DomUtils.getInnerHTML(root).trim();
}

/** Alias that emphasizes every normalization performed by the sanitizer. */
export const normalizeArticleHtml = sanitizeArticleHtml;

/** Return visible text from trusted or untrusted HTML. */
export function articleTextContent(html) {
  return sanitizeHtml(typeof html === 'string' ? html : '', {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\s+/g, ' ').trim();
}

/**
 * Validate a fetch-independent array of public blog rows. The function returns
 * the same array for convenient composition and throws before any files can be
 * generated when a row is unsafe, incomplete, unpublished, or route-colliding.
 * Partial translations are rejected; wholly absent translations are allowed
 * unless `requireAllLanguages` is enabled.
 */
export function validatePostDataset(posts, {
  languages = DEFAULT_LANGUAGES,
  requireAllLanguages = false,
  requiredStatus = 'published',
} = {}) {
  const normalizedLanguages = normalizeLanguages(languages);
  if (!Array.isArray(posts)) {
    throw new TypeError('Blog post dataset must be an array');
  }
  if (posts.length > MAX_POSTS) {
    throw new RangeError(`Blog post dataset exceeds ${MAX_POSTS} rows`);
  }

  const seenIds = new Map();
  const seenRoutes = new Map();
  const seenSlugs = new Map();

  posts.forEach((post, index) => {
    const label = `posts[${index}]`;
    assertPlainRecord(post, label);

    for (const field of REQUIRED_POST_FIELDS) {
      if (!asTrimmedString(post[field])) {
        throw new TypeError(`${label}.${field} is required`);
      }
    }
    if (post.status !== requiredStatus) {
      throw new Error(`${label}.status must be ${requiredStatus}`);
    }

    const id = asTrimmedString(post.id);
    if (seenIds.has(id)) {
      throw new Error(`${label}.id duplicates ${seenIds.get(id)} (${id})`);
    }
    seenIds.set(id, label);

    for (const field of ['slug', ...normalizedLanguages.map((language) => `slug_${language}`)]) {
      const rawSlug = post[field];
      if (rawSlug == null || rawSlug === '') continue;
      if (typeof rawSlug !== 'string' || rawSlug !== rawSlug.trim()) {
        throw new TypeError(`${label}.${field} must be a canonical slug without surrounding whitespace`);
      }
      if (!SLUG_PATTERN.test(rawSlug) || rawSlug.length > MAX_SLUG_LENGTH) {
        throw new TypeError(`${label}.${field} is not a safe route slug`);
      }

      const existing = seenSlugs.get(rawSlug);
      if (existing && existing.postId !== id) {
        throw new Error(
          `Global slug collision for ${rawSlug}: ${existing.label}.${existing.field} and ${label}.${field}`,
        );
      }
      if (!existing) seenSlugs.set(rawSlug, { postId: id, label, field });
    }

    const publishedAt = asTrimmedString(post.published_at) || asTrimmedString(post.created_at);
    assertValidDate(publishedAt, `${label}.published_at or created_at`);
    if (post.updated_at != null && asTrimmedString(post.updated_at)) {
      assertValidDate(post.updated_at, `${label}.updated_at`);
    }
    if (post.featured_image_url != null && asTrimmedString(post.featured_image_url)) {
      assertHttpsUrl(post.featured_image_url, `${label}.featured_image_url`);
    }

    let completeLocalizations = 0;
    for (const language of normalizedLanguages) {
      const fields = localizedFields(post, language);
      const state = localizationState(fields);
      if (state === 'absent') {
        if (requireAllLanguages) {
          throw new TypeError(`${label} is missing the ${language} localization`);
        }
        continue;
      }
      if (state === 'partial') {
        const missing = ['slug', 'title', 'content'].filter((key) => !fields[key]);
        throw new TypeError(`${label} has an incomplete ${language} localization; missing ${missing.join(', ')}`);
      }
      if (!SLUG_PATTERN.test(fields.slug) || fields.slug.length > MAX_SLUG_LENGTH) {
        throw new TypeError(`${label}.slug_${language} is not a safe route slug`);
      }

      const routeKey = `${language}/${fields.slug}`;
      if (seenRoutes.has(routeKey)) {
        throw new Error(`Localized slug collision for ${routeKey}: ${seenRoutes.get(routeKey)} and ${label}`);
      }
      seenRoutes.set(routeKey, label);
      completeLocalizations += 1;
    }

    if (completeLocalizations === 0) {
      throw new TypeError(`${label} has no complete localization`);
    }
  });

  return posts;
}

function descriptionFor(fields) {
  const source = fields.metaDescription || fields.excerpt || fields.title;
  return articleTextContent(source) || fields.title;
}

/**
 * Convert validated database rows into one immutable-friendly record per public
 * localized route. Alternates only include translations that really exist.
 */
export function buildLocalizedRouteRecords(posts, {
  languages = DEFAULT_LANGUAGES,
  siteUrl = DEFAULT_SITE_URL,
  requireAllLanguages = false,
} = {}) {
  const normalizedLanguages = normalizeLanguages(languages);
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  validatePostDataset(posts, {
    languages: normalizedLanguages,
    requireAllLanguages,
  });

  const routes = [];
  posts.forEach((post, postIndex) => {
    const localized = normalizedLanguages
      .map((language) => ({ language, fields: localizedFields(post, language) }))
      .filter(({ fields }) => localizationState(fields) === 'complete');
    const alternateRoutes = localized.map(({ language, fields }) => ({
      hreflang: language,
      href: `${normalizedSiteUrl}/${language}/blog/${fields.slug}`,
    }));
    const defaultRoute = alternateRoutes.find(({ hreflang }) => hreflang === 'en')
      ?? alternateRoutes[0];

    for (const { language, fields } of localized) {
      const sanitizedContent = sanitizeArticleHtml(fields.content, { language });
      if (!articleTextContent(sanitizedContent)) {
        throw new TypeError(`posts[${postIndex}].content_${language} has no safe visible text`);
      }

      const pathname = `/${language}/blog/${fields.slug}`;
      const canonicalUrl = `${normalizedSiteUrl}${pathname}`;
      routes.push({
        key: `${language}/${fields.slug}`,
        postIndex,
        postId: asTrimmedString(post.id),
        post,
        lang: language,
        language,
        slug: fields.slug,
        title: fields.title,
        content: fields.content,
        sanitizedContent,
        excerpt: fields.excerpt,
        metaDescription: descriptionFor(fields),
        category: asTrimmedString(post.category),
        publishedAt: asTrimmedString(post.published_at) || asTrimmedString(post.created_at),
        modifiedAt: asTrimmedString(post.updated_at)
          || asTrimmedString(post.published_at)
          || asTrimmedString(post.created_at),
        imageUrl: asTrimmedString(post.featured_image_url) || null,
        imageAlt: asTrimmedString(post.featured_image_alt) || fields.title,
        pathname,
        url: canonicalUrl,
        canonicalUrl,
        outputPath: `${language}/blog/${fields.slug}/index.html`,
        alternates: alternateRoutes.map((alternate) => ({ ...alternate })),
        xDefault: { hreflang: 'x-default', href: defaultRoute.href },
      });
    }
  });

  return routes;
}

/** Compare canonical route sets so a remove-plus-add cannot hide a regression. */
export function compareRouteSets(currentRoutes, baselineRoutes) {
  const current = new Set(currentRoutes);
  const baseline = new Set(baselineRoutes);
  return {
    missing: [...baseline].filter((route) => !current.has(route)),
    added: [...current].filter((route) => !baseline.has(route)),
  };
}

function assertRouteRecord(route) {
  assertPlainRecord(route, 'route');
  for (const field of ['lang', 'slug', 'title', 'canonicalUrl', 'publishedAt', 'modifiedAt']) {
    if (!asTrimmedString(route[field])) {
      throw new TypeError(`route.${field} is required`);
    }
  }
  assertHttpUrl(route.canonicalUrl, 'route.canonicalUrl');
  assertValidDate(route.publishedAt, 'route.publishedAt');
  assertValidDate(route.modifiedAt, 'route.modifiedAt');
}

function buildArticleSchemas(route, {
  siteUrl,
  brandName,
  logoUrl,
  authorName,
  labels,
}) {
  const image = route.imageUrl || undefined;
  const article = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: route.title,
    description: route.metaDescription || route.title,
    ...(image ? { image } : {}),
    datePublished: route.publishedAt,
    dateModified: route.modifiedAt,
    inLanguage: route.lang,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: brandName,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': route.canonicalUrl,
    },
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: labels.home,
        item: `${siteUrl}/${route.lang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: labels.blog,
        item: `${siteUrl}/${route.lang}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: route.title,
        item: route.canonicalUrl,
      },
    ],
  };
  return { article, breadcrumb };
}

/** Build complete canonical, social, alternate, and JSON-LD head markup. */
export function buildArticleSeoMarkup(route, {
  siteUrl = DEFAULT_SITE_URL,
  brandName = 'Revillion Partners',
  authorName = 'Revillion Partners',
  logoUrl = `${DEFAULT_SITE_URL}/favicon-revillion-2026.png`,
  localeByLanguage = DEFAULT_OG_LOCALE_BY_LANGUAGE,
  labelsByLanguage = DEFAULT_LABELS_BY_LANGUAGE,
} = {}) {
  assertRouteRecord(route);
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  assertHttpUrl(logoUrl, 'logoUrl');
  const description = route.metaDescription || route.title;
  const title = route.title.endsWith(`| ${brandName}`)
    ? route.title
    : `${route.title} | ${brandName}`;
  const labels = labelsByLanguage[route.lang] || DEFAULT_LABELS_BY_LANGUAGE.en;
  const ogLocale = localeByLanguage[route.lang] || route.lang;
  const alternates = [
    ...(Array.isArray(route.alternates) ? route.alternates : []),
    ...(route.xDefault ? [route.xDefault] : []),
  ];
  const { article, breadcrumb } = buildArticleSchemas(route, {
    siteUrl: normalizedSiteUrl,
    brandName,
    logoUrl,
    authorName,
    labels,
  });

  const lines = [
    `<title data-rh="true">${escapeHtml(title)}</title>`,
    `<meta data-rh="true" name="description" content="${escapeHtml(description)}" />`,
    '<meta data-rh="true" name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />',
    `<link data-rh="true" rel="canonical" href="${escapeHtml(route.canonicalUrl)}" />`,
    ...alternates.map(({ hreflang, href }) =>
      `<link data-rh="true" rel="alternate" hreflang="${escapeHtml(hreflang)}" href="${escapeHtml(href)}" />`),
    '<meta data-rh="true" property="og:type" content="article" />',
    `<meta data-rh="true" property="og:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(description)}" />`,
    `<meta data-rh="true" property="og:url" content="${escapeHtml(route.canonicalUrl)}" />`,
    `<meta data-rh="true" property="og:locale" content="${escapeHtml(ogLocale)}" />`,
    `<meta data-rh="true" property="og:site_name" content="${escapeHtml(brandName)}" />`,
    `<meta data-rh="true" property="article:published_time" content="${escapeHtml(route.publishedAt)}" />`,
    `<meta data-rh="true" property="article:modified_time" content="${escapeHtml(route.modifiedAt)}" />`,
    route.category
      ? `<meta data-rh="true" property="article:section" content="${escapeHtml(route.category)}" />`
      : '',
    route.imageUrl
      ? `<meta data-rh="true" property="og:image" content="${escapeHtml(route.imageUrl)}" />`
      : '',
    '<meta data-rh="true" name="twitter:card" content="summary_large_image" />',
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(description)}" />`,
    route.imageUrl
      ? `<meta data-rh="true" name="twitter:image" content="${escapeHtml(route.imageUrl)}" />`
      : '',
    `<script data-rh="true" type="application/ld+json">${safeJsonLd(article)}</script>`,
    `<script data-rh="true" type="application/ld+json">${safeJsonLd(breadcrumb)}</script>`,
  ];

  return lines.filter(Boolean).join('\n    ');
}

function readingTimeMinutes(content) {
  const words = articleTextContent(content).match(/\S+/g)?.length || 0;
  return Math.max(1, Math.ceil(words / 200));
}

function formatArticleDate(date, language) {
  try {
    const locale = DEFAULT_LOCALE_BY_LANGUAGE[language] || language;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(date));
  } catch {
    return String(date).slice(0, 10);
  }
}

/** Build crawlable semantic markup placed inside the SPA root before hydration. */
export function buildArticleBody(route, {
  siteUrl = DEFAULT_SITE_URL,
  labelsByLanguage = DEFAULT_LABELS_BY_LANGUAGE,
} = {}) {
  assertRouteRecord(route);
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const labels = labelsByLanguage[route.lang] || DEFAULT_LABELS_BY_LANGUAGE.en;
  const content = route.sanitizedContent
    || sanitizeArticleHtml(route.content, { language: route.lang });
  if (!articleTextContent(content)) {
    throw new TypeError('route content has no safe visible text');
  }
  const image = route.imageUrl
    ? `<div class="w-full h-96 overflow-hidden"><img src="${escapeHtml(route.imageUrl)}" alt="${escapeHtml(route.imageAlt || route.title)}" title="${escapeHtml(route.title)}" loading="eager" fetchpriority="high" width="1200" height="630" class="w-full h-full object-cover" /></div>`
    : '';
  const category = route.category
    ? `<span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs">${escapeHtml(route.category)}</span>`
    : '';

  return [
    `<article class="bg-background" data-revillion-static-article="${escapeHtml(route.key || `${route.lang}/${route.slug}`)}">`,
    image,
    '  <div class="container mx-auto px-4 py-12">',
    '    <div class="max-w-4xl mx-auto">',
    `      <nav aria-label="Breadcrumb" class="mb-6"><ol><li><a href="${escapeHtml(`${normalizedSiteUrl}/${route.lang}`)}">${escapeHtml(labels.home)}</a></li><li><a href="${escapeHtml(`${normalizedSiteUrl}/${route.lang}/blog`)}">${escapeHtml(labels.blog)}</a></li><li aria-current="page">${escapeHtml(route.title)}</li></ol></nav>`,
    `      <h1 class="text-4xl md:text-5xl font-bold mb-6">${escapeHtml(route.title)}</h1>`,
    '      <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">',
    `        <time datetime="${escapeHtml(route.publishedAt)}">${escapeHtml(formatArticleDate(route.publishedAt, route.lang))}</time>`,
    `        <span>${readingTimeMinutes(content)} ${escapeHtml(labels.readingTime)}</span>`,
    `        ${category}`,
    '      </div>',
    `      <div class="prose prose-lg max-w-none dark:prose-invert" data-revillion-static-content>${content}</div>`,
    '    </div>',
    '  </div>',
    '</article>',
  ].filter(Boolean).join('\n');
}

/**
 * Serialize the exact client bootstrap contract. The row keeps every database
 * key, but large translated bodies are nulled except for English (the runtime
 * fallback) and the requested language. The source row is never mutated.
 */
export function buildArticleBootstrapJson(route) {
  assertRouteRecord(route);
  assertPlainRecord(route.post, 'route.post');
  const post = { ...route.post };
  for (const language of DEFAULT_LANGUAGES) {
    if (language !== 'en' && language !== route.lang) {
      post[`content_${language}`] = null;
    }
  }
  return safeJsonLd({
    version: 1,
    lang: route.lang,
    slug: route.slug,
    post,
  });
}

/** Build the inert JSON script consumed by the client bootstrap parser. */
export function buildArticleBootstrapScript(route) {
  return `<script id="revillion-blog-bootstrap" type="application/json">${buildArticleBootstrapJson(route)}</script>`;
}

/** Build a single localized `<url>` entry for the sitemap. */
export function buildArticleSitemapEntry(route, {
  changefreq = 'monthly',
  priority = '0.7',
} = {}) {
  assertRouteRecord(route);
  const alternates = [
    ...(Array.isArray(route.alternates) ? route.alternates : []),
    ...(route.xDefault ? [route.xDefault] : []),
  ].map(({ hreflang, href }) =>
    `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`)
    .join('\n');
  const image = route.imageUrl
    ? [
        '    <image:image>',
        `      <image:loc>${escapeXml(route.imageUrl)}</image:loc>`,
        `      <image:title>${escapeXml(route.imageAlt || route.title)}</image:title>`,
        '    </image:image>',
      ].join('\n')
    : '';

  return [
    '  <url>',
    `    <loc>${escapeXml(route.canonicalUrl)}</loc>`,
    alternates,
    `    <lastmod>${escapeXml(new Date(route.modifiedAt).toISOString().slice(0, 10))}</lastmod>`,
    `    <changefreq>${escapeXml(changefreq)}</changefreq>`,
    `    <priority>${escapeXml(priority)}</priority>`,
    image,
    '  </url>',
  ].filter(Boolean).join('\n');
}
