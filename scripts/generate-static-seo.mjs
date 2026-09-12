import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');
const PUBLIC_SITEMAP_CACHE = path.resolve('public/sitemap.xml');
const SITE_URL = 'https://revillion-partners.com';
const PUBLIC_SITEMAP_ENDPOINT = 'https://pvxndzwaposcttrwkwgd.supabase.co/functions/v1/sitemap';
const PUBLIC_SITEMAP_TIMEOUT_MS = 20_000;
const LANGUAGES = ['en', 'de', 'it', 'pt', 'es'];

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
  es: ['Revillion Partners - Programa de Afiliados iGaming', 'Únete a la red de afiliados iGaming Revillion. Accede a acuerdos CPA, RevShare e híbridos con soporte dedicado y seguimiento en tiempo real.'],
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
    de: ['iGaming Affiliate Blog & News | Revillion Partners', 'Affiliate-Marketing-Ratgeber, Casino-Strategien und iGaming-Branchennews von Revillion Partners.'],
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

const indexableRoutes = Object.keys(routeMeta).filter((route) => route !== 'earn');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeXml = escapeHtml;

function routeUrl(language, route) {
  return `${SITE_URL}/${language}${route ? `/${route}` : ''}`;
}

const INDEXABLE_STATIC_URLS = new Set(indexableRoutes.flatMap((route) =>
  LANGUAGES.map((language) => routeUrl(language, route))
));

function isAllowedSitemapUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.origin !== SITE_URL || parsed.search || parsed.hash) return false;
  if (INDEXABLE_STATIC_URLS.has(parsed.href)) return true;
  return /^\/(en|de|it|pt|es)\/blog\/[^/]+$/.test(parsed.pathname);
}

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Revillion Partners',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
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
        .map((schema) => `<script data-rh="true" type="application/ld+json">${JSON.stringify(schema)}</script>`)
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
  const startIndex = template.indexOf(start);
  const endIndex = template.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('SEO static markers are missing from the built index.html');
  }

  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${language}">`)
    .slice(0, startIndex + start.length)
    .concat(`\n    ${markup}\n    `, template.slice(endIndex));
}

async function writeRoutePage(template, language, route) {
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

  await Promise.all([
    mkdir(path.dirname(flatOutputPath), { recursive: true }),
    mkdir(path.dirname(directoryOutputPath), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(flatOutputPath, html),
    writeFile(directoryOutputPath, html),
  ]);
}

function buildSitemap() {
  const entries = [];
  for (const route of indexableRoutes) {
    for (const language of LANGUAGES) {
      const alternates = [
        ...LANGUAGES.map((alternateLanguage) =>
          `    <xhtml:link rel="alternate" hreflang="${alternateLanguage}" href="${escapeXml(routeUrl(alternateLanguage, route))}" />`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(routeUrl('en', route))}" />`,
      ].join('\n');
      entries.push(`  <url>\n    <loc>${escapeXml(routeUrl(language, route))}</loc>\n${alternates}\n  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

function decodeXmlEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function validatePublicSitemap(xml) {
  if (typeof xml !== 'string' || xml.length < 100 || xml.length > 5_000_000) {
    return { valid: false, reason: 'unexpected response size' };
  }
  if (/<!DOCTYPE|<!ENTITY|<script\b/i.test(xml)) {
    return { valid: false, reason: 'unsafe XML construct' };
  }
  if ((xml.match(/<urlset\b/g) || []).length !== 1 || (xml.match(/<\/urlset>/g) || []).length !== 1) {
    return { valid: false, reason: 'response is not one sitemap urlset' };
  }

  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXmlEntities(match[1].trim()));
  if (locations.length < LANGUAGES.length * indexableRoutes.length || locations.length > 50_000) {
    return { valid: false, reason: `unexpected URL count (${locations.length})` };
  }
  if (new Set(locations).size !== locations.length) {
    return { valid: false, reason: 'duplicate canonical URLs' };
  }

  for (const location of locations) {
    if (!isAllowedSitemapUrl(location)) {
      return { valid: false, reason: `URL outside the public localized site (${location})` };
    }
  }

  const alternateUrls = [...xml.matchAll(/<xhtml:link\b[^>]*\bhref="([^"]+)"[^>]*>/g)]
    .map((match) => decodeXmlEntities(match[1].trim()));
  for (const alternateUrl of alternateUrls) {
    if (!isAllowedSitemapUrl(alternateUrl)) {
      return { valid: false, reason: `alternate URL outside site (${alternateUrl})` };
    }
  }

  const locationSet = new Set(locations);
  const missingStaticUrl = [...INDEXABLE_STATIC_URLS].find((url) => !locationSet.has(url));
  if (missingStaticUrl) {
    return { valid: false, reason: `missing static URL (${missingStaticUrl})` };
  }

  return { valid: true, urlCount: locations.length };
}

async function getSitemap() {
  const generatedFallback = buildSitemap();
  let fallback = generatedFallback;
  let fallbackSource = '35-URL generated fallback';
  let fallbackUrlCount = LANGUAGES.length * indexableRoutes.length;

  try {
    const cachedSitemap = await readFile(PUBLIC_SITEMAP_CACHE, 'utf8');
    const cachedValidation = validatePublicSitemap(cachedSitemap);
    if (cachedValidation.valid) {
      fallback = cachedSitemap;
      fallbackSource = `${cachedValidation.urlCount}-URL checked-in cache`;
      fallbackUrlCount = cachedValidation.urlCount;
    }
  } catch {
    // The generated static sitemap remains a safe last resort.
  }

  if (process.env.REVILLION_SKIP_REMOTE_SITEMAP === '1') {
    const validation = validatePublicSitemap(fallback);
    return {
      xml: fallback,
      source: fallbackSource,
      urlCount: validation.valid ? validation.urlCount : LANGUAGES.length * indexableRoutes.length,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PUBLIC_SITEMAP_TIMEOUT_MS);
  try {
    const response = await fetch(PUBLIC_SITEMAP_ENDPOINT, {
      headers: { accept: 'application/xml,text/xml;q=0.9,text/plain;q=0.8' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const xml = await response.text();
    const validation = validatePublicSitemap(xml);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    if (
      validation.urlCount < fallbackUrlCount
      && process.env.REVILLION_ALLOW_SITEMAP_SHRINK !== '1'
    ) {
      throw new Error(
        `remote sitemap shrank from ${fallbackUrlCount} to ${validation.urlCount} URLs`,
      );
    }
    return { xml, source: 'validated public edge sitemap', urlCount: validation.urlCount };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const fallbackValidation = validatePublicSitemap(fallback);
    const fallbackCount = fallbackValidation.valid
      ? fallbackValidation.urlCount
      : LANGUAGES.length * indexableRoutes.length;
    console.warn(`Public sitemap unavailable or invalid (${reason}); using ${fallbackSource}.`);
    return { xml: fallback, source: fallbackSource, urlCount: fallbackCount };
  } finally {
    clearTimeout(timeout);
  }
}

const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');

for (const language of LANGUAGES) {
  for (const route of Object.keys(routeMeta)) {
    await writeRoutePage(template, language, route);
  }
}

const sitemap = await getSitemap();
const sitemapValidation = validatePublicSitemap(sitemap.xml);
if (!sitemapValidation.valid) {
  throw new Error(`Generated sitemap failed validation: ${sitemapValidation.reason}`);
}
await writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap.xml);

console.log(
  `Generated ${LANGUAGES.length * Object.keys(routeMeta).length} route-specific HTML pairs ` +
  '(flat file + directory index).',
);
console.log(`Sitemap: ${sitemap.urlCount} URLs from ${sitemap.source}.`);
