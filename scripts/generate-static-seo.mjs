import { Buffer } from 'node:buffer';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';
import {
  buildArticleBody,
  buildArticleBootstrapScript,
  buildArticleSeoMarkup,
  buildArticleSitemapEntry,
  buildLocalizedRouteRecords,
  compareRouteSets,
  escapeHtml,
  escapeXml,
  safeJsonLd,
  validatePostDataset,
} from './lib/blog-static.mjs';

const DIST_DIR = path.resolve('dist');
const PUBLIC_SITEMAP_CACHE = path.resolve('public/sitemap.xml');
const SITE_URL = 'https://revillion-partners.com';
const LANGUAGES = ['en', 'de', 'it', 'pt', 'es'];
const STATIC_PAGES_LASTMOD = '2026-09-12';
const BLOG_FETCH_ATTEMPTS = 3;
const BLOG_FETCH_TIMEOUT_MS = 15_000;
const BLOG_RESPONSE_MAX_BYTES = 50_000_000;
const EXPECTED_MIN_POSTS = 17;
const EXPECTED_MIN_ARTICLE_ROUTES = EXPECTED_MIN_POSTS * LANGUAGES.length;

const localeMap = {
  en: 'en_US',
  de: 'de_DE',
  it: 'it_IT',
  pt: 'pt_PT',
  es: 'es_ES',
};

const homeMeta = {
  en: ['Revillion Partners - iGaming Affiliate Program', "Join Revillion Partners' iGaming affiliate network. Access CPA, RevShare and hybrid deals with dedicated support and real-time tracking."],
  de: ['Revillion Partners - iGaming-Partnerprogramm', 'Treten Sie Revillions iGaming-Affiliate-Netzwerk bei. Nutzen Sie CPA-, RevShare- und Hybrid-Deals mit persönlichem Support und Echtzeit-Tracking.'],
  it: ['Revillion Partners - Programma Affiliazione iGaming', 'Entra nel network di affiliazione iGaming Revillion. Accedi ad accordi CPA, RevShare e ibridi con supporto dedicato e tracking in tempo reale.'],
  pt: ['Revillion Partners - Programa de Afiliados iGaming', 'Junte-se à rede de afiliados iGaming Revillion. Acesse acordos CPA, RevShare e híbridos com suporte dedicado e rastreamento em tempo real.'],
  es: ['Revillion Partners - Programa de Afiliación iGaming', 'Únete a la red de afiliados iGaming Revillion. Accede a acuerdos CPA, RevShare e híbridos con soporte dedicado y seguimiento en tiempo real.'],
};

