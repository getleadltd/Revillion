import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
// Use flash for reliability — already works for review agents, faster, better instruction-following
const MODEL = 'google/gemini-2.5-flash';

async function callAI(apiKey: string, messages: any[], maxTokens = 4096): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
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

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const currentCategory = category || 'affiliate-tips';

    const { data: clusterArticles } = await supabase
      .from('blog_posts').select('slug_it, slug_en, title_it, title_en, category, views')
      .eq('status', 'published').eq('category', currentCategory)
      .order('views', { ascending: false }).limit(15);

    const { data: crossClusterArticles } = await supabase
      .from('blog_posts').select('slug_it, slug_en, title_it, title_en, category, views')
      .eq('status', 'published').neq('category', currentCategory)
      .order('views', { ascending: false }).limit(10);

    const cluster = clusterArticles || [];
    const crossCluster = crossClusterArticles || [];
    const pillarArticle = cluster[0] || null;
    const clusterLinks = cluster.slice(1, 8);

    const wordCounts = { short: 650, medium: 1200, long: 2200 };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1200;
    const toneGuide = ({ professional: 'professionale e autorevole', casual: 'diretto e amichevole', technical: 'tecnico e preciso' } as any)[tone || 'professional'];
    const formatGuide = ({ listicle: 'Lista numerata con H2 per ogni punto', howto: 'Step-by-step con <ol>', review: 'Recensione con <blockquote> per il verdetto', comparison: 'Confronto con tabella HTML', news: 'Lead paragraph + dettagli' } as any)[content_format || 'howto'] || 'Struttura con H2 logici';
    const intentGuide = ({ informational: 'Definizione chiara + esempi pratici', transactional: 'Benefici concreti + passi immediati', commercial: 'Tabella comparativa + raccomandazione', navigational: 'Diretto, senza intro prolissa' } as any)[search_intent || 'informational'];

    const siloContext = [
      pillarArticle ? `PILLAR: "${pillarArticle.title_it || pillarArticle.title_en}" → /blog/${pillarArticle.slug_it || pillarArticle.slug_en}` : '',
      clusterLinks.length > 0 ? 'CLUSTER:\n' + clusterLinks.slice(0, 5).map((a: any) => `- "${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : '',
      crossCluster.length > 0 ? 'CROSS-CLUSTER:\n' + crossCluster.slice(0, 3).map((a: any) => `- [${a.category}] "${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : '',
    ].filter(Boolean).join('\n');

    // ── CALL 1: Generate article content (plain HTML, no format constraints) ──
    console.log('Call 1: generating content...');
    const contentPrompt = `Sei un esperto di affiliate marketing iGaming. Scrivi un articolo SEO per affiliati casino su: "${topic}"

PARAMETRI:
- ~${targetWords} parole COMPLETE (non troncare)
- Tono: ${toneGuide}
- Formato: ${formatGuide}
- Intento: ${intentGuide}
- Categoria: ${currentCategory}
${keywords ? `- Keywords target: ${keywords}` : ''}

AUDIENCE: Affiliati (publisher, SEO, media buyer) che promuovono casino per commissioni CPA. NON giocatori.
VIETATO menzionare: Income Access, Bet365 Partners, GVC Affiliates, Kindred Affiliates, LeoVegas Partners, 888 Partners, Betsson Affiliates, William Hill Partners, Catena Media, Better Collective.

STILE: Prima persona ("nella mia esperienza"), dati concreti, opinioni schiette. No frasi AI generiche.

LINKS INTERNI DA INSERIRE:
${siloContext || 'Nessun articolo pubblicato ancora — scrivi senza link interni.'}
- Formato: <a href="/blog/slug">anchor text descrittivo</a>
- Includi link al PILLAR nella prima metà (se disponibile)
- 2-3 link cluster + 1-2 cross-cluster

CTA: Nella conclusione SEMPRE: <a href="https://dashboard.revillion.com/en/registration">iscriviti a Revillion Partners</a>

FAQ: Sezione "Domande Frequenti" con 4-6 coppie: <h4>Domanda?</h4><p>Risposta 40-80 parole</p>

SEO: Primo paragrafo = definizione 40-60 parole (featured snippet).

HTML puro: <h2>, <h3>, <p>, <ul>/<ol>, <table>, <strong>. NO html/body/article wrapper. Inizia direttamente con il contenuto.`;

    const contentRaw = await callAI(LOVABLE_API_KEY, [{ role: 'user', content: contentPrompt }], 8192);
    console.log(`Content generated: ${contentRaw.length} chars`);

    if (!contentRaw || contentRaw.length < 500) {
      throw new Error(`Contenuto generato troppo corto: ${contentRaw.length} caratteri`);
    }

    // Strip markdown code fences if model added them
    const content_it = contentRaw.replace(/^```(?:html)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();

    // ── CALL 2: Generate metadata only (small JSON, no HTML) ──
    console.log('Call 2: generating metadata...');
    const metaPrompt = `Dato questo articolo su "${topic}" per affiliati iGaming, genera i metadati SEO.

Rispondi SOLO con questo JSON (niente altro, niente markdown):
{"title":"TITOLO SEO max 62 caratteri con keyword principale","slug":"slug-url-max-50-caratteri","meta":"meta description 148-158 caratteri con keyword + benefit + CTA","keywords":["kw1","kw2","kw3","kw4","kw5"],"schema":"Article","faq":[{"q":"Domanda?","a":"Risposta 40-80 parole"},{"q":"Domanda2?","a":"Risposta2"}]}

Usa 4-6 FAQ rilevanti per il topic. Schema può essere: Article, HowTo, Review, FAQPage.`;

    const metaRaw = await callAI(LOVABLE_API_KEY, [{ role: 'user', content: metaPrompt }], 1024);
    console.log(`Metadata generated: ${metaRaw.length} chars`);

    // Parse metadata JSON
    const metaClean = metaRaw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/im, '').trim();
    const metaJsonMatch = metaClean.match(/\{[\s\S]*\}/);
    if (!metaJsonMatch) throw new Error('Metadata JSON non trovato');
    const meta = JSON.parse(metaJsonMatch[0]);

    const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 55);
    const faq_items = (meta.faq || []).map((f: any) => ({ question: f.q || f.question, answer: f.a || f.answer }));
    const wordCount = content_it.split(/\s+/).filter(Boolean).length;
    const internalLinks = (content_it.match(/<a\s+href=["']\/blog\/[^"']+["']/gi) || []).length;
    console.log(`✅ Words: ${wordCount}, Silo links: ${internalLinks}, FAQ: ${faq_items.length}`);

    return new Response(
      JSON.stringify({
        generated: {
          title_it: meta.title || topic,
          content_it,
          meta_description_it: meta.meta || '',
          slug: meta.slug || slugify(meta.title || topic),
          category: currentCategory,
          keywords: meta.keywords || [],
          faq_items,
          schema_type: meta.schema || 'Article',
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
