import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN = 'https://revillion-partners.com';
const LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;

interface BlogPost {
  slug_en: string | null;
  slug_de: string | null;
  slug_it: string | null;
  slug_pt: string | null;
  slug_es: string | null;
  updated_at: string;
  published_at: string | null;
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
  return LANGUAGES
    .filter(lang => slugs[lang])
    .map(lang => {
      const url = baseUrl.replace('{lang}', lang).replace('{slug}', slugs[lang]!);
      return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(url)}"/>`;
    })
    .join('\n');
}

function generateUrlEntry(
  loc: string,
  alternates: string,
  lastmod: string,
  changefreq: string,
  priority: string
): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
${alternates}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
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

    // Fetch all published posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug_en, slug_de, slug_it, slug_pt, slug_es, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    console.log(`Found ${posts?.length || 0} published posts`);

    const now = new Date().toISOString().split('T')[0];
    let urls: string[] = [];

    // 1. Homepage URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}`, slugs);
      urls.push(generateUrlEntry(loc, alternates, now, 'weekly', '1.0'));
    });

    // 2. Blog Listing URLs (one per language)
    LANGUAGES.forEach(lang => {
      const loc = `${DOMAIN}/${lang}/blog`;
      const slugs = Object.fromEntries(LANGUAGES.map(l => [l, l]));
      const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/blog`, slugs);
      urls.push(generateUrlEntry(loc, alternates, now, 'daily', '0.8'));
    });

    // 3. Blog Post URLs (dynamic from database)
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

        // Generate URL for each language that has a slug
        LANGUAGES.forEach(lang => {
          const slug = slugMap[lang];
          if (slug) {
            const loc = `${DOMAIN}/${lang}/blog/${slug}`;
            const alternates = generateAlternateLinks(`${DOMAIN}/{lang}/blog/{slug}`, slugMap);
            urls.push(generateUrlEntry(loc, alternates, lastmod, 'monthly', '0.7'));
          }
        });
      });
    }

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
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
