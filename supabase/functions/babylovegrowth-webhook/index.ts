import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { fetchPublicUrl, readResponseBytes } from '../_shared/public-http.ts';

const MAX_WEBHOOK_BODY_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_ARTICLE_RESPONSE_BYTES = 256 * 1024;
const MAX_EXTERNAL_SOURCE_ID_LENGTH = 200;
const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
type ExistingIngest = {
  id: string;
  slug: string;
  featured_image_url: string | null;
  external_ingest_status: string | null;
};
type UploadedHeroImage = {
  created: boolean;
  objectPath: string;
  publicUrl: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getImageHostAllowlist(): string[] {
  return (Deno.env.get('BABYLOVEGROWTH_IMAGE_HOSTS') || '')
    .split(',')
    .map((hostname) => hostname.trim())
    .filter(Boolean);
}

function normalizeExternalSourceId(value: unknown): string | null {
  const normalized = typeof value === 'string'
    ? value.trim()
    : typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
      ? String(value)
      : '';
  const hasControlCharacter = Array.from(normalized).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });

  if (
    normalized.length === 0
    || normalized.length > MAX_EXTERNAL_SOURCE_ID_LENGTH
    || hasControlCharacter
  ) {
    return null;
  }

  return normalized;
}

async function findExistingIngest(
  supabase: SupabaseClient,
  externalSourceId: string,
): Promise<ExistingIngest | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, featured_image_url, external_ingest_status')
    .eq('source', 'babylovegrowth')
    .eq('external_source_id', externalSourceId)
    .maybeSingle();

  if (error) throw error;
  return data as ExistingIngest | null;
}

function idempotentResponse(postId: string): Response {
  return new Response(
    JSON.stringify({
      status: 'already_received',
      idempotent: true,
      post_id: postId,
      message: 'This article was already accepted.',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

function matchesImageSignature(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte);
  }
  if (contentType === 'image/webp') {
    return bytes.length >= 12
      && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF'
      && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  }
  if (contentType === 'image/gif') {
    if (bytes.length < 6) return false;
    const signature = new TextDecoder().decode(bytes.slice(0, 6));
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  return false;
}

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

// Clean HTML content: remove JSON-LD scripts, extract image URL and alt text
function cleanHtmlContent(html: string): { 
  cleanedHtml: string; 
  extractedImageUrl: string | null;
  extractedImageAlt: string | null;
} {
  let extractedImageUrl: string | null = null;
  let extractedImageAlt: string | null = null;
  
  // Extract JSON-LD script content to get image URL and alt text
  const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  
  if (jsonLdMatch && jsonLdMatch[1]) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1].trim());
      
      // === DETAILED JSON-LD LOGGING ===
      console.log('========================================');
      console.log('=== BABYLOVEGROWTH JSON-LD ANALYSIS ===');
      console.log('========================================');
      console.log('JSON-LD Keys:', Object.keys(jsonLd));
      console.log('JSON-LD Full Content:', JSON.stringify(jsonLd, null, 2));
      
      // Log specific potentially useful fields
      console.log('--- FIELD BREAKDOWN ---');
      console.log('@context:', jsonLd['@context']);
      console.log('@type:', jsonLd['@type']);
      console.log('headline:', jsonLd.headline);
      console.log('name:', jsonLd.name);
      console.log('description:', jsonLd.description);
      console.log('image:', JSON.stringify(jsonLd.image, null, 2));
      console.log('thumbnailUrl:', jsonLd.thumbnailUrl);
      console.log('datePublished:', jsonLd.datePublished);
      console.log('dateModified:', jsonLd.dateModified);
      console.log('dateCreated:', jsonLd.dateCreated);
      console.log('author:', JSON.stringify(jsonLd.author, null, 2));
      console.log('creator:', JSON.stringify(jsonLd.creator, null, 2));
      console.log('publisher:', JSON.stringify(jsonLd.publisher, null, 2));
      console.log('keywords:', jsonLd.keywords);
      console.log('articleSection:', jsonLd.articleSection);
      console.log('articleBody (first 200 chars):', jsonLd.articleBody?.substring(0, 200));
      console.log('wordCount:', jsonLd.wordCount);
      console.log('inLanguage:', jsonLd.inLanguage);
      console.log('mainEntityOfPage:', jsonLd.mainEntityOfPage);
      console.log('isAccessibleForFree:', jsonLd.isAccessibleForFree);
      console.log('url:', jsonLd.url);
      console.log('speakable:', JSON.stringify(jsonLd.speakable, null, 2));
      
      // Check for FAQ or other structured data
      if (jsonLd['@graph']) {
        console.log('--- @graph FOUND (multiple entities) ---');
        console.log('@graph length:', jsonLd['@graph'].length);
        jsonLd['@graph'].forEach((item: Record<string, unknown>, index: number) => {
          console.log(`@graph[${index}] @type:`, item['@type']);
          console.log(`@graph[${index}] keys:`, Object.keys(item));
        });
      }
      
      // Check for FAQ schema
      if (jsonLd['@type'] === 'FAQPage' || jsonLd.mainEntity) {
        console.log('--- FAQ CONTENT FOUND ---');
        console.log('mainEntity:', JSON.stringify(jsonLd.mainEntity, null, 2));
      }
      
      console.log('========================================');
      
      // Try to extract image URL and alt text from JSON-LD
      if (jsonLd.image?.url) {
        extractedImageUrl = jsonLd.image.url;
        // Extract alternativeHeadline as alt text
        if (jsonLd.image.alternativeHeadline) {
          extractedImageAlt = jsonLd.image.alternativeHeadline;
        } else if (jsonLd.image.caption) {
          extractedImageAlt = jsonLd.image.caption;
        } else if (jsonLd.image.description) {
          extractedImageAlt = jsonLd.image.description;
        }
      } else if (typeof jsonLd.image === 'string') {
        extractedImageUrl = jsonLd.image;
      } else if (jsonLd.thumbnailUrl) {
        extractedImageUrl = jsonLd.thumbnailUrl;
      }
      
      console.log(`Extracted image URL from JSON-LD: ${extractedImageUrl}`);
      console.log(`Extracted image alt text from JSON-LD: ${extractedImageAlt}`);
    } catch (e) {
      console.error('Error parsing JSON-LD:', e);
    }
  } else {
    console.log('No JSON-LD script found in content');
  }
  
  // Remove all JSON-LD scripts from content
  const cleanedHtml = html
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();
  
  return { cleanedHtml, extractedImageUrl, extractedImageAlt };
}

