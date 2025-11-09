import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sitemap generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published blog posts with localized slugs
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, slug_en, slug_de, slug_it, slug_pt, slug_es, updated_at, published_at, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    console.log(`Found ${posts?.length || 0} published posts`);

    const baseUrl = 'https://revillion-partners.com';
    const languages = ['en', 'de', 'it', 'pt', 'es'];
    const today = new Date().toISOString().split('T')[0];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${baseUrl}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Add homepage for each language (5 URLs)
    languages.forEach(lang => {
      sitemap += `  <url>
    <loc>${baseUrl}/${lang}</loc>`;
      
      languages.forEach(l => {
        sitemap += `
    <xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}" />`;
      });
      
      sitemap += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/en" />
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;
    });

    // Add blog list page for each language (5 URLs)
    languages.forEach(lang => {
      sitemap += `  <url>
    <loc>${baseUrl}/${lang}/blog</loc>`;
      
      languages.forEach(l => {
        sitemap += `
    <xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}/blog" />`;
      });
      
      sitemap += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/en/blog" />
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });

    // Add blog posts for each language (~50 URLs)
    if (posts && posts.length > 0) {
      posts.forEach(post => {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString().split('T')[0]
          : new Date(post.published_at).toISOString().split('T')[0];
        
        // Determine changefreq and priority based on category and age
        const publishedDate = new Date(post.published_at);
        const daysSincePublished = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let changefreq = 'monthly';
        let priority = '0.7';
        
        if (daysSincePublished < 7) {
          changefreq = 'daily';
          priority = '0.9';
        } else if (daysSincePublished < 30) {
          changefreq = 'weekly';
          priority = '0.8';
        }

        // Higher priority for guides
        if (post.category === 'guides') {
          priority = (parseFloat(priority) + 0.1).toString();
        }

        // Create URL for each language with localized slug
        languages.forEach(lang => {
          const localizedSlug = post[`slug_${lang}`] || post.slug_en || post.slug;
          
          if (localizedSlug) {
            sitemap += `  <url>
    <loc>${baseUrl}/${lang}/blog/${localizedSlug}</loc>`;
            
            // Add hreflang for all available languages
            languages.forEach(l => {
              const altSlug = post[`slug_${l}`] || post.slug_en || post.slug;
              if (altSlug) {
                sitemap += `
    <xhtml:link rel="alternate" hreflang="${l}" href="${baseUrl}/${l}/blog/${altSlug}" />`;
              }
            });
            
            sitemap += `
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/en/blog/${post.slug_en || post.slug}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
          }
        });
      });
    }

    sitemap += `</urlset>`;

    const totalUrls = 10 + (posts?.length || 0) * 5; // 5 home + 5 blog list + N posts × 5 languages
    console.log(`Sitemap generated successfully with ${totalUrls} URLs`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
      },
    });

  } catch (error) {
    console.error('Error in sitemap generation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
