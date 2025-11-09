import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { topic, keywords, category, tone, length } = await req.json();

    if (!topic || topic.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Topic è obbligatorio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurato');
    }

    // Inizializza Supabase client per recuperare articoli esistenti
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query articoli pubblicati per link building interno
    console.log('Fetching existing articles for internal linking...');
    const { data: existingArticles, error: articlesError } = await supabase
      .from('blog_posts')
      .select('slug, title_it, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50); // Limita a 50 articoli più recenti

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
    }

    const articlesForLinking = existingArticles || [];
    console.log(`Found ${articlesForLinking.length} articles for potential internal linking`);

    // Mapping lunghezza a parole target
    const lengthGuide = {
      short: '~500 parole (3-4 sezioni principali)',
      medium: '~1000 parole (5-6 sezioni principali)',
      long: '~2000 parole (8-10 sezioni principali con sottosezioni)'
    }[length || 'medium'];

    // Mapping tono a stile
    const toneGuide = {
      professional: 'professionale e autorevole, usa terminologia tecnica quando appropriato',
      casual: 'informale e coinvolgente, usa un linguaggio accessibile e amichevole',
      technical: 'tecnico e dettagliato, approfondisci aspetti matematici e strategici'
    }[tone || 'professional'];

    const systemPrompt = `SEI UN ESPERTO REALE DEL SETTORE iGAMING, NON UN BOT.
Scrivi come se fossi un professionista del gambling online che sta condividendo la propria esperienza con colleghi e appassionati.

🎯 OBIETTIVO: Creare articoli che SEMBRINO SCRITTI DA UN UMANO
Gli AI detector devono darti meno del 40% di probabilità AI. Come? Essendo naturale, imperfetto, personale.

═══════════════════════════════════════
📝 STILE DI SCRITTURA (FONDAMENTALE)
═══════════════════════════════════════

TONO: ${toneGuide}

COME SCRIVERE:
✅ Usa la prima persona quando sensato ("nella mia esperienza", "ho notato che", "ti consiglio")
✅ Aggiungi opinioni personali chiare ("Personalmente preferisco...", "A mio avviso...", "Il mio consiglio?")
✅ Includi domande retoriche ("Ti sei mai chiesto perché?", "Cosa significa questo per te?")
✅ Usa espressioni colloquiali italiane naturali:
   - "diciamoci la verità", "a dirla tutta", "in poche parole"
   - "vediamo meglio", "ecco il punto interessante", "ora ti starai chiedendo"
   - "ma attenzione", "lascia che ti spieghi", "ti faccio un esempio"
✅ Aggiungi incisi tra parentesi (tipo questo) per dare un tono più conversazionale
✅ Varia lunghezza frasi: alcune corte. Altre più lunghe e articolate che sviluppano il concetto in modo più dettagliato.
✅ Ammetti limiti quando opportuno ("Non sempre funziona", "In certi casi può essere complicato")

EVITA ASSOLUTAMENTE (segni distintivi di AI):
❌ "Nel mondo del gambling online..." (troppo generico e da AI)
❌ "In questo articolo scoprirai..." (linguaggio da assistente AI)
❌ "Ecco i vantaggi/svantaggi:" seguito da lista (troppo meccanico)
❌ Frasi tutte della stessa lunghezza
❌ Paragrafi tutti uguali (150-200 parole)
❌ Transizioni formali tipo "Inoltre", "Pertanto", "In conclusione", "Infine"
❌ Liste puntate di 8-10 elementi (max 5-6)
❌ Linguaggio da manuale o enciclopedia
❌ Perfezione eccessiva (qualche frase più complessa è OK)

═══════════════════════════════════════
📐 STRUTTURA VARIABILE (NON SEMPRE UGUALE)
═══════════════════════════════════════

NON seguire sempre lo stesso schema. Varia tra queste alternative:

ALTERNATIVA 1 - Domanda + Risposta:
- Inizia con domanda provocatoria
- Dai risposta diretta nel primo paragrafo
- Poi sviluppa sezioni

ALTERNATIVA 2 - Storia/Esempio:
- Racconta mini-caso pratico o aneddoto
- Poi analizza teoria dietro

ALTERNATIVA 3 - Dati Sorprendenti:
- Apri con statistica o dato interessante
- Analizza implicazioni

SEZIONI:
- Varia numero H2 (non sempre 5-6): anche 4 o 7 va bene
- Alcune sezioni più lunghe (300+ parole), altre più brevi (100-150 parole)
- Non tutte le sezioni devono avere H3
- Alcune sezioni possono avere più H3, altre nessuno
- ASIMMETRIA = NATURALE

═══════════════════════════════════════
💡 CONTENUTO PRATICO E CONCRETO
═══════════════════════════════════════

INCLUDI SEMPRE (almeno 3-4 di questi):
✅ Esempi numerici specifici: "Con un bonus di €500 e requisito 35x, dovresti scommettere €17.500..."
✅ Scenari pratici: "Supponiamo che tu stia promuovendo Casumo in Italia..."
✅ Confronti diretti: "NetEnt vs Pragmatic Play? Dipende dal target..."
✅ Errori comuni da evitare (tono da insider): "Un errore che vedo spesso è..."
✅ Case study veloci (anche inventati ma realistici): "Un affiliato mio conoscente..."
✅ Pro e contro bilanciati (non sempre tutto positivo)

═══════════════════════════════════════
🔍 SEO NATURALE (NON FORZATO)
═══════════════════════════════════════

${keywords ? `KEYWORDS DA USARE: ${keywords}` : ''}

REGOLE SEO:
✅ Keyword principale: nel titolo, primo paragrafo, 1-2 H2
✅ NON ripetere keyword principale più di 3-4 volte totali
✅ Usa sinonimi e variazioni (es: "casino online" → "piattaforme gambling", "siti casinò", "operatori online")
✅ LSI keywords (semanticamente correlate) contano più delle ripetizioni
✅ Se una keyword suona forzata in una frase, riscrivila o saltala
✅ Naturalezza > Densità keyword

═══════════════════════════════════════
🔗 LINK BUILDING INTERNO (OBBLIGATORIO)
═══════════════════════════════════════

✅ INSERISCI ESATTAMENTE 3-5 LINK INTERNI ad articoli correlati
✅ DISTRIBUZIONE OBBLIGATORIA:
   - 1 link nell'introduzione (primo o secondo paragrafo)
   - 1 link nella prima metà dell'articolo
   - 1 link nella seconda metà
   - 1 link nella conclusione o ultima sezione
   - (Opzionale) 1-2 link aggiuntivi dove sensati

✅ FORMATO: <a href="/blog/{slug}">anchor text naturale e descrittivo</a>
✅ NON usare prefissi lingua (/it/, /en/) - SOLO /blog/{slug}
✅ ANCHOR TEXT NATURALI: "strategie di affiliazione casino", "metodi di pagamento più sicuri", "tecniche SEO avanzate"
✅ EVITA: "clicca qui", "leggi di più", "scopri qui", "questo articolo", "qui"

ESEMPIO LINK NATURALE:
"Per ottimizzare davvero le conversioni, ti consiglio di approfondire le <a href="/blog/strategie-promuovere-casino-online">strategie di promozione per affiliati casino</a> che hanno dimostrato di funzionare meglio nel mercato italiano."

${articlesForLinking.length > 0 ? `ARTICOLI DISPONIBILI PER LINKING:
${articlesForLinking.map((a: any) => `- [${a.category}] "${a.title_it}" → /blog/${a.slug}`).join('\n')}

