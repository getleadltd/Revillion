import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate URL-friendly slug from title
function generateSlug(title: string): string {
  const charMap: Record<string, string> = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
    'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c',
  };

  let slug = title.toLowerCase();
  for (const [char, replacement] of Object.entries(charMap)) {
    slug = slug.replace(new RegExp(char, 'g'), replacement);
  }

  return slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Clean HTML content: remove JSON-LD scripts and extract image URL
function cleanHtmlContent(html: string): { cleanedHtml: string; extractedImageUrl: string | null } {
  let extractedImageUrl: string | null = null;
  
  // Extract JSON-LD script content to get image URL
  const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  
  if (jsonLdMatch && jsonLdMatch[1]) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1].trim());
      // Try to extract image URL from JSON-LD
      if (jsonLd.image?.url) {
        extractedImageUrl = jsonLd.image.url;
      } else if (typeof jsonLd.image === 'string') {
        extractedImageUrl = jsonLd.image;
      } else if (jsonLd.thumbnailUrl) {
        extractedImageUrl = jsonLd.thumbnailUrl;
      }
      console.log(`Extracted image URL from JSON-LD: ${extractedImageUrl}`);
    } catch (e) {
      console.error('Error parsing JSON-LD:', e);
    }
  }
  
  // Remove all JSON-LD scripts from content
  const cleanedHtml = html
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();
  
  return { cleanedHtml, extractedImageUrl };
}

// Download and upload hero image to Supabase storage
async function handleHeroImage(
  supabase: any,
  imageUrl: string,
  postSlug: string
): Promise<string | null> {
  if (!imageUrl) return null;
  
  try {
    console.log(`Downloading hero image from: ${imageUrl}`);
    
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return null;
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `babylovegrowth/${postSlug}-${Date.now()}.${extension}`;
    
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, uint8Array, {
        contentType,
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    console.log(`Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error handling hero image:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify Bearer token
  const authHeader = req.headers.get('authorization');
  const expectedSecret = Deno.env.get('BABYLOVEGROWTH_WEBHOOK_SECRET');
  
  if (!expectedSecret) {
    console.error('BABYLOVEGROWTH_WEBHOOK_SECRET not configured');
    return new Response(
      JSON.stringify({ error: 'Webhook not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    console.error('Invalid or missing authorization header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const payload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload).substring(0, 500));

    // Validate required fields
    const { id, title, content_html, content_markdown, metaDescription, languageCode, createdAt } = payload;
    
    if (!title || (!content_html && !content_markdown)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title and content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use HTML content if available, otherwise markdown
    const rawContent = content_html || content_markdown;
    const sourceLang = languageCode || 'en';
    const validLangs = ['en', 'de', 'it', 'pt', 'es'];
    const normalizedSourceLang = validLangs.includes(sourceLang) ? sourceLang : 'en';

    // Clean HTML content and extract image URL from JSON-LD
    const { cleanedHtml, extractedImageUrl } = cleanHtmlContent(rawContent);
    console.log(`Content cleaned. Extracted image: ${extractedImageUrl ? 'yes' : 'no'}`);

    // Generate slug from title
    const baseSlug = generateSlug(title);
    console.log(`Generated base slug: ${baseSlug} from language: ${normalizedSourceLang}`);

    // Determine hero image URL - prefer extracted from JSON-LD, then try API
    let heroImageUrl: string | null = extractedImageUrl;
    
    // If no image from JSON-LD, try fetching from BabyLoveGrowth API
    if (!heroImageUrl) {
      const babyloveGrowthApiKey = Deno.env.get('BABYLOVEGROWTH_API_KEY');
      if (babyloveGrowthApiKey && id) {
        try {
          console.log(`Fetching article details for ID: ${id}`);
          const articleResponse = await fetch(`https://api.babylovegrowth.ai/api/integrations/v1/articles/${id}`, {
            headers: {
              'X-API-Key': babyloveGrowthApiKey,
              'Content-Type': 'application/json'
            }
          });
          
          if (articleResponse.ok) {
            const articleData = await articleResponse.json();
            heroImageUrl = articleData.hero_image_url;
            console.log(`Found hero image URL from API: ${heroImageUrl}`);
          }
        } catch (e) {
          console.error('Error fetching article details:', e);
        }
      }
    }

    // Handle hero image upload
    let uploadedImageUrl: string | null = null;
    if (heroImageUrl) {
      uploadedImageUrl = await handleHeroImage(supabase, heroImageUrl, baseSlug);
    }

    // Get an admin user for author_id
    let authorId: string | null = null;
    const { data: adminUser } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();
    
    if (adminUser?.user_id) {
      authorId = adminUser.user_id;
    } else {
      // Fallback: get any user from auth.users
      const { data: anyUser } = await supabase.auth.admin.listUsers({ perPage: 1 });
      if (anyUser?.users?.length > 0) {
        authorId = anyUser.users[0].id;
      }
    }
    
    if (!authorId) {
      throw new Error('No valid author_id found. Please ensure at least one user exists.');
    }
    
    console.log(`Using author_id: ${authorId}`);

    // Build the blog post data - ONLY save source language, translations will be done on publish
    const blogPostData: Record<string, any> = {
      status: 'draft',
      source: 'babylovegrowth',
      category: 'news',
      author_id: authorId,
      slug: baseSlug,
      featured_image_url: uploadedImageUrl,
      created_at: createdAt || new Date().toISOString(),
      // Set English as required field (use source content if source is en, otherwise still set it)
      title_en: title,
      content_en: cleanedHtml,
      meta_description_en: metaDescription || '',
      slug_en: baseSlug,
    };

    // If source language is different from English, also save in source language fields
    if (normalizedSourceLang !== 'en') {
      blogPostData[`title_${normalizedSourceLang}`] = title;
      blogPostData[`content_${normalizedSourceLang}`] = cleanedHtml;
      blogPostData[`meta_description_${normalizedSourceLang}`] = metaDescription || '';
      blogPostData[`slug_${normalizedSourceLang}`] = baseSlug;
    }

    console.log('Inserting blog post with data:', Object.keys(blogPostData));

    // Insert the blog post
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert([blogPostData])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting blog post:', insertError);
      throw insertError;
    }

    console.log(`Blog post created successfully with ID: ${insertedPost.id}`);

    return new Response(
      JSON.stringify({ 
        status: 'received',
        post_id: insertedPost.id,
        message: 'Article saved as draft. Translations will be generated when published.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});