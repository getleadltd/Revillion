import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mappatura topic e keywords per ogni articolo esistente
const articleMappings: Record<string, { topic: string; keywords: string; category: string }> = {
  // Brand Personale
  'brand-personale': {
    topic: 'Come costruire un brand personale forte nel settore dell\'affiliazione iGaming',
    keywords: 'brand personale, affiliazione casino, autorità online, personal branding, marketing iGaming',
    category: 'guides'
  },
  // Landing Page
  'landing-page': {
    topic: 'Come creare landing page ad alta conversione per l\'affiliazione casino',
    keywords: 'landing page, conversioni, copywriting, CRO, design persuasivo, affiliazione',
    category: 'guides'
  },
  // Nicchie Casino
  'nicchie-casino': {
    topic: 'Le migliori nicchie di casino online per affiliati nel 2025',
    keywords: 'nicchie casino, mercato iGaming, redditività, targeting, opportunità',
    category: 'guides'
  },
  // Conversioni
  'conversioni': {
    topic: 'Strategie per massimizzare le conversioni nell\'affiliazione casino',
    keywords: 'conversioni, CRO, ottimizzazione, funnel, tasso conversione, testing',
    category: 'strategies'
  },
  // Email Marketing
  'email-marketing': {
    topic: 'Strategie avanzate di email marketing per affiliati iGaming',
    keywords: 'email marketing, automazione, nurturing, segmentazione, newsletter, conversioni',
    category: 'strategies'
  },
  // Metriche
  'metriche': {
    topic: 'Metriche essenziali da monitorare per affiliati casino online',
    keywords: 'metriche, KPI, analytics, performance, dati, ROI, tracking',
    category: 'analytics'
  },
  // SEO
  'seo-avanzato': {
    topic: 'Strategie SEO avanzate per affiliati casino nel 2025',
    keywords: 'SEO, posizionamento Google, link building, keyword research, ranking organico',
    category: 'seo'
  },
  // Influencer Marketing
  'influencer-marketing': {
    topic: 'Come sfruttare l\'influencer marketing nel settore iGaming',
    keywords: 'influencer marketing, collaborazioni, partnership, content creator, ROI, sponsored',
    category: 'partnerships'
  },
  // Valutazione Programmi
  'valutazione-programmi': {
    topic: 'Come valutare e scegliere i migliori programmi di affiliazione casino',
    keywords: 'programmi affiliazione, revenue share, CPA, commissioni, network, selezione',
    category: 'partnerships'
  },
  // Marketing Multi-Canale
  'marketing-multicanale': {
    topic: 'Strategie di marketing multi-canale per affiliati casino',
    keywords: 'marketing multi-canale, omnichannel, integrazione, social media, content marketing',
    category: 'strategies'
  }
};

function getTopicFromSlug(slug: string): { topic: string; keywords: string; category: string } {
  // Cerca una corrispondenza parziale nello slug
  for (const [key, value] of Object.entries(articleMappings)) {
    if (slug.includes(key)) {
      return value;
    }
  }
  
  // Fallback generico
  return {
    topic: 'Guida completa all\'affiliazione casino online',
    keywords: 'affiliazione, casino online, iGaming, marketing, strategie',
    category: 'guides'
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Inizio rigenerazione di tutti gli articoli...');

    // 1. Fetch tutti gli articoli pubblicati
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Errore fetch articoli: ${fetchError.message}`);
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nessun articolo da rigenerare',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📚 Trovati ${posts.length} articoli da rigenerare`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // 2. Processa ogni articolo
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n🔄 [${i + 1}/${posts.length}] Processando: ${post.title_it}`);
      
      try {
        // Estrai topic e keywords basati sullo slug
        const mapping = getTopicFromSlug(post.slug_it || post.slug);
        
        console.log(`   Topic: ${mapping.topic}`);
        console.log(`   Keywords: ${mapping.keywords}`);

        // 3. Genera nuovo contenuto con il prompt "più umano"
        const { data: newContent, error: generateError } = await supabase.functions.invoke(
          'generate-blog-content',
          {
            body: {
              topic: mapping.topic,
              keywords: mapping.keywords,
              category: mapping.category,
              tone: 'professional',
              length: 'medium'
            }
          }
        );

        if (generateError) {
          throw new Error(`Errore generazione contenuto: ${generateError.message}`);
        }

        if (!newContent || !newContent.content) {
          throw new Error('Contenuto generato vuoto');
        }

        console.log(`   ✅ Contenuto generato (${newContent.content.length} caratteri)`);

        // 4. Aggiorna SOLO il contenuto italiano, mantieni tutto il resto
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            content_it: newContent.content,
            excerpt_it: newContent.excerpt || post.excerpt_it,
            updated_at: new Date().toISOString()
            // NON aggiorniamo: title_*, slug_*, featured_image_*, meta_description_*, category, status
          })
          .eq('id', post.id);

        if (updateError) {
          throw new Error(`Errore aggiornamento DB: ${updateError.message}`);
        }

        console.log(`   ✅ Contenuto italiano aggiornato`);

        // 5. Rigenera tutte le traduzioni con il nuovo contenuto
        console.log(`   🌍 Rigenerando traduzioni...`);
        
        const { data: translations, error: translateError } = await supabase.functions.invoke(
          'translate-blog-post',
          {
            body: {
              title_it: post.title_it,
              content_it: newContent.content,
              meta_description_it: post.meta_description_it
            }
          }
        );

        if (translateError) {
          throw new Error(`Errore traduzione: ${translateError.message}`);
        }

        // 6. Aggiorna le traduzioni nel database
        const { error: updateTransError } = await supabase
          .from('blog_posts')
          .update({
            content_en: translations.content_en,
            content_de: translations.content_de,
            content_pt: translations.content_pt,
            content_es: translations.content_es,
            excerpt_en: translations.excerpt_en || post.excerpt_en,
            excerpt_de: translations.excerpt_de || post.excerpt_de,
            excerpt_pt: translations.excerpt_pt || post.excerpt_pt,
            excerpt_es: translations.excerpt_es || post.excerpt_es
          })
          .eq('id', post.id);

        if (updateTransError) {
          throw new Error(`Errore aggiornamento traduzioni: ${updateTransError.message}`);
        }

        console.log(`   ✅ Traduzioni aggiornate`);
        console.log(`   ✨ Articolo completato con successo!`);

        successCount++;
        results.push({
          id: post.id,
          title: post.title_it,
          slug: post.slug,
          status: 'success',
          message: 'Articolo rigenerato con successo'
        });

      } catch (error) {
        console.error(`   ❌ Errore: ${error.message}`);
        errorCount++;
        results.push({
          id: post.id,
          title: post.title_it,
          slug: post.slug,
          status: 'error',
          error: error.message
        });
      }

      // Pausa tra articoli per evitare rate limiting (2 secondi)
      if (i < posts.length - 1) {
        console.log(`   ⏳ Pausa 2 secondi...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n✅ Rigenerazione completata!`);
    console.log(`   Successi: ${successCount}`);
    console.log(`   Errori: ${errorCount}`);
    console.log(`   Totale: ${posts.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Rigenerazione completata: ${successCount} successi, ${errorCount} errori`,
        total: posts.length,
        successCount,
        errorCount,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Errore generale:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
