import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN = 'https://revillion-partners.com';
const LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;

// Static pages last updated date (update this when content changes)
const STATIC_PAGES_LASTMOD = '2025-06-28';

interface BlogPost {
  slug_en: string | null;
  slug_de: string | null;
  slug_it: string | null;
  slug_pt: string | null;
  slug_es: string | null;
  updated_at: string;
  published_at: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  title_en: string | null;
  title_de: string | null;
  title_it: string | null;
  title_pt: string | null;
  title_es: string | null;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateAlternateLinks(baseUrl: string, slugs: Record<string, string | null>): string {
  const links = LANGUAGES
    .filter(lang => slugs[lang])
    .map(lang => {
      const url = baseUrl.replace('{lang}', lang).replace('{slug}', slugs[lang]!);
      return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(url)}"/>`;
    });
  
  // Add x-default pointing to English version
  const defaultSlug = slugs['en'] || LANGUAGES.find(l => slugs[l]) ? slugs[LANGUAGES.find(l => slugs[l])!] : '';
  if (defaultSlug) {
    const defaultUrl = baseUrl.replace('{lang}', 'en').replace('{slug}', defaultSlug);
    links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(defaultUrl)}"/>`);
  }
  
  return links.join('\n');
}

function generateImageTag(imageUrl: string | null, imageAlt: string | null, title: string | null): string {
  if (!imageUrl) return '';
  
  return `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(imageAlt || title || '')}</image:title>
    </image:image>`;
}

function generateUrlEntry(
  loc: string,
  alternates: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  imageXml: string = ''
): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${alternates}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageXml}
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching published blog posts for sitemap...');

    // Fetch all published posts with image data
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug_en, slug_de, slug_it, slug_pt, slug_es, updated_at, published_at, featured_image_url, featured_image_alt, title_en, title_de, title_it, title_pt, title_es')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    console.log(`Found ${posts?.length || 0} published posts`);

    let urls: string[] = [];

    // 1. Homepage URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}`, slugs);
      urls.push(generateUrlEntry(loc, alternates, STATIC_PAGES_LASTMOD, 'weekly', '1.0'));
    });

    // 2. Contact Page URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}/contact`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/contact`, slugs);
      urls.push(generateUrlEntry(loc, alternates, STATIC_PAGES_LASTMOD, 'monthly', '0.6'));
    });

    // 3. Privacy Policy URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}/privacy-policy`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/privacy-policy`, slugs);
      urls.push(generateUrlEntry(loc, alternates, STATIC_PAGES_LASTMOD, 'monthly', '0.4'));
    });

    // 4. Terms of Service URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}/terms-of-service`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/terms-of-service`, slugs);
      urls.push(generateUrlEntry(loc, alternates, STATIC_PAGES_LASTMOD, 'monthly', '0.4'));
    });

    // 5. Responsible Gaming URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}/responsible-gaming`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/responsible-gaming`, slugs);
      urls.push(generateUrlEntry(loc, alternates, STATIC_PAGES_LASTMOD, 'monthly', '0.5'));
    });

    // 6. Blog Listing URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}/blog`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/blog`, slugs);
      urls.push(generateUrlEntry(loc, alternates, STATIC_PAGES_LASTMOD, 'daily', '0.8'));
    });

    // 7. Blog Post URLs (dynamic from database)
    if (posts && posts.length > 0) {
      posts.forEach((post: BlogPost) => {
        const lastmod = post.updated_at.split('T')[0];
        
        // Create a slug map for alternates
        const slugMap: Record<string, string | null> = {
          en: post.slug_en,
          de: post.slug_de,
          it: post.slug_it,
          pt: post.slug_pt,
          es: post.slug_es,
        };

        // Create title map for image alt
        const titleMap: Record<string, string | null> = {
          en: post.title_en,
          de: post.title_de,
          it: post.title_it,
          pt: post.title_pt,
          es: post.title_es,
        };

        // Generate URL for each language that has a slug
        LANGUAGES.forEach(lang => {
          const slug = slugMap[lang];
          if (slug) {
            const loc = `${DOMAIN}/${lang}/blog/${slug}`;
            const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/blog/{slug}`, slugMap);
            const imageXml = generateImageTag(post.featured_image_url, post.featured_image_alt, titleMap[lang]);
            urls.push(generateUrlEntry(loc, alternates, lastmod, 'monthly', '0.7', imageXml));
          }
        });
      });
    }

    // Generate XML with image namespace
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