const routeMeta = {
  '': homeMeta,
  contact: {
    en: ['Contact Revillion Partners', 'Contact Revillion Partners for affiliate support, partnership enquiries and help with your account.'],
    de: ['Revillion Partners kontaktieren', 'Kontaktieren Sie Revillion Partners für Affiliate-Support, Partnerschaftsanfragen und Hilfe mit Ihrem Konto.'],
    it: ['Contatta Revillion Partners', 'Contatta Revillion Partners per assistenza affiliati, richieste di partnership e supporto con il tuo account.'],
    pt: ['Contactar a Revillion Partners', 'Contacte a Revillion Partners para apoio a afiliados, parcerias e assistência com a sua conta.'],
    es: ['Contactar con Revillion Partners', 'Contacta con Revillion Partners para soporte a afiliados, consultas de colaboración y ayuda con tu cuenta.'],
  },
  'privacy-policy': {
    en: ['Privacy Policy | Revillion Partners', 'Learn how Revillion Partners collects, uses and protects personal information.'],
    de: ['Datenschutzrichtlinie | Revillion Partners', 'Erfahren Sie, wie Revillion Partners personenbezogene Daten erhebt, verwendet und schützt.'],
    it: ['Informativa sulla privacy | Revillion Partners', 'Scopri come Revillion Partners raccoglie, utilizza e protegge i dati personali.'],
    pt: ['Política de Privacidade | Revillion Partners', 'Saiba como a Revillion Partners recolhe, utiliza e protege os dados pessoais.'],
    es: ['Política de privacidad | Revillion Partners', 'Descubre cómo Revillion Partners recopila, utiliza y protege los datos personales.'],
  },
  'terms-of-service': {
    en: ['Terms of Service | Revillion Partners', 'Read the terms and conditions that govern use of Revillion Partners affiliate services.'],
    de: ['Nutzungsbedingungen | Revillion Partners', 'Lesen Sie die Bedingungen für die Nutzung der Affiliate-Dienste von Revillion Partners.'],
    it: ['Termini di servizio | Revillion Partners', 'Leggi i termini e le condizioni che regolano i servizi di affiliazione Revillion Partners.'],
    pt: ['Termos de Serviço | Revillion Partners', 'Leia os termos e condições que regem os serviços de afiliados da Revillion Partners.'],
    es: ['Términos de servicio | Revillion Partners', 'Lee los términos y condiciones que regulan los servicios de afiliación de Revillion Partners.'],
  },
  'responsible-gaming': {
    en: ['Responsible Gaming | Revillion Partners', 'Responsible gaming information, warning signs and independent support resources.'],
    de: ['Verantwortungsvolles Spielen | Revillion Partners', 'Informationen, Warnsignale und unabhängige Hilfsangebote für verantwortungsvolles Spielen.'],
    it: ['Gioco responsabile | Revillion Partners', 'Informazioni, segnali di rischio e risorse indipendenti per il gioco responsabile.'],
    pt: ['Jogo Responsável | Revillion Partners', 'Informação, sinais de alerta e recursos independentes para um jogo responsável.'],
    es: ['Juego responsable | Revillion Partners', 'Información, señales de alerta y recursos independientes para un juego responsable.'],
  },
  calculator: {
    en: ['iGaming Affiliate Earnings Calculator | Revillion Partners', 'Estimate potential CPA, RevShare and hybrid affiliate commissions based on your traffic and conversion rates.'],
    de: ['iGaming Affiliate Einnahmen-Rechner | Revillion Partners', 'Schätzen Sie mögliche CPA-, RevShare- und Hybrid-Provisionen anhand Ihres Traffics und Ihrer Conversion-Raten.'],
    it: ['Calcolatore Guadagni Affiliazione iGaming | Revillion Partners', 'Stima le potenziali commissioni CPA, RevShare e ibride in base al traffico e ai tassi di conversione.'],
    pt: ['Calculadora de Ganhos para Afiliados iGaming | Revillion Partners', 'Estime potenciais comissões CPA, RevShare e híbridas com base no tráfego e nas taxas de conversão.'],
    es: ['Calculadora de Ganancias para Afiliados iGaming | Revillion Partners', 'Estima posibles comisiones CPA, RevShare e híbridas según tu tráfico y tasas de conversión.'],
  },
  blog: {
    en: ['iGaming Affiliate Blog & News | Revillion Partners', 'Affiliate marketing guides, casino promotion strategies and iGaming industry news from Revillion Partners.'],
    de: ['iGaming-Affiliate-Blog & Branchennews | Revillion Partners', 'Affiliate-Marketing-Ratgeber, Casino-Strategien und iGaming-Branchennews von Revillion Partners.'],
    it: ['Blog Affiliazione iGaming e News | Revillion Partners', 'Guide di affiliate marketing, strategie di promozione casino e notizie iGaming da Revillion Partners.'],
    pt: ['Blog de Afiliados iGaming e Notícias | Revillion Partners', 'Guias de marketing de afiliados, estratégias de casino e notícias iGaming da Revillion Partners.'],
    es: ['Blog de Afiliados iGaming y Noticias | Revillion Partners', 'Guías de marketing de afiliación, estrategias de casino y noticias iGaming de Revillion Partners.'],
  },
  earn: {
    en: ['Affiliate Campaign | Revillion Partners', 'Revillion Partners affiliate campaign landing page.'],
    de: ['Affiliate-Kampagne | Revillion Partners', 'Landingpage der Affiliate-Kampagne von Revillion Partners.'],
    it: ['Campagna affiliati | Revillion Partners', 'Landing page della campagna affiliati Revillion Partners.'],
    pt: ['Campanha de afiliados | Revillion Partners', 'Página de campanha de afiliados da Revillion Partners.'],
    es: ['Campaña de afiliados | Revillion Partners', 'Página de campaña de afiliados de Revillion Partners.'],
  },
};