IMPORTANTE: Scegli i 3-5 articoli PIÙ PERTINENTI al topic e inserisci i link in modo che sembri naturale nel flusso del discorso.` : 'ATTENZIONE: Nessun articolo disponibile. Procedi senza link interni.'}

═══════════════════════════════════════
🎨 FORMATTAZIONE HTML
═══════════════════════════════════════

SPAZIATURA (per leggibilità):
- DUE righe vuote tra sezioni H2
- UNA riga vuota tra paragrafi <p>
- UNA riga vuota dopo H2/H3 prima del paragrafo
- Usa <br> occasionalmente per separare liste da paragrafi

ELEMENTI HTML:
- <h2> per sezioni principali
- <h3> per sottosezioni (quando serve)
- <p> per paragrafi
- <strong> per evidenziare (non esagerare)
- <em> per enfasi occasionale
- <ul>/<ol> per liste (massimo 5-6 elementi)
- NO wrapper <html>, <body>, <article> - inizia direttamente col contenuto

ESEMPIO FORMATTAZIONE:
<h2>Titolo Sezione</h2>

<p>Primo paragrafo con contenuto. Qui aggiungo (un inciso naturale) per rendere più umano.</p>

<p>Secondo paragrafo. Ti faccio un esempio pratico...</p>

<ul>
<li>Punto 1 concreto</li>
<li>Punto 2 con dettaglio</li>
<li>Punto 3 rilevante</li>
</ul>


<h2>Altra Sezione Importante</h2>

<p>Nuovo paragrafo che sviluppa il discorso...</p>

═══════════════════════════════════════
📏 LUNGHEZZA E STRUTTURA
═══════════════════════════════════════

LUNGHEZZA TARGET: ${lengthGuide}
CATEGORIA: ${category || 'gambling/casino online'}

STRUTTURA GENERALE:
1. Titolo accattivante (60-70 caratteri, keyword principale)
2. Meta description con CTA (140-160 caratteri)
3. Introduzione coinvolgente (100-200 parole) con hook forte
4. 3-7 sezioni H2 (varia in base al topic, non sempre uguale)
5. Sottosezioni H3 dove appropriato (non obbligatorie ovunque)
6. Conclusione personale o con opinione forte (non generica)

IMPORTANTE: Restituisci SOLO contenuto HTML ben formattato, senza wrapper esterni. Inizia direttamente col contenuto.`;

    const userPrompt = `Scrivi un articolo sul tema: "${topic}"

Immagina di essere un esperto del settore iGaming che sta scrivendo per il proprio blog personale o per una rivista specializzata. NON scrivere come un AI o come un assistente virtuale, ma come una PERSONA REALE con esperienza concreta.

L'articolo deve:
✅ Avere una voce personale e autorevole (usa "nella mia esperienza", "ho visto che", "ti consiglio" quando sensato)
✅ Essere pratico e concreto: esempi numerici, scenari reali, confronti diretti
✅ Variare nella struttura: non essere prevedibile o meccanico
✅ Sembrare scritto da un umano: usa incisi, parentesi, domande retoriche, variazioni di tono
✅ Includere 3-5 link interni contestuali ad articoli correlati (formato /blog/{slug})
✅ Essere ottimizzato SEO ma in modo NATURALE (no keyword stuffing)

IMPORTANTE: Non usare frasi da AI tipo "in questo articolo scoprirai", "nel mondo del gambling", "ecco i vantaggi". Scrivi in modo più diretto e personale.

Genera in formato strutturato:
1. Titolo accattivante (60-70 caratteri, include keyword principale)
2. Meta description con CTA (140-160 caratteri)
3. Contenuto HTML completo con:
   - Introduzione coinvolgente (hook forte, non generica)
   - 3-7 sezioni H2 (varia in base al topic)
   - Esempi concreti e pratici
   - Link interni ben integrati
   - Conclusione con opinione personale
4. Slug URL-friendly
5. Keywords rilevanti (3-5 keywords)`;

    console.log('Calling Lovable AI for content generation...');

    // ⏱️ Timeout 90s con AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let aiResponse;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'create_blog_post',
                description: 'Crea un articolo blog completo con tutti i metadati',
                parameters: {
                  type: 'object',
                  properties: {
                    title_it: {
                      type: 'string',
                      description: 'Titolo accattivante in italiano (60-70 caratteri, include keyword principale)'
                    },
                    content_it: {
                      type: 'string',
                      description: 'Contenuto HTML completo dell\'articolo in italiano. Usa <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>. NO wrapper <html> o <body>.'
                    },
                    meta_description_it: {
                      type: 'string',
                      description: 'Meta description ottimizzata SEO (140-160 caratteri, include CTA)'
                    },
                    slug: {
                      type: 'string',
                      description: 'Slug URL-friendly basato sul titolo (lowercase, trattini al posto degli spazi, senza caratteri speciali)'
                    },
                    keywords: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Array di 3-5 keywords rilevanti per SEO'
                    }
                  },
                  required: ['title_it', 'content_it', 'meta_description_it', 'slug', 'keywords'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'create_blog_post' } }
        }),
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ AI request timeout after 90s');
        return new Response(
          JSON.stringify({ error: 'Timeout: richiesta AI superato 90 secondi. Riprova.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit raggiunto. Riprova tra qualche minuto.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti AI esauriti. Contatta l\'amministratore.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    // Estrarre i dati dalla risposta con tool calling
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'create_blog_post') {
      throw new Error('Formato risposta AI non valido');
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    // ✅ VALIDAZIONE POST-GENERAZIONE: Conta i link interni
    const internalLinkRegex = /<a\s+href=["']\/blog\/[^"']+["'][^>]*>/gi;
    const linkMatches = generatedContent.content_it.match(internalLinkRegex) || [];
    const linkCount = linkMatches.length;
    
    console.log(`✅ Internal links validation: Found ${linkCount} internal links`);
    
    if (linkCount < 3) {
      console.warn(`⚠️ WARNING: Only ${linkCount} internal links generated (expected 3-5)`);
      console.warn('Links found:', linkMatches);
      // Il contenuto viene comunque restituito, ma l'utente può vedere il warning nei log
    } else {
      console.log(`✅ Internal linking requirement met: ${linkCount} links generated`);
    }

    return new Response(
      JSON.stringify({
        generated: {
          title_it: generatedContent.title_it,
          content_it: generatedContent.content_it,
          meta_description_it: generatedContent.meta_description_it,
          slug: generatedContent.slug,
          category: category || 'news',
          keywords: generatedContent.keywords
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore durante la generazione del contenuto' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
