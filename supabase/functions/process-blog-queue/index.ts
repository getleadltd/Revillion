import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting blog queue processing...');

    // Get pending items scheduled for now or earlier
    const { data: queueItems, error: fetchError } = await supabase
      .from('blog_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(5); // Process max 5 at a time

    if (fetchError) {
      console.error('Error fetching queue items:', fetchError);
      throw fetchError;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('No pending items to process');
      return new Response(
        JSON.stringify({ message: 'No pending items', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${queueItems.length} items`);
    const results = [];

    for (const item of queueItems) {
      try {
        console.log(`Processing item ${item.id}: ${item.title}`);

        // Update status to processing
        await supabase
          .from('blog_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        // Step 1: Analyze title to get parameters
        console.log('Step 1: Analyzing title...');
        const analyzeResponse = await supabase.functions.invoke('analyze-blog-title', {
          body: { title: item.title }
        });

        if (analyzeResponse.error) {
          throw new Error(`Analysis failed: ${analyzeResponse.error.message}`);
        }

        const { category, keywords, tone, length } = analyzeResponse.data;
        console.log('Analysis result:', { category, keywords, tone, length });

        // Step 2: Generate content
        console.log('Step 2: Generating content...');
        const contentResponse = await supabase.functions.invoke('generate-blog-content', {
          body: {
            topic: item.title,
            keywords: keywords.join(', '),
            category,
            tone,
            length
          }
        });

        if (contentResponse.error) {
          throw new Error(`Content generation failed: ${contentResponse.error.message}`);
        }

        const generatedContent = contentResponse.data.generated;
        console.log('Content generated:', generatedContent.title_it);

        // Step 3: Translate content
        console.log('Step 3: Translating content...');
        const translateResponse = await supabase.functions.invoke('translate-blog-post', {
          body: {
            title_it: generatedContent.title_it,
            content_it: generatedContent.content_it,
            meta_description_it: generatedContent.meta_description_it
          }
        });

        if (translateResponse.error) {
          throw new Error(`Translation failed: ${translateResponse.error.message}`);
        }

        const translations = translateResponse.data;
        console.log('Translations completed');

        // Step 4: Generate featured image
        console.log('Step 4: Generating image...');
        const imageResponse = await supabase.functions.invoke('generate-blog-image', {
          body: {
            autoPrompt: {
              title: generatedContent.title_it,
              category: category
            }
          }
        });

        let featuredImageUrl = null;
        if (imageResponse.data?.imageUrl) {
          // Upload image to storage
          const imageBuffer = Uint8Array.from(atob(imageResponse.data.imageUrl.split(',')[1]), c => c.charCodeAt(0));
          const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              cacheControl: '3600'
            });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(uploadData.path);
            featuredImageUrl = urlData.publicUrl;
            console.log('Image uploaded:', featuredImageUrl);
          }
        }

        // Step 5: Create blog post
        console.log('Step 5: Creating blog post...');
        const { data: blogPost, error: createError } = await supabase
          .from('blog_posts')
          .insert({
            title_it: generatedContent.title_it,
            title_en: translations.title_en,
            title_de: translations.title_de,
            title_es: translations.title_es,
            title_pt: translations.title_pt,
            content_it: generatedContent.content_it,
            content_en: translations.content_en,
            content_de: translations.content_de,
            content_es: translations.content_es,
            content_pt: translations.content_pt,
            meta_description_it: generatedContent.meta_description_it,
            meta_description_en: translations.meta_description_en,
            meta_description_de: translations.meta_description_de,
            meta_description_es: translations.meta_description_es,
            meta_description_pt: translations.meta_description_pt,
            slug: generatedContent.slug,
            slug_it: generatedContent.slug,
            slug_en: translations.slug_en,
            slug_de: translations.slug_de,
            slug_es: translations.slug_es,
            slug_pt: translations.slug_pt,
            category: category,
            featured_image_url: featuredImageUrl,
            featured_image_alt: generatedContent.title_it,
            status: 'published',
            published_at: new Date().toISOString(),
            author_id: item.created_by
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Blog post creation failed: ${createError.message}`);
        }

        console.log('Blog post created:', blogPost.id);

        // Step 6: Update queue item as completed
        await supabase
          .from('blog_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            generated_post_id: blogPost.id,
            error_message: null
          })
          .eq('id', item.id);

        results.push({
          queueId: item.id,
          postId: blogPost.id,
          title: item.title,
          status: 'success'
        });

        console.log(`✅ Successfully processed item ${item.id}`);

      } catch (error) {
        console.error(`❌ Error processing item ${item.id}:`, error);

        // Update queue item as failed
        const retryCount = (item.retry_count || 0) + 1;
        await supabase
          .from('blog_queue')
          .update({
            status: retryCount >= 3 ? 'failed' : 'pending',
            error_message: error.message,
            retry_count: retryCount
          })
          .eq('id', item.id);

        results.push({
          queueId: item.id,
          title: item.title,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`Processing complete. Success: ${successCount}/${results.length}`);

    return new Response(
      JSON.stringify({
        message: 'Queue processing complete',
        processed: results.length,
        success: successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-blog-queue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