function validateLocalizedRouteMeta(metadata) {
  for (const [route, localizedMeta] of Object.entries(metadata)) {
    const seenTitles = new Map();
    const seenDescriptions = new Map();
    for (const language of LANGUAGES) {
      const values = localizedMeta[language];
      if (
        !Array.isArray(values)
        || values.length !== 2
        || values.some((value) => typeof value !== 'string' || value.trim().length === 0)
      ) {
        throw new Error(`Static SEO metadata is incomplete for route "${route}" and language "${language}"`);
      }
      const [title, description] = values;
      for (const [kind, value, seen] of [
        ['title', title, seenTitles],
        ['description', description, seenDescriptions],
      ]) {
        const normalized = value.trim().toLowerCase();
        const previousLanguage = seen.get(normalized);
        if (previousLanguage) {
          throw new Error(
            `Duplicate static SEO ${kind} for route "${route}": ${previousLanguage} and ${language}`,
          );
        }
        seen.set(normalized, language);
      }
    }
  }
}

validateLocalizedRouteMeta(routeMeta);

const indexableRoutes = Object.keys(routeMeta).filter((route) => route !== 'earn');

const staticSitemapSettings = {
  '': { changefreq: 'weekly', priority: '1.0' },
  contact: { changefreq: 'monthly', priority: '0.6' },
  'privacy-policy': { changefreq: 'monthly', priority: '0.4' },
  'terms-of-service': { changefreq: 'monthly', priority: '0.4' },
  'responsible-gaming': { changefreq: 'monthly', priority: '0.5' },
  calculator: { changefreq: 'monthly', priority: '0.7' },
  blog: { changefreq: 'daily', priority: '0.8' },
};

function routeUrl(language, route) {
  return `${SITE_URL}/${language}${route ? `/${route}` : ''}`;
}

const INDEXABLE_STATIC_URLS = new Set(indexableRoutes.flatMap((route) =>
  LANGUAGES.map((language) => routeUrl(language, route))
));

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Revillion Partners',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon-revillion-2026.png`,
    email: 'info@revillion.com',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@revillion.com',
      contactType: 'customer support',
      availableLanguage: ['English', 'German', 'Italian', 'Spanish', 'Portuguese'],
    },
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'Revillion Partners',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: LANGUAGES,
  };
}

function buildSeoMarkup(language, route, { noindex = false, includeSchemas = false } = {}) {
  const [title, description] = routeMeta[route][language];
  const canonical = routeUrl(language, route);
  const alternates = noindex
    ? ''
    : [
        ...LANGUAGES.map((alternateLanguage) =>
          `<link data-rh="true" rel="alternate" hreflang="${alternateLanguage}" href="${routeUrl(alternateLanguage, route)}" />`
        ),
        `<link data-rh="true" rel="alternate" hreflang="x-default" href="${routeUrl('en', route)}" />`,
      ].join('\n    ');
  const schemas = includeSchemas
    ? [organizationSchema(), websiteSchema()]
        .map((schema) => `<script data-rh="true" type="application/ld+json">${safeJsonLd(schema)}</script>`)
        .join('\n    ')
    : '';

  return [
    `<title data-rh="true">${escapeHtml(title)}</title>`,
    `<meta data-rh="true" name="description" content="${escapeHtml(description)}" />`,
    `<meta data-rh="true" name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}" />`,
    noindex ? '' : `<link data-rh="true" rel="canonical" href="${canonical}" />`,
    alternates,
    `<meta data-rh="true" property="og:type" content="website" />`,
    `<meta data-rh="true" property="og:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" property="og:description" content="${escapeHtml(description)}" />`,
    `<meta data-rh="true" property="og:url" content="${canonical}" />`,
    `<meta data-rh="true" property="og:locale" content="${localeMap[language]}" />`,
    `<meta data-rh="true" property="og:image" content="${SITE_URL}/og-image.png" />`,
    `<meta data-rh="true" property="og:site_name" content="Revillion Partners" />`,
    `<meta data-rh="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-rh="true" name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta data-rh="true" name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta data-rh="true" name="twitter:image" content="${SITE_URL}/og-image.png" />`,
    schemas,
  ].filter(Boolean).join('\n    ');
}

