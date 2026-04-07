import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topic, keywords, category, tone, length, search_intent, content_format } = await req.json();

    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: 'Topic è obbligatorio' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY non configurato');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const currentCategory = category || 'affiliate-tips';

    const { data: clusterArticles } = await supabase
      .from('blog_posts')
      .select('slug_it, slug_en, title_it, title_en, category, views')
      .eq('status', 'published')
      .eq('category', currentCategory)
      .order('views', { ascending: false })
      .limit(15);

    const { data: crossClusterArticles } = await supabase
      .from('blog_posts')
      .select('slug_it, slug_en, title_it, title_en, category, views')
      .eq('status', 'published')
      .neq('category', currentCategory)
      .order('views', { ascending: false })
      .limit(10);

    const cluster = clusterArticles || [];
    const crossCluster = crossClusterArticles || [];
    const pillarArticle = cluster[0] || null;
    const clusterLinks = cluster.slice(1, 8);

    console.log(`Silo: category=${currentCategory}, cluster=${cluster.length}, cross=${crossCluster.length}, pillar="${pillarArticle?.title_it || 'none'}"`);

    const wordCounts = { short: 650, medium: 1200, long: 2200 };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1200;

    const toneGuide = {
      professional: 'professionale e autorevole, usa terminologia tecnica del settore affiliate',
      casual: 'diretto e amichevole come un collega esperto che condivide insider tips',
      technical: 'tecnico e preciso, approfondisci numeri, percentuali, configurazioni specifiche'
    }[tone || 'professional'];

    const formatGuide = {
      listicle: 'Lista numerata: ogni punto è un H2 con sottoparagrafi concreti.',
      howto: 'Step-by-step con <ol> per i passi. Ogni step spiegato con dettagli pratici.',
      review: 'Recensione strutturata: panoramica → funzionalità → pro/contro → verdetto in <blockquote>',
      comparison: 'Confronto con tabella HTML nella prima metà.',
      news: 'Notizia con lead paragraph → dettagli → implicazioni per affiliati'
    }[content_format || 'howto'] || 'Struttura con H2 logici';

    const intentGuide = {
      informational: 'Inizia con definizione chiara, poi esempi pratici.',
      transactional: 'Enfatizza benefici concreti, cifre reali, passi immediati.',
      commercial: 'Includi tabella comparativa, pro/contro, raccomandazione chiara.',
      navigational: 'Sii diretto, nessuna intro prolissa.'
    }[search_intent || 'informational'];

    const systemPrompt = `SEI UN ESPERTO DI AFFILIATE MARKETING iGAMING con 8+ anni di esperienza.
Scrivi per Revillion Partners (revillion-partners.com) — rete di affiliazione casino elite.

AUDIENCE: AFFILIATI (publisher, SEO, influencer) che vogliono guadagnare CPA promuovendo casino. NON giocatori.

COMPETITOR BAN: NON menzionare MAI Income Access, Bet365 Partners, GVC Affiliates, Kindred Affiliates, LeoVegas Partners, 888 Partners, Betsson Affiliates, William Hill Partners, Catena Media, Better Collective.

PARAMETRI:
- LUNGHEZZA: ~${targetWords} parole COMPLETE (non troncare mai)
- TONO: ${toneGuide}
- FORMATO: ${formatGuide}
- INTENTO: ${intentGuide}
- CATEGORIA: ${currentCategory}
${keywords ? `- KEYWORDS: ${keywords}` : ''}

STILE UMANO:
✅ Prima persona: "nella mia esperienza", "ho testato"
✅ Dati concreti: cifre realistiche (es: "CPA medio £80-140 UK")
✅ Opinioni schiette: "diciamoci la verità"
❌ EVITA: "In questo articolo scoprirai...", "Nel mondo dell'affiliate marketing..."

SEO:
✅ Keyword principale: titolo + primo paragrafo + 1 H2
✅ Primo paragrafo = definizione/risposta diretta (40-60 parole) per featured snippet
✅ FAQ section: 4-6 coppie <h4>domanda?</h4><p>risposta 40-80 parole</p>

SILO LINKS (OBBLIGATORI):
${pillarArticle ? `PILLAR: "${pillarArticle.title_it || pillarArticle.title_en}" → /blog/${pillarArticle.slug_it || pillarArticle.slug_en} (linka SEMPRE nella prima metà)` : 'Nessun pillar ancora (questo sarà il primo).'}
CLUSTER (2-3 link):
${clusterLinks.length > 0 ? clusterLinks.map((a: any) => `"${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : 'Nessuno disponibile.'}
CROSS-CLUSTER (1-2 link):
${crossCluster.length > 0 ? crossCluster.slice(0, 4).map((a: any) => `[${a.category}] "${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : 'Nessuno disponibile.'}

CTA: Nella conclusione includi SEMPRE: <a href="https://dashboard.revillion.com/en/registration">iscriviti a Revillion Partners</a>

HTML: usa <h2>, <h3>, <p>, <ul>/<ol>, <table>, <strong>. NO wrapper html/body/article.`;

    const userPrompt = `Scrivi un articolo SEO completo per affiliati iGaming su: "${topic}"

CHECKLIST:
□ ~${targetWords} parole — COMPLETO, non troncare mai
□ Primo paragrafo = definizione 40-60 parole (featured snippet)
□ Almeno una tabella HTML
□ Link pillar + 2-3 cluster + 1-2 cross-cluster (se disponibili)
□ CTA a Revillion Partners nella conclusione
□ Sezione FAQ (4-6 coppie <h4>domanda?</h4><p>risposta</p>)
□ Zero competitor menzionati

Titolo: keyword principale nelle prime 4 parole, max 62 caratteri.

IMPORTANTE: Rispondi SOLO con JSON valido, senza markdown, senza \`\`\`, senza spiegazioni. Solo il JSON puro:
{"title_it":"...","content_it":"...","meta_description_it":"...","slug":"...","keywords":["..."],"faq_items":[{"question":"...?","answer":"..."}],"schema_type":"Article","estimated_word_count":0}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 8192,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'Rate limit. Riprova tra qualche minuto.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'Crediti AI esauriti.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content ?? '';
    const finishReason = aiData.choices?.[0]?.finish_reason ?? 'unknown';
    console.log(`finish_reason: ${finishReason}, content_length: ${rawContent.length}`);

    if (!rawContent) {
      console.error('Empty response. Full aiData:', JSON.stringify(aiData).slice(0, 800));
      throw new Error('Risposta AI vuota');
    }

    // Strip markdown code fences, then extract JSON object
    const clean = rawContent
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim();

    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in response. Content (first 800):', rawContent.slice(0, 800));
      throw new Error('Formato risposta AI non valido — JSON non trovato');
    }

    const gen = JSON.parse(jsonMatch[0]);
    if (!gen.title_it || !gen.content_it) {
      throw new Error('Risposta AI incompleta — title_it o content_it mancanti');
    }

    const internalLinks = (gen.content_it.match(/<a\s+href=["']\/blog\/[^"']+["']/gi) || []).length;
    const externalRevillion = (gen.content_it.match(/revillion/gi) || []).length;
    console.log(`✅ Silo links: ${internalLinks} internal, Revillion mentions: ${externalRevillion}`);
    console.log(`✅ FAQ: ${gen.faq_items?.length || 0}, Schema: ${gen.schema_type}, Words: ${gen.estimated_word_count}`);

    return new Response(
      JSON.stringify({
        generated: {
          title_it: gen.title_it,
          content_it: gen.content_it,
          meta_description_it: gen.meta_description_it,
          slug: gen.slug,
          category: currentCategory,
          keywords: gen.keywords,
          faq_items: gen.faq_items || [],
          schema_type: gen.schema_type || 'Article',
          estimated_word_count: gen.estimated_word_count,
          silo_links_used: gen.silo_links_used || null,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore durante la generazione' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
