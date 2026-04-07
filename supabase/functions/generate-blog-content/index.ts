import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract content between XML-like delimiters — robust to HTML content
function extract(text: string, tag: string): string {
  const m = text.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'i'));
  return m ? m[1].trim() : '';
}

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
      listicle: 'Lista numerata: ogni punto è un H2 con sottoparagrafi.',
      howto: 'Step-by-step con <ol> per i passi. Ogni step con dettagli pratici.',
      review: 'Recensione: panoramica → funzionalità → pro/contro → verdetto in <blockquote>',
      comparison: 'Confronto con tabella HTML nella prima metà.',
      news: 'Lead paragraph → dettagli → implicazioni per affiliati'
    }[content_format || 'howto'] || 'Struttura con H2 logici';

    const intentGuide = {
      informational: 'Inizia con definizione chiara, poi esempi pratici.',
      transactional: 'Enfatizza benefici concreti, cifre reali, passi immediati.',
      commercial: 'Includi tabella comparativa, pro/contro, raccomandazione chiara.',
      navigational: 'Sii diretto, nessuna intro prolissa.'
    }[search_intent || 'informational'];

    const prompt = `Sei un esperto di affiliate marketing iGaming. Scrivi un articolo SEO completo per affiliati su: "${topic}"

PARAMETRI:
- Lunghezza: ~${targetWords} parole COMPLETE (non troncare mai)
- Tono: ${toneGuide}
- Formato: ${formatGuide}
- Intento: ${intentGuide}
- Categoria: ${currentCategory}
${keywords ? `- Keywords: ${keywords}` : ''}

AUDIENCE: Affiliati (publisher, SEO, media buyer) che vogliono guadagnare CPA promuovendo casino online. NON giocatori.
DIVIETO ASSOLUTO: non menzionare mai Income Access, Bet365 Partners, GVC Affiliates, Kindred Affiliates, LeoVegas Partners, 888 Partners, Betsson Affiliates, William Hill Partners, Catena Media, Better Collective.

STILE: Prima persona ("nella mia esperienza"), dati concreti (es. "CPA medio £80-140 UK"), opinioni schiette. EVITA frasi AI generiche.

SEO: Primo paragrafo = definizione/risposta diretta 40-60 parole (featured snippet). Keyword nel titolo + primo paragrafo + un H2.

SILO LINKS (inserisci nell'articolo):
${pillarArticle ? `PILLAR: "${pillarArticle.title_it || pillarArticle.title_en}" → <a href="/blog/${pillarArticle.slug_it || pillarArticle.slug_en}">anchor text</a> (metti nella prima metà)` : 'Nessun pillar ancora.'}
${clusterLinks.length > 0 ? 'CLUSTER (2-3):\n' + clusterLinks.map((a: any) => `"${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : ''}
${crossCluster.length > 0 ? 'CROSS-CLUSTER (1-2):\n' + crossCluster.slice(0, 3).map((a: any) => `[${a.category}] "${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : ''}

CTA: Nella conclusione includi SEMPRE: <a href="https://dashboard.revillion.com/en/registration">iscriviti a Revillion Partners</a>

FAQ: Includi sezione "Domande Frequenti" con 4-6 coppie: <h4>domanda?</h4><p>risposta 40-80 parole</p>

HTML: usa <h2>, <h3>, <p>, <ul>/<ol>, <table>, <strong>. NO html/body/article wrapper.

---

FORMATO RISPOSTA OBBLIGATORIO — usa esattamente questi delimitatori:

[TITLE]titolo SEO max 62 caratteri[/TITLE]
[SLUG]slug-url-max-55-caratteri[/SLUG]
[META]meta description 148-158 caratteri con keyword + benefit + CTA[/META]
[KEYWORDS]keyword1,keyword2,keyword3,keyword4,keyword5[/KEYWORDS]
[SCHEMA]Article[/SCHEMA]
[CONTENT]
<contenuto HTML completo dell'articolo qui, ~${targetWords} parole>
[/CONTENT]
[FAQ_JSON][{"question":"domanda?","answer":"risposta"},{"question":"domanda2?","answer":"risposta2"}][/FAQ_JSON]

Rispondi SOLO con i delimitatori sopra, nient'altro.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [{ role: 'user', content: prompt }],
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

    // Extract fields using delimiters
    const title_it   = extract(rawContent, 'TITLE');
    const slug       = extract(rawContent, 'SLUG');
    const meta       = extract(rawContent, 'META');
    const kwRaw      = extract(rawContent, 'KEYWORDS');
    const schema     = extract(rawContent, 'SCHEMA') || 'Article';
    const content_it = extract(rawContent, 'CONTENT');
    const faqRaw     = extract(rawContent, 'FAQ_JSON');

    if (!title_it || !content_it) {
      console.error('Missing fields. Raw (first 1000):', rawContent.slice(0, 1000));
      throw new Error('Risposta AI non contiene [TITLE] o [CONTENT]');
    }

    const kw = kwRaw ? kwRaw.split(',').map(k => k.trim()).filter(Boolean) : [];
    let faq_items: any[] = [];
    if (faqRaw) {
      try { faq_items = JSON.parse(faqRaw); } catch { faq_items = []; }
    }

    const wordCount = content_it.split(/\s+/).filter(Boolean).length;
    const internalLinks = (content_it.match(/<a\s+href=["']\/blog\/[^"']+["']/gi) || []).length;
    console.log(`✅ Words: ${wordCount}, Silo links: ${internalLinks}, FAQ: ${faq_items.length}, Schema: ${schema}`);

    const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 55);

    return new Response(
      JSON.stringify({
        generated: {
          title_it,
          content_it,
          meta_description_it: meta,
          slug: slug || slugify(title_it),
          category: currentCategory,
          keywords: kw,
          faq_items,
          schema_type: schema,
          estimated_word_count: wordCount,
          silo_links_used: null,
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