function injectSeo(template, language, markup) {
  const start = '<!-- SEO_STATIC_START -->';
  const end = '<!-- SEO_STATIC_END -->';
  const localizedTemplate = template.replace(
    /<html\s+lang="[^"]*"/,
    `<html lang="${escapeHtml(language)}"`,
  );
  const startIndex = localizedTemplate.indexOf(start);
  const endIndex = localizedTemplate.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('SEO static markers are missing from the built index.html');
  }

  return localizedTemplate
    .slice(0, startIndex + start.length)
    .concat(`\n    ${markup}\n    `, localizedTemplate.slice(endIndex));
}

function injectArticleBody(template, body) {
  const emptyRoot = '<div id="root"></div>';
  const rootIndex = template.indexOf(emptyRoot);
  if (rootIndex === -1 || template.indexOf(emptyRoot, rootIndex + emptyRoot.length) !== -1) {
    throw new Error('Expected exactly one empty #root element in the built index.html');
  }
  return template.replace(emptyRoot, `<div id="root">\n${body}\n</div>`);
}

function injectArticleBootstrap(template, bootstrapScript) {
  const bodyEnd = '</body>';
  const bodyEndIndex = template.indexOf(bodyEnd);
  if (
    bodyEndIndex === -1
    || template.indexOf(bodyEnd, bodyEndIndex + bodyEnd.length) !== -1
    || template.includes('id="revillion-blog-bootstrap"')
  ) {
    throw new Error('Expected one </body> and no existing article bootstrap');
  }
  return template.replace(bodyEnd, `  ${bootstrapScript}\n  ${bodyEnd}`);
}

async function writeHtmlPair(flatOutputPath, directoryOutputPath, html) {
  await Promise.all([
    mkdir(path.dirname(flatOutputPath), { recursive: true }),
    mkdir(path.dirname(directoryOutputPath), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(flatOutputPath, html),
    writeFile(directoryOutputPath, html),
  ]);
}

async function writeStaticRoutePage(template, language, route) {
  const noindex = route === 'earn';
  const html = injectSeo(template, language, buildSeoMarkup(language, route, {
    noindex,
    includeSchemas: route === '',
  }));
  // Keep the flat files used by Cloudflare Pages and Netlify, and also emit
  // directory indexes for hosts (including Lovable) that do not resolve
  // extensionless URLs to `<path>.html` before applying their SPA fallback.
  const flatOutputPath = route
    ? path.join(DIST_DIR, language, `${route}.html`)
    : path.join(DIST_DIR, `${language}.html`);
  const directoryOutputPath = route
    ? path.join(DIST_DIR, language, route, 'index.html')
    : path.join(DIST_DIR, language, 'index.html');

  await writeHtmlPair(flatOutputPath, directoryOutputPath, html);
}

function decodeXmlEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function sitemapLocations(xml) {
  if (typeof xml !== 'string' || xml.length < 100 || xml.length > 5_000_000) {
    throw new Error('Sitemap has an unexpected response size');
  }
  if (/<!DOCTYPE|<!ENTITY|<script\b/i.test(xml)) {
    throw new Error('Sitemap contains an unsafe XML construct');
  }
  if ((xml.match(/<urlset\b/g) || []).length !== 1 || (xml.match(/<\/urlset>/g) || []).length !== 1) {
    throw new Error('Sitemap is not exactly one urlset');
  }
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXmlEntities(match[1].trim()));
}

async function cachedArticleRouteUrls() {
  const cachedSitemap = await readFile(PUBLIC_SITEMAP_CACHE, 'utf8');
  const articleLocations = sitemapLocations(cachedSitemap).filter((location) => {
    let parsed;
    try {
      parsed = new URL(location);
    } catch {
      return false;
    }
    return parsed.origin === SITE_URL
      && !parsed.search
      && !parsed.hash
      && /^\/(en|de|it|pt|es)\/blog\/[^/]+$/.test(parsed.pathname);
  });
  const uniqueLocations = new Set(articleLocations);
  if (uniqueLocations.size !== articleLocations.length) {
    throw new Error('Checked-in sitemap contains duplicate article URLs');
  }
  if (uniqueLocations.size < EXPECTED_MIN_ARTICLE_ROUTES) {
    throw new Error(
      `Checked-in sitemap has only ${uniqueLocations.size} article routes; expected at least ${EXPECTED_MIN_ARTICLE_ROUTES}`,
    );
  }
  return uniqueLocations;
}