// Download and upload hero image to Supabase storage
async function handleHeroImage(
  supabase: SupabaseClient,
  imageUrl: string,
  postSlug: string,
  postId: string,
): Promise<UploadedHeroImage | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  let cancelTimeout: () => void = () => undefined;
  
  try {
    const allowedHostnames = getImageHostAllowlist();
    if (allowedHostnames.length === 0) {
      console.warn('Skipping hero image download: BABYLOVEGROWTH_IMAGE_HOSTS is not configured');
      return null;
    }

    console.log(`Downloading hero image from: ${imageUrl}`);

    const result = await fetchPublicUrl(
      imageUrl,
      { method: 'GET', headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' } },
      {
        timeoutMs: 10_000,
        dnsTimeoutMs: 2_000,
        maxRedirects: 4,
        allowedHostnames,
      },
    );
    const imageResponse = result.response;
    cancelTimeout = result.cancelTimeout;

    if (!imageResponse.ok) {
      await imageResponse.body?.cancel().catch(() => undefined);
      console.error(`Failed to download image: ${imageResponse.status}`);
      return null;
    }

    const contentType = (imageResponse.headers.get('content-type') || '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase();
    const extension = IMAGE_EXTENSIONS[contentType];
    if (!extension) {
      await imageResponse.body?.cancel().catch(() => undefined);
      console.error(`Rejected hero image with unsupported MIME type: ${contentType || '(missing)'}`);
      return null;
    }

    const imageBytes = await readResponseBytes(imageResponse, MAX_IMAGE_BYTES);
    if (!matchesImageSignature(imageBytes, contentType)) {
      console.error('Rejected hero image because its bytes do not match the declared MIME type');
      return null;
    }

    // A deterministic path gives every delivery for this post the same target.
    // Never upsert: a retry must not replace bytes that a previous attempt (or
    // an editor) has already made visible at this URL.
    const fileName = `babylovegrowth/${postSlug}-${postId}.${extension}`;

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBytes, {
        contentType,
        upsert: false,
      });

    if (error) {
      // The most common retry race is that another delivery uploaded the same
      // deterministic object first. Confirm the exact object exists before
      // reusing its URL; unrelated storage errors remain a skipped optional
      // image and never cause an overwrite.
      const pathSeparator = fileName.lastIndexOf('/');
      const folder = fileName.slice(0, pathSeparator);
      const objectName = fileName.slice(pathSeparator + 1);
      const { data: existingObjects, error: listError } = await supabase.storage
        .from('blog-images')
        .list(folder, { limit: 1, search: objectName });
      const existingObject = existingObjects?.find((item) => item.name === objectName);

      if (listError || !existingObject) {
        console.error('Error uploading image:', error);
        if (listError) console.error('Error checking an existing image object:', listError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      console.log(`Reusing an existing hero image: ${publicUrl}`);
      return { created: false, objectPath: fileName, publicUrl };
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    console.log(`Image uploaded successfully: ${publicUrl}`);
    return { created: true, objectPath: fileName, publicUrl };
  } catch (error) {
    console.error('Error handling hero image:', error);
    return null;
  } finally {
    cancelTimeout();
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
      },
    );
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
    const declaredLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const payloadResponse = new Response(req.body, {
      headers: req.headers.has('content-length')
        ? { 'content-length': req.headers.get('content-length')! }
        : undefined,
    });
    const rawPayloadBytes = await readResponseBytes(payloadResponse, MAX_WEBHOOK_BODY_BYTES);
    const rawPayload = new TextDecoder('utf-8', { fatal: true }).decode(rawPayloadBytes);

    const parsedPayload: unknown = JSON.parse(rawPayload);
    if (!parsedPayload || typeof parsedPayload !== 'object' || Array.isArray(parsedPayload)) {
      return new Response(
        JSON.stringify({ error: 'Payload must be a JSON object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const payload = parsedPayload as Record<string, unknown>;
    const externalSourceId = normalizeExternalSourceId(payload.id);
    if (!externalSourceId) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid article id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    
    // === DETAILED PAYLOAD LOGGING ===
    console.log('========================================');
    console.log('=== BABYLOVEGROWTH WEBHOOK PAYLOAD ===');
    console.log('========================================');
    console.log('Payload Keys:', Object.keys(payload));
    console.log('id:', externalSourceId);
    console.log('title:', payload.title);
    console.log('slug:', payload.slug);
    console.log('languageCode:', payload.languageCode);
    console.log('keywords:', payload.keywords);
    console.log('metaDescription:', payload.metaDescription);
    console.log('createdAt:', payload.createdAt);
    console.log('updatedAt:', payload.updatedAt);
    console.log('publishedAt:', payload.publishedAt);
    console.log('category:', payload.category);
    console.log('tags:', payload.tags);
    console.log('author:', payload.author);
    console.log('content_html length:', typeof payload.content_html === 'string' ? payload.content_html.length : 0);
    console.log('content_markdown length:', typeof payload.content_markdown === 'string' ? payload.content_markdown.length : 0);
    console.log('hero_image_url:', payload.hero_image_url);
    console.log('featured_image:', payload.featured_image);
    console.log('========================================');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // An already completed claim is a successful retry. A processing claim is
    // resumed below, which covers crashes between the row insert, image upload,
    // image link and final status update.
    let claimedPost = await findExistingIngest(supabase, externalSourceId);
    if (claimedPost && claimedPost.external_ingest_status !== 'processing') {
      return idempotentResponse(claimedPost.id);
    }
    let isRetry = claimedPost !== null;

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const contentHtml = typeof payload.content_html === 'string' ? payload.content_html.trim() : '';
    const contentMarkdown = typeof payload.content_markdown === 'string' ? payload.content_markdown.trim() : '';
    const rawContent = contentHtml || contentMarkdown;
    const metaDescription = typeof payload.metaDescription === 'string' ? payload.metaDescription : '';
    const languageCode = typeof payload.languageCode === 'string' ? payload.languageCode.toLowerCase() : 'en';
    const createdAt = typeof payload.createdAt === 'string' && !Number.isNaN(Date.parse(payload.createdAt))
      ? payload.createdAt
      : new Date().toISOString();

    if (!claimedPost && (!title || !rawContent)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title and content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const sourceLang = languageCode || 'en';
    const validLangs = ['en', 'de', 'it', 'pt', 'es'];
    const normalizedSourceLang = validLangs.includes(sourceLang) ? sourceLang : 'en';

    const cleanedContent = rawContent
      ? cleanHtmlContent(rawContent)
      : { cleanedHtml: '', extractedImageUrl: null, extractedImageAlt: null };
    const { cleanedHtml, extractedImageUrl, extractedImageAlt } = cleanedContent;
    console.log(`Content cleaned. Extracted image: ${extractedImageUrl ? 'yes' : 'no'}, alt text: ${extractedImageAlt ? 'yes' : 'no'}`);

    const baseSlug = claimedPost?.slug || generateSlug(title);
    if (!baseSlug) {
      return new Response(
        JSON.stringify({ error: 'Title does not produce a valid slug' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    console.log(`Using base slug: ${baseSlug} for language: ${normalizedSourceLang}`);

    if (!claimedPost) {
      // Resolve the author before claiming the event. No remote article/image
      // request or storage write happens until the unique database claim exists.
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
        const { data: anyUser } = await supabase.auth.admin.listUsers({ perPage: 1 });
        if (anyUser?.users?.length > 0) {
          authorId = anyUser.users[0].id;
        }
      }

      if (!authorId) {
        throw new Error('No valid author_id found. Please ensure at least one user exists.');
      }
      console.log(`Using author_id: ${authorId}`);

      const blogPostData: Record<string, unknown> = {
        status: 'draft',
        source: 'babylovegrowth',
        external_source_id: externalSourceId,
        external_ingest_status: 'processing',
        source_language: normalizedSourceLang,
        category: 'news',
        author_id: authorId,
        slug: baseSlug,
        featured_image_url: null,
        featured_image_alt: extractedImageAlt,
        created_at: createdAt,
        title_en: title,
        content_en: cleanedHtml,
        meta_description_en: metaDescription,
        slug_en: baseSlug,
      };

      if (normalizedSourceLang !== 'en') {
        blogPostData[`title_${normalizedSourceLang}`] = title;
        blogPostData[`content_${normalizedSourceLang}`] = cleanedHtml;
        blogPostData[`meta_description_${normalizedSourceLang}`] = metaDescription;
        blogPostData[`slug_${normalizedSourceLang}`] = baseSlug;
      }

      console.log('Claiming webhook event with data:', Object.keys(blogPostData));
      const { data: insertedPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert([blogPostData])
        .select('id')
        .single();

      if (insertError) {
        // A concurrent delivery may have won the unique external ID claim.
        // Only treat it as idempotent when that exact source ID now exists;
        // unrelated conflicts (for example a duplicate slug) remain errors.
        if (insertError.code === '23505') {
          claimedPost = await findExistingIngest(supabase, externalSourceId);
          if (claimedPost) {
            isRetry = true;
            if (claimedPost.external_ingest_status !== 'processing') {
              return idempotentResponse(claimedPost.id);
            }
          }
        }

        if (!claimedPost) {
          console.error('Error claiming webhook event:', insertError);
          throw insertError;
        }
      } else {
        claimedPost = {
          id: insertedPost.id,
          slug: baseSlug,
          featured_image_url: null,
          external_ingest_status: 'processing',
        };
        console.log(`Blog post claim created successfully with ID: ${insertedPost.id}`);
      }
    }

    if (!claimedPost) {
      throw new Error('Webhook event could not be claimed');
    }

    // Do not replace an image that an editor or another retry already linked.
    if (!claimedPost.featured_image_url) {
      let heroImageUrl: string | null = extractedImageUrl;

      if (!heroImageUrl) {
        const babyloveGrowthApiKey = Deno.env.get('BABYLOVEGROWTH_API_KEY');
        if (babyloveGrowthApiKey) {
          let cancelArticleTimeout: () => void = () => undefined;
          try {
            console.log(`Fetching article details for ID: ${externalSourceId}`);
            const safeArticleId = encodeURIComponent(externalSourceId);
            const articleResult = await fetchPublicUrl(
              `https://api.babylovegrowth.ai/api/integrations/v1/articles/${safeArticleId}`,
              {
                method: 'GET',
                headers: {
                  'X-API-Key': babyloveGrowthApiKey,
                  Accept: 'application/json',
                },
              },
              {
                timeoutMs: 8_000,
                dnsTimeoutMs: 2_000,
                maxRedirects: 2,
                allowedHostnames: ['api.babylovegrowth.ai'],
              },
            );
            const articleResponse = articleResult.response;
            cancelArticleTimeout = articleResult.cancelTimeout;

            if (articleResponse.ok) {
              const articleBytes = await readResponseBytes(articleResponse, MAX_ARTICLE_RESPONSE_BYTES);
              const articleData: unknown = JSON.parse(new TextDecoder().decode(articleBytes));
              if (articleData && typeof articleData === 'object' && !Array.isArray(articleData)) {
                const candidateUrl = (articleData as Record<string, unknown>).hero_image_url;
                heroImageUrl = typeof candidateUrl === 'string' ? candidateUrl : null;
              }
              console.log(`Found hero image URL from API: ${heroImageUrl}`);
            } else {
              await articleResponse.body?.cancel().catch(() => undefined);
            }
          } catch (e) {
            console.error('Error fetching article details:', e);
          } finally {
            cancelArticleTimeout();
          }
        }
      }

      if (heroImageUrl) {
        const uploadedImage = await handleHeroImage(
          supabase,
          heroImageUrl,
          claimedPost.slug,
          claimedPost.id,
        );

        if (uploadedImage) {
          const { data: linkedPost, error: linkError } = await supabase
            .from('blog_posts')
            .update({ featured_image_url: uploadedImage.publicUrl })
            .eq('id', claimedPost.id)
            .eq('source', 'babylovegrowth')
            .eq('external_source_id', externalSourceId)
            .eq('external_ingest_status', 'processing')
            .is('featured_image_url', null)
            .select('id, featured_image_url')
            .maybeSingle();

          if (linkError) {
            // Verify whether an ambiguous database error still linked the file
            // before removing it from storage.
            const { data: currentPost, error: currentPostError } = await supabase
              .from('blog_posts')
              .select('featured_image_url')
              .eq('id', claimedPost.id)
              .maybeSingle();

            if (
              uploadedImage.created
              && !currentPostError
              && currentPost?.featured_image_url !== uploadedImage.publicUrl
            ) {
              const { error: cleanupError } = await supabase.storage
                .from('blog-images')
                .remove([uploadedImage.objectPath]);
              if (cleanupError) console.error('Failed to clean up unlinked hero image:', cleanupError);
            }
            throw linkError;
          }

          if (!linkedPost) {
            // Another delivery or a human editor linked an image first. Keep the
            // deterministic upload only if that same URL is now referenced.
            const { data: currentPost, error: currentPostError } = await supabase
              .from('blog_posts')
              .select('featured_image_url')
              .eq('id', claimedPost.id)
              .single();
            if (currentPostError) throw currentPostError;

            if (
              uploadedImage.created
              && currentPost.featured_image_url !== uploadedImage.publicUrl
            ) {
              const { error: cleanupError } = await supabase.storage
                .from('blog-images')
                .remove([uploadedImage.objectPath]);
              if (cleanupError) console.error('Failed to clean up superseded hero image:', cleanupError);
            }
          }
        }
      }
    }

    // Finalization is deliberately separate from the image link. If this write
    // fails, a retry sees "processing", observes any existing image and safely
    // performs only this final step.
    const { data: finalizedPost, error: finalizeError } = await supabase
      .from('blog_posts')
      .update({
        external_ingest_status: 'complete',
        external_ingested_at: new Date().toISOString(),
      })
      .eq('id', claimedPost.id)
      .eq('source', 'babylovegrowth')
      .eq('external_source_id', externalSourceId)
      .eq('external_ingest_status', 'processing')
      .select('id')
      .maybeSingle();

    if (finalizeError) throw finalizeError;

    // A concurrent retry may have finalized this claim while this request was
    // working. Treat that as success, but never change a row that is already
    // complete or was manually detached from this external source.
    if (!finalizedPost) {
      const currentPost = await findExistingIngest(supabase, externalSourceId);
      if (currentPost?.id === claimedPost.id && currentPost.external_ingest_status === 'complete') {
        return idempotentResponse(claimedPost.id);
      }
      throw new Error('Webhook claim changed before it could be finalized');
    }

    return new Response(
      JSON.stringify({ 
        status: isRetry ? 'resumed' : 'received',
        idempotent: isRetry,
        post_id: claimedPost.id,
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
