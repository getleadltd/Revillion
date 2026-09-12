import assert from 'node:assert/strict';
import test from 'node:test';

import {
  articleTextContent,
  buildArticleBody,
  buildArticleBootstrapJson,
  buildArticleBootstrapScript,
  buildArticleSeoMarkup,
  buildArticleSitemapEntry,
  buildLocalizedRouteRecords,
  compareRouteSets,
  escapeHtml,
  normalizeArticleHtml,
  removeRecommendedSection,
  safeJsonLd,
  sanitizeArticleHtml,
  validatePostDataset,
} from './lib/blog-static.mjs';

function makePost(overrides = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    status: 'published',
    category: 'guides',
    slug: 'legacy-guide',
    slug_en: 'safe-guide',
    slug_de: null,
    slug_it: 'guida-sicura',
    slug_pt: null,
    slug_es: null,
    title_en: 'A Safe & Useful Guide',
    title_de: null,
    title_it: 'Una guida sicura',
    title_pt: null,
    title_es: null,
    content_en: '<h1>Introduction</h1><p>Useful article body.</p>',
    content_de: null,
    content_it: '<h1>Introduzione</h1><p>Contenuto utile.</p>',
    content_pt: null,
    content_es: null,
    excerpt_en: 'A useful English excerpt.',
    excerpt_de: null,
    excerpt_it: 'Un estratto utile.',
    excerpt_pt: null,
    excerpt_es: null,
    meta_description_en: 'A safe guide for affiliate marketers.',
    meta_description_de: null,
    meta_description_it: 'Una guida sicura per affiliate marketer.',
    meta_description_pt: null,
    meta_description_es: null,
    created_at: '2026-01-01T10:00:00.000Z',
    published_at: '2026-01-02T10:00:00.000Z',
    updated_at: '2026-02-03T12:00:00.000Z',
    featured_image_url: 'https://images.example.test/guide.jpg',
    featured_image_alt: 'Guide cover',
    ...overrides,
  };
}

test('escapeHtml escapes text and quoted-attribute metacharacters', () => {
  assert.equal(
    escapeHtml(`<a title="O'Reilly">A&B</a>`),
    '&lt;a title=&quot;O&#39;Reilly&quot;&gt;A&amp;B&lt;/a&gt;',
  );
  assert.equal(escapeHtml(null), '');
});

test('safeJsonLd prevents a JSON payload from closing its script element', () => {
  const dangerous = {
    headline: '</script><img src=x onerror=alert(1)>',
    separator: '\u2028',
  };
  const serialized = safeJsonLd(dangerous);

  assert.equal(serialized.includes('</script>'), false);
  assert.match(serialized, /\\u003C\/script\\u003E/);
  assert.deepEqual(JSON.parse(serialized), dangerous);
  assert.throws(() => safeJsonLd(undefined), /undefined JSON payload/);
});

