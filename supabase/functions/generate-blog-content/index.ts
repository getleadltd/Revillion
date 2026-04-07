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

    // ═══════════════════════════════════════════════════
    // SILO ARCHITECTURE: Separate same-cluster from cross-cluster links
    // Pillar = most-viewed article in same category
    // ═══════════════════════════════════════════════���═══

    const currentCategory = category || 'affiliate-tips';

    // 1. Same-category articles (cluster) — ordered by views DESC (most viewed = pillar candidate)
    const { data: clusterArticles } = await supabase
      .from('blog_posts')
      .select('slug_it, slug_en, title_it, title_en, category, views')
      .eq('status', 'published')
      .eq('category', currentCategory)
      .order('views', { ascending: false })
      .limit(15);

    // 2. Cross-cluster articles (other categories) — ordered by views DESC
    const { data: crossClusterArticles } = await supabase
      .from('blog_posts')
      .select('slug_it, slug_en, title_it, title_en, category, views')
      .eq('status', 'published')
      .neq('category', currentCategory)
      .order('views', { ascending: false })
      .limit(10);

    const cluster = clusterArticles || [];
    const crossCluster = crossClusterArticles || [];

    // Pillar = first item in cluster (most viewed in same category)
    const pillarArticle = cluster[0] || null;
    const clusterLinks = cluster.slice(1, 8); // exclude pillar itself from cluster list

    console.log(`Silo: category=${currentCategory}, cluster=${cluster.length}, cross=${crossCluster.length}, pillar="${pillarArticle?.title_it || 'none'}"`);

    // ═══════════════════════════════════════════════════
    // ARTICLE PARAMETERS
    // ═══════════════════════════════════════════════════

    const wordCounts = { short: 650, medium: 1200, long: 2200 };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1200;

    const toneGuide = {
      professional: 'professionale e autorevole, usa terminologia tecnica del settore affiliate',
      casual: 'diretto e amichevole come un collega esperto che condivide insider tips',
      technical: 'tecnico e preciso, approfondisci numeri, percentuali, configurazioni specifiche'
    }[tone || 'professional'];

    const formatGuide = {
      listicle: 'Lista numerata: ogni punto è un H2 con sottoparagrafi concreti. Es: "5 strategie che funzionano davvero"',
      howto: 'Step-by-step con <ol> per i passi. Ogni step spiegato con dettagli pratici. Adatto per HowTo schema.',
      review: 'Recensione strutturata: panoramica → funzionalità → pro/contro → verdetto finale in <blockquote>',
      comparison: 'Confronto con tabella HTML nella prima metà. Analisi pro/contro per ogni opzione.',
      news: 'Notizia con lead paragraph (chi/cosa/quando/perché) → dettagli → implicazioni per affiliati'
    }[content_format || 'howto'] || 'Struttura con H2 logici per un affiliato che vuole applicare subito';

    const intentGuide = {
      informational: 'Utente vuole capire un concetto. Inizia con definizione chiara, poi approfondisci con esempi pratici.',
      transactional: 'Utente pronto ad agire. Enfatizza benefici concreti, cifre reali, passi immediati.',
      commercial: 'Utente sta valutando opzioni. Includi tabella comparativa, pro/contro, raccomandazione chiara.',
      navigational: 'Utente cerca info specifiche. Sii diretto, nessuna intro prolissa.'
    }[search_intent || 'informational'];

    // ═══════════════════════════════════════════════════
    // TITLE FORMULA GUIDE (proven SEO patterns)
    // ═══════════════════════════════════════════════════
    const titleFormulas = `
FORMULE TITOLO PROVATE (scegli la più adatta):
- "Come [fare X]: Guida Completa per Affiliati Casino [Anno]"
- "[Numero] Strategie per [Risultato] come Affiliato iGaming"
- "CPA vs RevShare [Argomento]: Quale Conviene di Più?"
- "Come Guadagnare [Cifra] con [Metodo] nel [Settore]"
- "[Argomento] per Affiliati Casino: Tutto Quello che Devi Sapere"
- "I Migliori [Categoria] per Affiliati iGaming nel [Anno]"
REGOLA: keyword principale nelle prime 4 parole quando possibile. Max 62 caratteri.`;

    // ═══════════════════════════════════════════════════
    // SYSTEM PROMPT
    // ═══════════════════════════════════════════════════

    const systemPrompt = `SEI UN ESPERTO DI AFFILIATE MARKETING iGAMING con 8+ anni di esperienza diretta.
Scrivi per Revillion Partners (revillion-partners.com) — una rete di affiliazione casino di livello elite.

══════════════════════════════════════════════
🚨 AUDIENCE: CHI LEGGE QUESTI ARTICOLI
══════════════════════════════════════════════

Lettori = AFFILIATI (publisher, SEO, influencer, channel manager) che vogliono:
- Guadagnare commissioni CPA promuovendo casino online
- Imparare tecniche di marketing per il settore iGaming
- Scegliere il miglior programma di affiliazione
- Ottimizzare campagne e conversioni

NON sono giocatori. Non scrivere su come vincere, slot machines, strategie di gioco.

══════════════════════════════════════════════
🚫 COMPETITOR BAN ASSOLUTO
══════════════════════════════════════════════

NON menzionare MAI queste reti affiliate competitor:
Income Access, Bet365 Partners, GVC Affiliates, Kindred Affiliates, LeoVegas Partners,
888 Partners, Betsson Affiliates, William Hill Partners, Unibet Partners, PokerStars Affiliates,
Catena Media, Better Collective, Raketech, XLMedia, NordicBet, Gaming Innovation Group,
affiliaXe, Reflex Gaming, Gig Affiliates, MaxBounty, ClickBank (nel contesto iGaming)

Se devi fare un esempio generico di programma affiliati, usa formulazioni come:
"altri network del settore", "programmi concorrenti", "alternative sul mercato"

══════════════════════════════════════════════
📊 PARAMETRI ARTICOLO
══════════════════════════════════════════════

- LUNGHEZZA TARGET: ~${targetWords} parole (±10%, NON ignorare)
- TONO: ${toneGuide}
- FORMATO: ${formatGuide}
- INTENTO RICERCA: ${intentGuide}
- CATEGORIA: ${currentCategory}
${keywords ? `- KEYWORDS TARGET: ${keywords}` : ''}

══════════════════════════════════════════════
✍️ SCRIVI COME UN ESPERTO UMANO
══════════════════════════════════════════════

TECNICA UMANA:
✅ Prima persona: "nella mia esperienza", "ho testato", "consiglio sempre"
✅ Dati concreti: usa cifre realistiche (es: "CPA medio £80-140 per il mercato UK")
✅ Aneddoti di settore: "un affiliato che conosco ha triplicato le conversioni..."
✅ Opinioni schiette: "diciamoci la verità", "la verità scomoda è che..."
✅ Contraddici il senso comune: "Molti affiliati pensano che X, ma in realtà..."
✅ Varia lunghezza frasi — alcune brevi. Altre più elaborate e articolate.

EVITA SEGNALI AI:
❌ "In questo articolo scoprirai..."
❌ "Nel mondo dell'affiliate marketing..."
❌ Paragrafi tutti da 150 parole
❌ "In conclusione", "Pertanto", "Inoltre"
❌ Liste con più di 6 elementi

══════════════════════════════════════════════
🏆 SEO AVANZATO — POSIZIONE #1 + AI OVERVIEWS
══════════════════════════════════════════════

${titleFormulas}

REGOLE SEO CRITICHE:
✅ Keyword principale: titolo + definition paragraph + 1 H2 + ultima sezione
✅ MAX 3-4 ripetizioni keyword principale totali
✅ LSI keywords e sinonimi naturali (peso > ripetizioni)
✅ Ogni H2 contiene keyword secondaria o termine LSI
✅ FEATURED SNIPPET: primo paragrafo = definizione/risposta diretta (40-60 parole)

STRUCTURED DATA HINTS (guida la formattazione):
- Se howto: usa <ol> con passi chiari numerati
- Se comparison: tabella HTML nella prima metà
- Se review: <blockquote> per il verdetto finale
- Sempre: sezione FAQ in <h4>+<p> alla fine

══════════════════════════════════════════════
🏗️ SILO SEO — LINK BUILDING INTERNO
══════════════════════════════════════════════

STRUTTURA SILO:
Il blog è organizzato in CLUSTER TEMATICI (categorie). Ogni cluster ha:
- 1 ARTICOLO PILLAR (il più autorevole del cluster, più letto)
- N ARTICOLI CLUSTER (approfondiscono sottotopici del pillar)

REGOLE DI LINKING (OBBLIGATORIE):

1. LINK AL PILLAR (priorità massima):
${pillarArticle ? `   → PILLAR del tuo cluster: "${pillarArticle.title_it || pillarArticle.title_en}"
   → Slug: /blog/${pillarArticle.slug_it || pillarArticle.slug_en}
   → Inserisci SEMPRE un link a questo articolo (è il pillar del tuo cluster)
   → Posizionalo nella prima metà dell'articolo` : '   → Nessun articolo pillar trovato (questo sarà il primo pillar del cluster)'}

