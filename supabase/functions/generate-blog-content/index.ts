import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyAdmin(req: Request): Promise<{ error?: Response; userId?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }
  const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (roleError || !isAdmin) {
    return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  }
  return { userId: user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error) return authResult.error;

    const { topic, keywords, category, tone, length, search_intent, content_format } = await req.json();

    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: 'Topic è obbligatorio' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY non configurato');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent articles for internal linking
    const { data: existingArticles } = await supabase
      .from('blog_posts')
      .select('slug_it, slug_en, title_it, title_en, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(60);

    const articlesForLinking = existingArticles || [];

    // Target word counts per length
    const wordCounts = { short: 600, medium: 1100, long: 2000 };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1100;

    // Tone guide
    const toneGuide = {
      professional: 'professionale e autorevole, usa terminologia tecnica del settore',
      casual: 'informale e coinvolgente, diretto e amichevole, parla come un insider del gambling',
      technical: 'tecnico e dettagliato, approfondisci matematica, probabilità, statistiche'
    }[tone || 'professional'];

    // Content format guide
    const formatGuide = {
      listicle: 'Struttura come lista numerata dei punti principali con H2 per ogni punto',
      howto: 'Struttura come guida step-by-step con passi chiari e numerati',
      review: 'Struttura come recensione con pro/contro, valutazione e verdetto finale',
      comparison: 'Struttura come confronto diretto con tabella HTML comparativa',
      news: 'Struttura come articolo di notizia con le informazioni più importanti prima'
    }[content_format || 'guides'] || 'Struttura con sezioni H2 logiche e fluide';

    // Search intent guide
    const intentGuide = {
      informational: 'L\'utente vuole capire qualcosa. Spiega in modo chiaro ed esaustivo. Includi definizioni e contesto.',
      transactional: 'L\'utente vuole agire. Includi CTA chiare, link all\'azione, benefici concreti.',
      commercial: 'L\'utente sta valutando opzioni. Includi confronti, pro/contro, raccomandazioni chiare.',
      navigational: 'L\'utente cerca informazioni specifiche. Sii diretto e preciso.'
    }[search_intent || 'informational'];

    const systemPrompt = `SEI UN ESPERTO REALE DEL SETTORE iGAMING. Scrivi come un professionista del gambling online con anni di esperienza pratica.

🎯 OBIETTIVO PRIMARIO: Articolo che conquisti la POSIZIONE #1 su Google e compaia nelle AI Overviews di ChatGPT/Gemini/Perplexity.

════════════════════════════════════════
📊 PARAMETRI ARTICOLO
════════════════════════════════════════
- LUNGHEZZA TARGET: esattamente ~${targetWords} parole (RISPETTA questo numero)
- TONO: ${toneGuide}
- FORMATO: ${formatGuide}
- INTENTO DI RICERCA: ${intentGuide}
- CATEGORIA: ${category || 'casino/gambling'}

════════════════════════════════════════
✍️ STILE: SCRIVI COME UN UMANO ESPERTO
════════════════════════════════════════

USA queste tecniche per sembrare umano (non AI):
✅ Prima persona: "nella mia esperienza", "ho notato", "ti consiglio"
✅ Opinioni dirette: "Personalmente ritengo che...", "Il mio consiglio?"
✅ Espressioni italiane naturali: "diciamoci la verità", "a dirla tutta", "lascia che ti spieghi"
✅ Domande retoriche: "Ti sei mai chiesto perché?", "E allora?"
✅ Incisi tra parentesi (come questo)
✅ Frasi di lunghezza variabile: alcune corte. Altre più elaborate.
✅ Ammetti i limiti: "Non sempre funziona così", "Dipende dal caso"

EVITA (segni di AI):
❌ "Nel mondo del gambling...", "In questo articolo scoprirai..."
❌ Paragrafi tutti uguali (150 parole ciascuno)
❌ Transizioni formali: "Inoltre", "Pertanto", "In conclusione"
❌ Liste di 8-10 elementi (max 5-6)
❌ Eccessiva perfezione grammaticale

════════════════════════════════════════
🏆 SEO DI LIVELLO PROFESSIONALE
════════════════════════════════════════

${keywords ? `KEYWORDS TARGET: ${keywords}` : ''}

REGOLE SEO (critica):
✅ Keyword principale: titolo + primo paragrafo + 1 H2 + ultima sezione
✅ MAX 3-4 ripetizioni della keyword principale (no stuffing)
✅ LSI keywords e sinonimi naturali (più importanti delle ripetizioni)
✅ FEATURED SNIPPET: inizia con un paragrafo definitivo di 40-60 parole che risponde direttamente alla query
✅ PAA (People Also Ask): considera le domande correlate che gli utenti fanno su Google
✅ HEADING HIERARCHY: H1 implicito nel titolo → H2 per sezioni → H3 per sottosezioni
✅ OGNI H2 deve includere una keyword secondaria o semanticamente correlata

STRUTTURA PER FEATURED SNIPPET (obbligatoria):
- Primo paragrafo dopo introduzione: risposta breve e diretta (40-60 parole)
- Usa almeno UNA tabella HTML dove ha senso (confronti, dati, esempi)
- Per guide: usa <ol> con passi numerati
- Per recensioni: includi un "verdetto" in <blockquote> o <strong>

════════════════════════════════════════
📋 FAQ SCHEMA (OBBLIGATORIO - fondamentale per SEO)
════════════════════════════════════════

Genera ESATTAMENTE 4-6 domande FAQ pertinenti al topic.
Queste verranno usate per:
1. Sezione FAQ visibile nell'articolo
2. JSON-LD FAQ Schema markup automatico (aumenta visibilità su Google)
3. Risponde alle "People Also Ask" di Google

FORMATO HTML OBBLIGATORIO PER LA SEZIONE FAQ (sistema lo legge automaticamente):
<h2>Domande Frequenti</h2>

<h4>La domanda va qui, scritta come la farebbe un utente su Google?</h4>
<p>La risposta va qui, 40-80 parole, diretta e completa, pronta per featured snippet.</p>

<h4>Seconda domanda pertinente?</h4>
<p>Seconda risposta...</p>

REGOLE CRITICHE:
- Ogni domanda DEVE terminare con "?"
- Ogni domanda è in <h4> (non <h3>, non <strong>, solo <h4>)
- Ogni risposta è in <p> subito dopo l'<h4>
- 4-6 coppie domanda/risposta
- Domande come utenti reali cercano su Google (es: "Quanto guadagna un affiliato casino?" non "Qual è il guadagno?")

════════════════════════════════════════
🔗 LINK BUILDING INTERNO (OBBLIGATORIO)
════════════════════════════════════════

✅ INSERISCI 3-5 link interni contestuali
✅ DISTRIBUZIONE: intro + prima metà + seconda metà + conclusione
✅ FORMATO: <a href="/blog/{slug}">anchor text naturale descrittivo</a>
✅ USA slug_it o slug_en dall'elenco sotto
✅ ANCHOR TEXT descrittivi (no "clicca qui", "leggi di più")

${articlesForLinking.length > 0 ? `ARTICOLI DISPONIBILI:
${articlesForLinking.map((a: any) => `- [${a.category}] "${a.title_it || a.title_en}" → slug_it: ${a.slug_it || a.slug_en || ''}`).join('\n')}` : 'Nessun articolo disponibile per linking.'}

════════════════════════════════════════
🎨 FORMATTAZIONE HTML
════════════════════════════════════════

ELEMENTI OBBLIGATORI:
- <h2> per sezioni principali (4-7 sezioni)
- <h3> per sottosezioni quando appropriato
- <p> per paragrafi
- <strong> per concetti chiave (non esagerare)
- <ul>/<ol> per liste (max 5-6 elementi)
- <table> dove c'è un confronto da fare (struttura dati)
- <blockquote> per citazioni o verdetti importanti
- NO wrapper html/body/article

TABELLA ESEMPIO (quando pertinente):
<table>
<thead><tr><th>Elemento</th><th>Dettaglio</th></tr></thead>
<tbody>
<tr><td>Valore 1</td><td>Descrizione 1</td></tr>
</tbody>
</table>

Spaziatura:
- Riga vuota tra sezioni H2
- Riga vuota tra paragrafi <p>`;

    const userPrompt = `Scrivi un articolo SEO-ottimizzato su: "${topic}"

Scrivi come un ESPERTO REALE del settore iGaming con esperienza concreta, non come un AI.

REQUISITI ESSENZIALI:
1. ~${targetWords} parole di contenuto (rispetta il conteggio)
2. Inizia con un "definition paragraph" di 40-60 parole (ottimizzato per featured snippet)
3. Includi almeno una tabella HTML dove pertinente
4. 3-5 link interni contestuali al flusso del discorso
5. Sezione FAQ finale con 4-6 domande/risposte (per FAQ schema JSON-LD)
6. Termina con una conclusione con CTA verso Revillion Partners

IMPORTANTE per la FAQ: Genera domande come le farebbe un utente reale su Google.
Ogni risposta FAQ deve essere self-contained (40-80 parole), pronta per featured snippet.`;

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
              description: 'Crea articolo blog SEO-ottimizzato con FAQ schema',
              parameters: {
                type: 'object',
                properties: {
                  title_it: {
                    type: 'string',
                    description: 'Titolo SEO ottimizzato (55-65 caratteri, keyword principale all\'inizio se possibile)'
                  },
                  content_it: {
                    type: 'string',
                    description: 'Contenuto HTML completo. Deve includere: definition paragraph, sezioni H2/H3, almeno una tabella HTML dove pertinente, link interni, sezione FAQ con domande/risposte in HTML. NO wrapper html/body.'
                  },
                  meta_description_it: {
                    type: 'string',
                    description: 'Meta description ottimizzata (145-158 caratteri) con keyword principale e CTA'
                  },
                  slug: {
                    type: 'string',
                    description: 'Slug URL-friendly (lowercase, trattini, no caratteri speciali, max 60 caratteri)'
                  },
                  keywords: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '4-6 keywords: prima la principale, poi secondarie, poi LSI'
                  },
                  faq_items: {
                    type: 'array',
                    description: '4-6 FAQ per JSON-LD schema markup (People Also Ask)',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string', description: 'Domanda come la farebbe un utente reale su Google' },
                        answer: { type: 'string', description: 'Risposta completa 40-80 parole, pronta per featured snippet' }
                      },
                      required: ['question', 'answer']
                    }
                  },
                  schema_type: {
                    type: 'string',
                    enum: ['Article', 'HowTo', 'Review', 'FAQPage'],
                    description: 'Schema.org type più appropriato per questo contenuto'
                  },
                  estimated_word_count: {
                    type: 'number',
                    description: 'Stima del conteggio parole del contenuto generato'
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
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'Rate limit raggiunto. Riprova tra qualche minuto.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'Crediti AI esauriti.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'create_blog_post') {
      throw new Error('Formato risposta AI non valido');
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    // Validate internal links
    const linkMatches = (generatedContent.content_it.match(/<a\s+href=["']\/blog\/[^"']+["']/gi) || []);
    console.log(`✅ Internal links: ${linkMatches.length}`);
    console.log(`✅ FAQ items: ${generatedContent.faq_items?.length || 0}`);
    console.log(`✅ Schema type: ${generatedContent.schema_type}`);
    console.log(`✅ Estimated words: ${generatedContent.estimated_word_count}`);

    return new Response(
      JSON.stringify({
        generated: {
          title_it: generatedContent.title_it,
          content_it: generatedContent.content_it,
          meta_description_it: generatedContent.meta_description_it,
          slug: generatedContent.slug,
          category: category || 'news',
          keywords: generatedContent.keywords,
          faq_items: generatedContent.faq_items || [],
          schema_type: generatedContent.schema_type || 'Article',
          estimated_word_count: generatedContent.estimated_word_count,
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