function allowBlogRouteShrink() {
  return process.env.REVILLION_ALLOW_BLOG_ROUTE_SHRINK === '1'
    || process.env.REVILLION_ALLOW_SITEMAP_SHRINK === '1';
}

class BlogFetchError extends Error {
  constructor(message, { retryable = false } = {}) {
    super(message);
    this.name = 'BlogFetchError';
    this.retryable = retryable;
  }
}

function supabaseConfiguration() {
  const fileEnv = loadEnv('production', process.cwd(), 'VITE_');
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL || '').trim();
  const publishableKey = (
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY
    || ''
  ).trim();

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      'Static blog generation requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY',
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }
  if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) {
    throw new Error('VITE_SUPABASE_URL must be a credential-free HTTPS URL');
  }
  if (publishableKey.length < 20 || /\s/.test(publishableKey)) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY has an invalid format');
  }

  return { supabaseUrl: parsedUrl.origin, publishableKey };
}

function blogRestEndpoint(supabaseUrl) {
  const endpoint = new URL('/rest/v1/blog_posts', supabaseUrl);
  endpoint.searchParams.set('select', '*');
  endpoint.searchParams.set('status', 'eq.published');
  endpoint.searchParams.set('order', 'published_at.asc.nullslast,id.asc');
  return endpoint;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchPublishedPostsOnce(configuration) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BLOG_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(blogRestEndpoint(configuration.supabaseUrl), {
      headers: {
        accept: 'application/json',
        apikey: configuration.publishableKey,
        authorization: `Bearer ${configuration.publishableKey}`,
        prefer: 'count=exact',
        range: '0-49999',
        'range-unit': 'items',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const retryable = response.status === 408
        || response.status === 425
        || response.status === 429
        || response.status >= 500;
      throw new BlogFetchError(`Supabase REST returned HTTP ${response.status}`, { retryable });
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > BLOG_RESPONSE_MAX_BYTES) {
      throw new BlogFetchError('Supabase blog response exceeds the safe size limit');
    }
    const body = await response.text();
    if (Buffer.byteLength(body, 'utf8') > BLOG_RESPONSE_MAX_BYTES) {
      throw new BlogFetchError('Supabase blog response exceeds the safe size limit');
    }

    let posts;
    try {
      posts = JSON.parse(body);
    } catch {
      throw new BlogFetchError('Supabase blog response is not valid JSON');
    }
    if (!Array.isArray(posts)) {
      throw new BlogFetchError('Supabase blog response is not an array');
    }

    const contentRange = response.headers.get('content-range');
    const totalMatch = contentRange?.match(/\/(\d+)$/);
    if (totalMatch && Number(totalMatch[1]) !== posts.length) {
      throw new BlogFetchError(
        `Supabase returned a truncated blog dataset (${posts.length} of ${totalMatch[1]} rows)`,
      );
    }
    return posts;
  } catch (error) {
    if (error instanceof BlogFetchError) throw error;
    if (error instanceof Error && (error.name === 'AbortError' || controller.signal.aborted)) {
      throw new BlogFetchError(
        `Supabase blog request timed out after ${BLOG_FETCH_TIMEOUT_MS}ms`,
        { retryable: true },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new BlogFetchError(`Supabase blog request failed: ${message}`, { retryable: true });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPublishedPosts() {
  const configuration = supabaseConfiguration();
  let lastError;

  for (let attempt = 1; attempt <= BLOG_FETCH_ATTEMPTS; attempt += 1) {
    try {
      return await fetchPublishedPostsOnce(configuration);
    } catch (error) {
      lastError = error;
      if (!(error instanceof BlogFetchError) || !error.retryable || attempt === BLOG_FETCH_ATTEMPTS) {
        break;
      }
      const waitMs = 500 * (2 ** (attempt - 1));
      console.warn(
        `Published blog fetch attempt ${attempt}/${BLOG_FETCH_ATTEMPTS} failed (${error.message}); `
        `retrying in ${waitMs}ms.`,
      );
      await sleep(waitMs);
    }
  }

  throw new Error(
    `Static blog generation stopped: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

function validateAndBuildArticleRoutes(posts, cachedRoutes) {
  validatePostDataset(posts, {
    languages: LANGUAGES,
    requireAllLanguages: true,
    requiredStatus: 'published',
  });
  const articleRoutes = buildLocalizedRouteRecords(posts, {
    languages: LANGUAGES,
    siteUrl: SITE_URL,
    requireAllLanguages: true,
  });
  const expectedRouteCount = posts.length * LANGUAGES.length;
  if (articleRoutes.length !== expectedRouteCount) {
    throw new Error(
      `Blog route generation mismatch: ${posts.length} posts should produce ${expectedRouteCount} routes, `
      + `but produced ${articleRoutes.length}`,
    );
  }

  const currentRoutes = articleRoutes.map((route) => route.canonicalUrl);
  const { missing: missingBaselineRoutes } = compareRouteSets(currentRoutes, cachedRoutes);
  const minimumRouteCount = Math.max(EXPECTED_MIN_ARTICLE_ROUTES, cachedRoutes.size);
  const datasetShrank = posts.length < EXPECTED_MIN_POSTS
    || articleRoutes.length < minimumRouteCount
    || missingBaselineRoutes.length > 0;
  if (datasetShrank && !allowBlogRouteShrink()) {
    throw new Error(
      `Published blog dataset shrank to ${posts.length} posts/${articleRoutes.length} routes; `
      + `the checked-in baseline requires at least ${EXPECTED_MIN_POSTS} posts/${minimumRouteCount} routes`
      + `${missingBaselineRoutes.length > 0
        ? ` and is missing ${missingBaselineRoutes.length} prior route(s), including ${missingBaselineRoutes[0]}`
        : ''}. `
      + 'Set REVILLION_ALLOW_BLOG_ROUTE_SHRINK=1 only for an intentional, reviewed removal.',
    );
  }
  if (datasetShrank) {
    console.warn(
      `Intentional blog route shrink override accepted (${posts.length} posts/${articleRoutes.length} routes).`,
    );
  }
  return articleRoutes;
}

function buildStaticSitemapEntry(language, route) {
  const { changefreq, priority } = staticSitemapSettings[route];
  const alternates = [
    ...LANGUAGES.map((alternateLanguage) =>
      `    <xhtml:link rel="alternate" hreflang="${alternateLanguage}" href="${escapeXml(routeUrl(alternateLanguage, route))}" />`),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(routeUrl('en', route))}" />`,
  ].join('\n');
  return [
    '  <url>',
    `    <loc>${escapeXml(routeUrl(language, route))}</loc>`,
    alternates,
    `    <lastmod>${STATIC_PAGES_LASTMOD}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

function buildUnifiedSitemap(articleRoutes) {
  const entries = [];
  for (const route of indexableRoutes) {
    for (const language of LANGUAGES) {
      entries.push(buildStaticSitemapEntry(language, route));
    }
  }
  entries.push(...articleRoutes.map((route) => buildArticleSitemapEntry(route)));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    entries.join('\n'),
    '</urlset>',
    '',
  ].join('\n');
}

function validateGeneratedSitemap(xml, articleRoutes) {
  const expectedUrls = new Set([
    ...INDEXABLE_STATIC_URLS,
    ...articleRoutes.map((route) => route.canonicalUrl),
  ]);
  const locations = sitemapLocations(xml);
  if (locations.length !== expectedUrls.size || new Set(locations).size !== locations.length) {
    throw new Error(
      `Generated sitemap URL count mismatch: found ${locations.length}, expected ${expectedUrls.size} unique URLs`,
    );
  }
  for (const location of locations) {
    if (!expectedUrls.has(location)) {
      throw new Error(`Generated sitemap contains an unexpected URL: ${location}`);
    }
  }
  const missingUrl = [...expectedUrls].find((url) => !locations.includes(url));
  if (missingUrl) {
    throw new Error(`Generated sitemap is missing URL: ${missingUrl}`);
  }

  const alternateUrls = [...xml.matchAll(/<xhtml:link\b[^>]*\bhref="([^"]+)"[^>]*>/g)]
    .map((match) => decodeXmlEntities(match[1].trim()));
  const unexpectedAlternate = alternateUrls.find((url) => !expectedUrls.has(url));
  if (unexpectedAlternate) {
    throw new Error(`Generated sitemap contains an unexpected alternate URL: ${unexpectedAlternate}`);
  }
  const expectedAlternateCount = expectedUrls.size * (LANGUAGES.length + 1);
  if (alternateUrls.length !== expectedAlternateCount) {
    throw new Error(
      `Generated sitemap alternate count mismatch: found ${alternateUrls.length}, `
      + `expected ${expectedAlternateCount}`,
    );
  }
  if ((xml.match(/<lastmod>/g) || []).length !== expectedUrls.size) {
    throw new Error('Generated sitemap does not have exactly one lastmod per URL');
  }
  const expectedImageCount = articleRoutes.filter((route) => route.imageUrl).length;
  if ((xml.match(/<image:image>/g) || []).length !== expectedImageCount) {
    throw new Error('Generated sitemap image count does not match the article dataset');
  }
  return { urlCount: expectedUrls.size };
}

function buildAndValidateArticlePage(template, route) {
  const html = injectArticleBootstrap(
    injectArticleBody(
      injectSeo(template, route.lang, buildArticleSeoMarkup(route, { siteUrl: SITE_URL })),
      buildArticleBody(route, { siteUrl: SITE_URL }),
    ),
    buildArticleBootstrapScript(route),
  );
  const head = html.slice(0, html.indexOf('</head>'));
  const canonicalCount = (head.match(/rel="canonical"/g) || []).length;
  const h1Count = (html.match(/<h1\b/g) || []).length;
  const bootstrapCount = (html.match(/id="revillion-blog-bootstrap"/g) || []).length;
  const bootstrapIndex = html.indexOf('id="revillion-blog-bootstrap"');
  const bootstrapIsInBody = bootstrapIndex > html.indexOf('</head>')
    && bootstrapIndex < html.indexOf('</body>');
  const ogImageCount = (head.match(/property="og:image"/g) || []).length;
  const expectedOgImageCount = route.imageUrl ? 1 : 0;
  if (
    canonicalCount !== 1
    || h1Count !== 1
    || bootstrapCount !== 1
    || !bootstrapIsInBody
    || ogImageCount !== expectedOgImageCount
    || !html.includes(`data-revillion-static-article="${escapeHtml(route.key)}"`)
  ) {
    throw new Error(
      `Generated article HTML failed validation for ${route.canonicalUrl} `
      + `(canonical=${canonicalCount}, h1=${h1Count}, bootstrap=${bootstrapCount}, `
      + `bootstrapInBody=${bootstrapIsInBody}, og:image=${ogImageCount})`,
    );
  }
  return html;
}

const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
const cachedRoutes = await cachedArticleRouteUrls();
const posts = await fetchPublishedPosts();
const articleRoutes = validateAndBuildArticleRoutes(posts, cachedRoutes);

// Render and validate every database-derived page before starting any writes.
// A malformed row therefore fails the build instead of publishing a partial set.
const articlePages = articleRoutes.map((route) => ({
  route,
  html: buildAndValidateArticlePage(template, route),
}));
const sitemapXml = buildUnifiedSitemap(articleRoutes);
const sitemapValidation = validateGeneratedSitemap(sitemapXml, articleRoutes);

for (const language of LANGUAGES) {
  for (const route of Object.keys(routeMeta)) {
    await writeStaticRoutePage(template, language, route);
  }
}
for (const { route, html } of articlePages) {
  const flatOutputPath = path.join(DIST_DIR, route.lang, 'blog', `${route.slug}.html`);
  const directoryOutputPath = path.join(DIST_DIR, route.outputPath);
  await writeHtmlPair(flatOutputPath, directoryOutputPath, html);
}
await writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

console.log(
  `Generated ${LANGUAGES.length * Object.keys(routeMeta).length} static route HTML pairs and `
  + `${articleRoutes.length} article HTML pairs (flat file + directory index).`,
);
console.log(
  `Sitemap: ${sitemapValidation.urlCount} URLs `
  + `(${INDEXABLE_STATIC_URLS.size} static + ${articleRoutes.length} live Supabase articles).`,
);