test('article sanitizer strips active content and normalizes nested H1 to H2', () => {
  const input = [
    '<meta http-equiv="refresh" content="0;url=https://evil.test">',
    '<h1 id="intro" onclick="alert(1)">Intro</h1>',
    '<script>alert("script")</script>',
    '<style>body{display:none}</style>',
    '<iframe src="https://evil.test">frame</iframe>',
    '<form action="https://evil.test"><input name="secret"><p>form text</p></form>',
    '<p onmouseover="alert(1)">Safe paragraph</p>',
    '<a href="javascript:alert(1)" onclick="alert(1)">bad link</a>',
    '<a href="/blog/next-guide" target="_blank">internal link</a>',
    '<a href="https://revillion-partners.com">absolute home</a>',
    '<a href="https://revillion-partners.com?utm_source=article">absolute home with query</a>',
    '<a href="https://revillion-partners.com#top">absolute home with fragment</a>',
    '<a href="https://revillion-partners.com/?next=/">query ending with slash</a>',
    '<a href="https://revillion-partners.com/#/">fragment ending with slash</a>',
    '<a href="https://revillion-partners.com.example.test/">lookalike external origin</a>',
    '<a href="/">relative home</a>',
    '<a href="https://revillion-partners.com/en/blog">blog index</a>',
    '<img src="javascript:alert(1)" onerror="alert(1)" alt="cover">',
    '<img src="http://images.example.test/insecure.jpg" alt="insecure">',
    '<img src="https://images.example.test/secure.jpg" alt="secure">',
  ].join('');
  const output = sanitizeArticleHtml(input, { language: 'it' });

  assert.match(output, /<h2 id="intro">Intro<\/h2>/);
  assert.doesNotMatch(output, /<h1\b/i);
  assert.doesNotMatch(output, /<(?:meta|script|style|iframe|form|input)\b/i);
  assert.doesNotMatch(output, /(?:onclick|onmouseover|onerror)=/i);
  assert.doesNotMatch(output, /javascript:/i);
  assert.doesNotMatch(output, /http:\/\/images\.example\.test\/insecure\.jpg/i);
  assert.match(output, /src="https:\/\/images\.example\.test\/secure\.jpg"/);
  assert.match(output, /href="\/it\/blog\/next-guide"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\/it"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\/it\?utm_source=article"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\/it#top"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\/it\?next=\/"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\/it#\/"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\.example\.test\/"/);
  assert.match(output, /href="\/it"/);
  assert.match(output, /href="https:\/\/revillion-partners\.com\/it\/blog"/);
  assert.match(output, /rel="noopener noreferrer"/);
  assert.match(output, /Safe paragraph/);
  assert.equal(normalizeArticleHtml(input, { language: 'it' }), output);
  assert.match(
    sanitizeArticleHtml('<a href="/">unsupported language</a>', { language: 'fr' }),
    /href="\/"/,
  );
});

test('article sanitizer removes localized recommendation blocks and preserves the next H2', () => {
  for (const heading of ['Consigliati', 'Recommended', 'Recomendados', 'Empfohlen']) {
    const input = [
      '<h2>Useful section</h2>',
      '<p>Keep before.</p>',
      `<h3><strong>${heading}</strong></h3>`,
      '<ul><li>Remove this imported recommendation.</li></ul>',
      '<p>Remove this too.</p>',
      '<h2>Following section</h2>',
      '<p>Keep after.</p>',
    ].join('');
    const output = sanitizeArticleHtml(input, { language: 'en' });

    assert.match(output, /Keep before\./);
    assert.match(output, /<h2>Following section<\/h2><p>Keep after\.<\/p>$/);
    assert.doesNotMatch(output, new RegExp(heading, 'i'));
    assert.doesNotMatch(output, /Remove this/);
  }

  assert.equal(
    removeRecommendedSection('<h2>Recommended</h2><p>Remove me.</p>'),
    '',
  );

  assert.equal(
    removeRecommendedSection('<h2 id="recommended">Empfehlungen</h2><p>Remove localized.</p>'),
    '',
  );

  assert.equal(
    removeRecommendedSection(
      '<section><div><h3>Recommended</h3><p>Remove nested.</p><h2>Nested next</h2><p>Keep nested.</p></div></section><h2>Outer next</h2>',
    ),
    '<section><div><h2>Nested next</h2><p>Keep nested.</p></div></section><h2>Outer next</h2>',
  );
});

test('articleTextContent returns normalized visible text', () => {
  assert.equal(articleTextContent('<p>Hello <strong>world</strong>.</p>'), 'Hello world.');
});

test('post dataset rejects missing localization fields and unpublished rows', () => {
  const missingContent = makePost({ content_en: null });
  assert.throws(
    () => validatePostDataset([missingContent]),
    /incomplete en localization; missing content/,
  );

  assert.throws(
    () => validatePostDataset([makePost({ status: 'draft' })]),
    /status must be published/,
  );

  assert.throws(
    () => validatePostDataset([makePost({ slug_en: '../unsafe' })]),
    /slug_en is not a safe route slug/,
  );

  assert.throws(
    () => validatePostDataset([makePost({ id: '' })]),
    /id is required/,
  );

  assert.throws(
    () => validatePostDataset([makePost({ featured_image_url: 'http://images.example.test/cover.jpg' })]),
    /featured_image_url must use HTTPS/,
  );
});

test('post dataset detects same-language slug collisions before route generation', () => {
  const first = makePost();
  const second = makePost({
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'another-legacy-guide',
    title_en: 'Another guide',
    slug_it: 'altra-guida',
  });

  assert.throws(
    () => validatePostDataset([first, second]),
    /Global slug collision for safe-guide/,
  );
});

test('post dataset rejects cross-column collisions and non-canonical whitespace', () => {
  const first = makePost();
  const second = makePost({
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'another-legacy-guide',
    slug_en: 'another-safe-guide',
    slug_it: 'safe-guide',
  });

  assert.throws(
    () => validatePostDataset([first, second]),
    /Global slug collision for safe-guide/,
  );
  assert.throws(
    () => validatePostDataset([makePost({ slug_en: ' safe-guide ' })]),
    /canonical slug without surrounding whitespace/,
  );
});

test('localized route records contain exact canonical and alternate mappings', () => {
  const [english, italian] = buildLocalizedRouteRecords([makePost()], {
    siteUrl: 'https://revillion-partners.com/',
  });

  assert.equal(english.lang, 'en');
  assert.equal(english.slug, 'safe-guide');
  assert.equal(english.pathname, '/en/blog/safe-guide');
  assert.equal(english.url, 'https://revillion-partners.com/en/blog/safe-guide');
  assert.equal(english.canonicalUrl, english.url);
  assert.equal(english.outputPath, 'en/blog/safe-guide/index.html');
  assert.deepEqual(english.alternates, [
    { hreflang: 'en', href: 'https://revillion-partners.com/en/blog/safe-guide' },
    { hreflang: 'it', href: 'https://revillion-partners.com/it/blog/guida-sicura' },
  ]);
  assert.deepEqual(english.xDefault, {
    hreflang: 'x-default',
    href: 'https://revillion-partners.com/en/blog/safe-guide',
  });
  assert.match(english.sanitizedContent, /^<h2>Introduction<\/h2>/);
  assert.equal(italian.lang, 'it');
  assert.equal(italian.slug, 'guida-sicura');
});

test('route comparison detects a removed URL even when total count is unchanged', () => {
  assert.deepEqual(
    compareRouteSets(
      ['https://example.test/kept', 'https://example.test/new'],
      ['https://example.test/kept', 'https://example.test/removed'],
    ),
    {
      missing: ['https://example.test/removed'],
      added: ['https://example.test/new'],
    },
  );
});

test('SEO, semantic body, bootstrap, and sitemap builders escape stored values', () => {
  const injected = '</script><img src=x onerror=alert(1)>';
  const post = makePost({
    title_en: `Guide ${injected}`,
    content_en: `<h1>Nested title</h1><p>Body ${injected}</p><script>alert(1)</script>`,
    meta_description_en: `Description ${injected}`,
    featured_image_alt: `Cover & ${injected}`,
  });
  const [route] = buildLocalizedRouteRecords([post]);
  const seo = buildArticleSeoMarkup(route);
  const body = buildArticleBody(route);
  const bootstrapJson = buildArticleBootstrapJson(route);
  const bootstrapScript = buildArticleBootstrapScript(route);
  const sitemap = buildArticleSitemapEntry(route);

  assert.match(seo, /rel="canonical" href="https:\/\/revillion-partners\.com\/en\/blog\/safe-guide"/);
  assert.match(seo, /hreflang="x-default"/);
  assert.equal(seo.includes(`${injected} | Revillion Partners`), false);
  assert.match(seo, /Guide &lt;\/script&gt;&lt;img/);
  assert.match(seo, /\\u003C\/script\\u003E/);

  assert.equal((body.match(/<h1\b/g) || []).length, 1);
  assert.match(body, /<h2>Nested title<\/h2>/);
  assert.doesNotMatch(body, /<script\b/i);
  const renderedContent = body.match(/data-revillion-static-content>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(renderedContent);
  assert.doesNotMatch(renderedContent, /\sonerror\s*=/i);

  assert.deepEqual(JSON.parse(bootstrapJson), {
    version: 1,
    lang: 'en',
    slug: 'safe-guide',
    post: {
      ...post,
      content_de: null,
      content_it: null,
      content_pt: null,
      content_es: null,
    },
  });
  assert.equal(bootstrapScript.includes(injected), false);
  assert.match(bootstrapScript, /^<script id="revillion-blog-bootstrap" type="application\/json">/);

  assert.match(sitemap, /<lastmod>2026-02-03<\/lastmod>/);
  assert.match(sitemap, /<image:loc>https:\/\/images\.example\.test\/guide\.jpg<\/image:loc>/);
  assert.match(sitemap, /Cover &amp; &lt;\/script&gt;/);
});

test('bootstrap keeps English fallback plus current body without mutating the row', () => {
  const post = makePost({
    content_de: '<p>Deutsch</p>',
    content_pt: '<p>Português</p>',
    content_es: '<p>Español</p>',
    slug_de: 'sicherer-ratgeber',
    slug_pt: 'guia-seguro',
    slug_es: 'guia-segura',
    title_de: 'Sicherer Ratgeber',
    title_pt: 'Guia seguro',
    title_es: 'Guía segura',
  });
  const italianRoute = buildLocalizedRouteRecords([post])
    .find(({ lang }) => lang === 'it');
  const payload = JSON.parse(buildArticleBootstrapJson(italianRoute));

  assert.equal(payload.post.content_en, post.content_en);
  assert.equal(payload.post.content_it, post.content_it);
  assert.equal(payload.post.content_de, null);
  assert.equal(payload.post.content_pt, null);
  assert.equal(payload.post.content_es, null);
  assert.equal(payload.post.title_de, post.title_de);
  assert.equal(post.content_de, '<p>Deutsch</p>');
});

test('wholly absent translations are optional but partial ones are never emitted', () => {
  const englishOnly = makePost({
    slug_it: null,
    title_it: null,
    content_it: null,
    excerpt_it: null,
    meta_description_it: null,
  });

  assert.equal(buildLocalizedRouteRecords([englishOnly]).length, 1);
  assert.throws(
    () => buildLocalizedRouteRecords([englishOnly], { requireAllLanguages: true }),
    /missing the de localization/,
  );
});