2. LINK CLUSTER (stesso tema, 2-3 link):
${clusterLinks.length > 0 ? clusterLinks.map((a: any) => `   [${a.category}] "${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : '   Nessun articolo cluster disponibile ancora.'}

3. LINK CROSS-CLUSTER (altri temi, 1-2 link per diversità tematica):
${crossCluster.length > 0 ? crossCluster.slice(0, 6).map((a: any) => `   [${a.category}] "${a.title_it || a.title_en}" → /blog/${a.slug_it || a.slug_en}`).join('\n') : '   Nessun articolo cross-cluster disponibile.'}

FORMATO LINK: <a href="/blog/{slug}">anchor text naturale e descrittivo</a>
ANCHOR TEXT: descrittivo e naturale (NO "clicca qui", "leggi qui", "questo articolo")
TOTALE LINK: 4-6 interni (pillar + 2-3 cluster + 1-2 cross-cluster)
DISTRIBUZIONE: intro → prima metà → seconda metà → conclusione

══════════════════════════════════════════════
📋 FAQ SCHEMA — GOOGLE RICH RESULTS
══════════════════════════════════════════════

FORMATO OBBLIGATORIO (il sistema estrae automaticamente per JSON-LD):
<h2>Domande Frequenti</h2>

<h4>Domanda scritta come un utente la cerca su Google?</h4>
<p>Risposta completa 40-80 parole, diretta, pronta per featured snippet.</p>

REGOLE:
- Ogni domanda DEVE finire con "?"
- Tag esatti: <h4> per domanda, <p> subito dopo per risposta
- 4-6 coppie
- Domande reali ("Quanto guadagna un affiliato casino?" non "Qual è il compenso?")

══════════════════════════════════════════════
🎯 CTA REVILLION (OBBLIGATORIA)
══════════════════════════════════════════════

Nella CONCLUSIONE (ultima sezione prima della FAQ), includi SEMPRE:
- Menzione naturale di Revillion Partners come esempio/soluzione
- Link esterno: <a href="https://dashboard.revillion.com/en/registration">iscriviti a Revillion Partners</a>
- Tono non pubblicitario — come un'informazione utile, non spam
- Esempio: "Se stai cercando un network che offra tutto questo, Revillion Partners è tra le
  opzioni più complete: <a href="https://dashboard.revillion.com/en/registration">scopri le commissioni</a>."

══════════════════════════════════════════════
🎨 FORMATTAZIONE HTML
══════════════════════════════════════════════

OBBLIGATORI:
- <h2> sezioni principali (4-7)
- <h3> sottosezioni dove logico
- <p> paragrafi
- <strong> concetti chiave (con parsimonia)
- <ul>/<ol> liste (max 5-6 elementi)
- <table> per confronti e dati
- <blockquote> per verdetti/citazioni importanti
- NO wrapper html/body/article — inizia direttamente col contenuto

SPAZIATURA: riga vuota tra sezioni H2, riga vuota tra paragrafi <p>`;

    const userPrompt = `Scrivi un articolo SEO per affiliati iGaming su: "${topic}"

Scrivi come un ESPERTO REALE dell'affiliate marketing casino, non come un AI.

CHECKLIST OBBLIGATORIA:
□ ~${targetWords} parole (±10%)
□ Definition paragraph 40-60 parole (featured snippet) come primo paragrafo
□ Almeno una tabella HTML dove pertinente
□ Link al PILLAR del cluster (se presente nell'elenco sopra)
□ 2-3 link cluster (stessa categoria)
□ 1-2 link cross-cluster (altra categoria)
□ CTA naturale a Revillion Partners nella conclusione
□ Sezione FAQ (4-6 coppie <h4>?</h4><p>risposta</p>)
□ Zero menzioni di competitor o reti affiliate concorrenti

TITOLO: usa una delle formule provate, keyword principale nelle prime 4 parole.`;

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
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_blog_post',
              description: 'Crea articolo blog SEO per affiliati iGaming con silo links e FAQ schema',
              parameters: {
                type: 'object',
                properties: {
                  title_it: {
                    type: 'string',
                    description: 'Titolo SEO (max 62 caratteri, keyword principale entro le prime 4 parole, usa formule provate)'
                  },
                  content_it: {
                    type: 'string',
                    description: 'Contenuto HTML completo. Deve includere: definition paragraph (40-60 parole), sezioni H2/H3, tabella dove pertinente, link interni silo (pillar + cluster + cross-cluster), CTA a Revillion Partners, sezione FAQ in formato <h4>?</h4><p>risposta</p>. NO wrapper html/body.'
                  },
                  meta_description_it: {
                    type: 'string',
                    description: 'Meta description (148-158 caratteri): keyword principale + benefit per affiliati + CTA'
                  },
                  slug: {
                    type: 'string',
                    description: 'Slug URL (max 55 caratteri, lowercase, trattini, no stopwords)'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Keywords: [principale, secondaria1, secondaria2, LSI1, LSI2, LSI3]'
                  },
                  faq_items: {
                    type: 'array',
                    description: '4-6 FAQ per JSON-LD FAQPage schema',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string', description: 'Domanda come la cerca un utente su Google (termina con ?)' },
                        answer: { type: 'string', description: 'Risposta 40-80 parole, self-contained, pronta per featured snippet' }
                      },
                      required: ['question', 'answer']
                    }
                  },
                  schema_type: {
                    type: 'string',
                    enum: ['Article', 'HowTo', 'Review', 'FAQPage'],
                    description: 'Schema.org type più appropriato'
                  },
                  estimated_word_count: {
                    type: 'number',
                    description: 'Conteggio parole stimato del contenuto generato'
                  },
                  silo_links_used: {
                    type: 'object',
                    description: 'Report dei link silo inseriti',
                    properties: {
                      pillar: { type: 'string', description: 'Slug del pillar linkato (o vuoto)' },
                      cluster_count: { type: 'number', description: 'Numero link cluster inseriti' },
                      cross_cluster_count: { type: 'number', description: 'Numero link cross-cluster inseriti' }
                    }
                  }
                },
                required: ['title_it', 'content_it', 'meta_description_it', 'slug', 'keywords', 'faq_items', 'schema_type'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_blog_post' } }
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
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const rawContent = aiData.choices?.[0]?.message?.content ?? '';

    let gen: any;

    if (toolCall && toolCall.function?.name === 'create_blog_post') {
      // Happy path: model used function calling
      gen = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: model returned plain text/JSON — try to extract JSON
      console.warn('No tool call returned. finish_reason:', aiData.choices?.[0]?.finish_reason, 'content length:', rawContent.length);
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Raw AI response (first 500 chars):', rawContent.slice(0, 500));
        throw new Error('Formato risposta AI non valido — nessun tool call né JSON trovato');
      }
      gen = JSON.parse(jsonMatch[0]);
      if (!gen.title_it || !gen.content_it) {
        throw new Error('Formato risposta AI non valido — campi obbligatori mancanti');
      }
    }

    // Validate
    const internalLinks = (gen.content_it.match(/<a\s+href=["']\/blog\/[^"']+["']/gi) || []).length;
    const externalRevillion = (gen.content_it.match(/revillion/gi) || []).length;
    console.log(`✅ Silo links: ${internalLinks} internal, Revillion mentions: ${externalRevillion}`);
    console.log(`✅ FAQ items: ${gen.faq_items?.length || 0}, Schema: ${gen.schema_type}, Words: ${gen.estimated_word_count}`);
    if (gen.silo_links_used) console.log(`✅ Silo report:`, gen.silo_links_used);

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
