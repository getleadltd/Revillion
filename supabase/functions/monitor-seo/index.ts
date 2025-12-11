import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify admin authentication
async function verifyAdmin(req: Request): Promise<{ error?: Response; userId?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  // Check admin role via RPC
  const { data: isAdmin, error: roleError } = await supabase
    .rpc('has_role', { _user_id: user.id, _role: 'admin' });

  if (roleError || !isAdmin) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { userId: user.id };
}

// Module 1: Check Broken Links
async function checkBrokenLinks(supabase: any) {
  const startTime = Date.now();
  const errors: any[] = [];
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, content_en, content_de, content_it, content_pt, content_es, title_en')
    .eq('status', 'published');
  
  let totalLinksChecked = 0;
  
  for (const post of posts || []) {
    const languages = ['en', 'de', 'it', 'pt', 'es'];
    
    for (const lang of languages) {
      const content = post[`content_${lang}`];
      if (!content) continue;
      
      const linkRegex = /href=["']([^"']+)["']/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const url = match[1];
        
        // Only check external HTTP/HTTPS links
        if (url.startsWith('http')) {
          totalLinksChecked++;
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(url, { 
              method: 'HEAD',
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok && response.status !== 999) { // 999 = LinkedIn blocking bots
              errors.push({
                post_id: post.id,
                post_slug: post.slug,
                post_title: post.title_en,
                language: lang,
                url: url,
                status_code: response.status,
                error_type: 'broken_link',
                severity: response.status >= 500 ? 'critical' : 'high'
              });
            }
          } catch (error) {
            errors.push({
              post_id: post.id,
              post_slug: post.slug,
              post_title: post.title_en,
              language: lang,
              url: url,
              error: error.message,
              error_type: 'unreachable_link',
              severity: 'medium'
            });
          }
        }
      }
    }
  }
  
  await supabase.from('seo_monitoring_logs').insert({
    scan_type: 'broken_links',
    total_items_checked: totalLinksChecked,
    issues_found: errors.length,
    error_details: errors,
    execution_time_ms: Date.now() - startTime,
    status: 'completed'
  });
  
  console.log(`✅ Broken links check: ${totalLinksChecked} links checked, ${errors.length} errors found`);
  return { checked: totalLinksChecked, errors: errors.length };
}

// Module 2: Check Missing Alt Tags
async function checkMissingAltTags(supabase: any) {
  const startTime = Date.now();
  const errors: any[] = [];
  
  // Check featured images
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, featured_image_url, featured_image_alt, title_en')
    .eq('status', 'published')
    .not('featured_image_url', 'is', null);
  
  let totalImagesChecked = 0;
  
  for (const post of posts || []) {
    totalImagesChecked++;
    
    if (!post.featured_image_alt || post.featured_image_alt.trim() === '') {
      errors.push({
        post_id: post.id,
        post_slug: post.slug,
        post_title: post.title_en,
        image_url: post.featured_image_url,
        error_type: 'missing_featured_image_alt',
        severity: 'critical'
      });
    }
  }
  
  // Check images in content
  const { data: allPosts } = await supabase
    .from('blog_posts')
    .select('id, slug, content_en, content_de, content_it, content_pt, content_es, title_en')
    .eq('status', 'published');
  
  for (const post of allPosts || []) {
    const languages = ['en', 'de', 'it', 'pt', 'es'];
    
    for (const lang of languages) {
      const content = post[`content_${lang}`];
      if (!content) continue;
      
      const imgRegex = /<img[^>]*>/g;
      let match;
      
      while ((match = imgRegex.exec(content)) !== null) {
        const imgTag = match[0];
        totalImagesChecked++;
        
        if (!imgTag.includes('alt=') || imgTag.match(/alt=["']\s*["']/)) {
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
          const src = srcMatch ? srcMatch[1] : 'unknown';
          
          errors.push({
            post_id: post.id,
            post_slug: post.slug,
            post_title: post.title_en,
            language: lang,
            image_src: src,
            error_type: 'missing_content_image_alt',
            severity: 'high'
          });
        }
      }
    }
  }
  
  await supabase.from('seo_monitoring_logs').insert({
    scan_type: 'missing_alt_tags',
    total_items_checked: totalImagesChecked,
    issues_found: errors.length,
    error_details: errors,
    execution_time_ms: Date.now() - startTime,
    status: 'completed'
  });
  
  console.log(`✅ Alt tags check: ${totalImagesChecked} images checked, ${errors.length} errors found`);
  return { checked: totalImagesChecked, errors: errors.length };
}

// Module 3: Check Hreflang Errors
async function checkHreflangErrors(supabase: any) {
  const startTime = Date.now();
  const errors: any[] = [];
  const LANGUAGES = ['en', 'de', 'it', 'pt', 'es'];
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, slug_en, slug_de, slug_it, slug_pt, slug_es, title_en')
    .eq('status', 'published');
  
  let totalPostsChecked = 0;
  
  for (const post of posts || []) {
    totalPostsChecked++;
    const missingLanguages = [];
    const invalidSlugs = [];
    
    for (const lang of LANGUAGES) {
      const slugField = `slug_${lang}`;
      if (!post[slugField] || post[slugField].trim() === '') {
        missingLanguages.push(lang);
      } else {
        const slug = post[slugField];
        if (!/^[a-z0-9-]+$/.test(slug)) {
          invalidSlugs.push({
            language: lang,
            slug: slug,
            issue: 'contains_special_characters'
          });
        }
      }
    }
    
    if (missingLanguages.length > 0 || invalidSlugs.length > 0) {
      errors.push({
        post_id: post.id,
        post_slug: post.slug,
        post_title: post.title_en,
        missing_languages: missingLanguages,
        invalid_slugs: invalidSlugs,
        error_type: 'hreflang_incomplete',
        severity: missingLanguages.length >= 3 ? 'critical' : 'medium'
      });
    }
  }
  
  await supabase.from('seo_monitoring_logs').insert({
    scan_type: 'hreflang_errors',
    total_items_checked: totalPostsChecked,
    issues_found: errors.length,
    error_details: errors,
    execution_time_ms: Date.now() - startTime,
    status: 'completed'
  });
  
  console.log(`✅ Hreflang check: ${totalPostsChecked} posts checked, ${errors.length} errors found`);
  return { checked: totalPostsChecked, errors: errors.length };
}

// Main Handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdmin(req);
    if (authResult.error) {
      return authResult.error;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Starting SEO monitoring scan...');

    const [brokenLinks, missingAlt, hreflangErrors] = await Promise.all([
      checkBrokenLinks(supabase),
      checkMissingAltTags(supabase),
      checkHreflangErrors(supabase)
    ]);

    const summary = {
      scan_completed_at: new Date().toISOString(),
      broken_links: brokenLinks,
      missing_alt_tags: missingAlt,
      hreflang_errors: hreflangErrors,
      total_issues: brokenLinks.errors + missingAlt.errors + hreflangErrors.errors
    };

    console.log('✅ SEO monitoring completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SEO monitoring error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
