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

// Translate content to other languages using translate-blog-post edge function
async function translateContent(
  supabaseUrl: string,
  serviceRoleKey: string,
  sourceLang: string,
  title: string,
  content: string,
  metaDescription: string
): Promise<Record<string, { title: string; content: string; meta_description: string }>> {
  console.log(`Translating from ${sourceLang}...`);
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY non configurata");
  }

  const targetLangs = ['en', 'de', 'it', 'pt', 'es'].filter(l => l !== sourceLang);
  
  const systemPrompt = `Sei un traduttore professionista specializzato in contenuti per il settore iGaming e gambling online. 
Traduci il seguente contenuto da ${sourceLang} verso ${targetLangs.join(', ')}.

IMPORTANTE:
- Mantieni ESATTAMENTE la stessa formattazione HTML nel contenuto
- Usa terminologia appropriata per il settore gambling/casino
- Le traduzioni devono essere naturali e idiomatiche, non letterali
- Mantieni lo stesso tono professionale e coinvolgente
- Preserva tutti i tag HTML (<h2>, <p>, <strong>, ecc.)`;

  const userPrompt = `Traduci questi contenuti da ${sourceLang}:

TITOLO: ${title}

CONTENUTO: ${content}

META DESCRIPTION: ${metaDescription || ""}`;

  // Build dynamic properties based on target languages
  const translationProperties: Record<string, any> = {};
  for (const lang of targetLangs) {
    translationProperties[lang] = {
      type: "object",
      properties: {
        title: { type: "string", description: `Titolo tradotto in ${lang}` },
        content: { type: "string", description: `Contenuto HTML tradotto in ${lang}` },
        meta_description: { type: "string", description: `Meta description tradotta in ${lang}` }
      },
      required: ["title", "content", "meta_description"]
    };
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "return_translations",
            description: `Restituisce le traduzioni del contenuto del blog in ${targetLangs.length} lingue`,
            parameters: {
              type: "object",
              properties: {
                translations: {
                  type: "object",
                  properties: translationProperties,
                  required: targetLangs
                }
              },
              required: ["translations"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "return_translations" } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Errore AI Gateway:", response.status, errorText);
    throw new Error(`Translation failed: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || !toolCall.function?.arguments) {
    throw new Error("Invalid AI response format");
  }

  const result = JSON.parse(toolCall.function.arguments);
  console.log("Translations completed successfully");
  return result.translations;
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
    const { id, title, content_html, content_markdown, metaDescription, languageCode, publicUrl, createdAt } = payload;
    
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
    const content = content_html || content_markdown;
    const sourceLang = languageCode || 'en';
    const validLangs = ['en', 'de', 'it', 'pt', 'es'];
    const normalizedSourceLang = validLangs.includes(sourceLang) ? sourceLang : 'en';

    // Generate slug from title
    const baseSlug = generateSlug(title);
    console.log(`Generated base slug: ${baseSlug} from language: ${normalizedSourceLang}`);

    // Fetch hero image URL from the article details API if available
    let heroImageUrl: string | null = null;
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
          console.log(`Found hero image URL: ${heroImageUrl}`);
        }
      } catch (e) {
        console.error('Error fetching article details:', e);
      }
    }

    // Handle hero image upload
    let uploadedImageUrl: string | null = null;
    if (heroImageUrl) {
      uploadedImageUrl = await handleHeroImage(supabase, heroImageUrl, baseSlug);
    }

    // Translate content to other languages
    let translations: Record<string, { title: string; content: string; meta_description: string }> = {};
    try {
      translations = await translateContent(
        supabaseUrl,
        supabaseServiceKey,
        normalizedSourceLang,
        title,
        content,
        metaDescription || ''
      );
    } catch (translationError) {
      console.error('Translation failed, saving only source language:', translationError);
    }

    // Build the blog post data
    const blogPostData: Record<string, any> = {
      status: 'draft',
      source: 'babylovegrowth',
      category: 'news',
      author_id: '00000000-0000-0000-0000-000000000000', // System user
      slug: baseSlug,
      featured_image_url: uploadedImageUrl,
      created_at: createdAt || new Date().toISOString(),
    };

    // Set source language content
    blogPostData[`title_${normalizedSourceLang}`] = title;
    blogPostData[`content_${normalizedSourceLang}`] = content;
    blogPostData[`meta_description_${normalizedSourceLang}`] = metaDescription || '';
    blogPostData[`slug_${normalizedSourceLang}`] = baseSlug;

    // Set translated content
    for (const [lang, translation] of Object.entries(translations)) {
      blogPostData[`title_${lang}`] = translation.title;
      blogPostData[`content_${lang}`] = translation.content;
      blogPostData[`meta_description_${lang}`] = translation.meta_description;
      blogPostData[`slug_${lang}`] = generateSlug(translation.title);
    }

    // Ensure title_en and content_en are set (required fields)
    if (!blogPostData.title_en) {
      blogPostData.title_en = title;
      blogPostData.content_en = content;
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
        message: 'Article saved as draft'
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
