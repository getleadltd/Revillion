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

COME SCRIVERE (CRITICO PER SEMBRARE UMANO):
✅ Usa la PRIMA PERSONA liberamente: "nella mia esperienza", "ho notato che", "ti consiglio", "secondo me"
✅ Esprimi OPINIONI FORTI e personali: "Personalmente preferisco X perché Y, punto.", "A mio avviso Z è sopravvalutato"
✅ Includi domande retoriche frequenti: "Ti sei mai chiesto perché?", "E sai qual è il bello?", "Indovina un po'?"
✅ Usa espressioni colloquiali italiane (FONDAMENTALE):
   - "diciamoci la verità", "a dirla tutta", "in poche parole", "roba da pazzi"
   - "vediamo meglio", "ecco il punto", "ora ti starai chiedendo", "lascia che ti spieghi"
   - "ma attenzione", "ti faccio un esempio", "non so te, ma io...", "beh", "tipo"
✅ Aggiungi incisi tra parentesi (tipo questo—che spezza il ritmo e rende tutto più naturale) frequentemente
✅ Varia DRASTICAMENTE lunghezza frasi: alcune cortissime. Tipo questa. Altre molto più lunghe e articolate, con subordinate che si intrecciano e sviluppano il concetto in profondità prima di chiudere con un punto.
✅ Ammetti limiti, dubbi, incertezze: "Non sempre funziona", "Potrebbe non essere per tutti", "Non sono sicuro al 100% ma...", "Forse mi sbaglio ma..."
✅ Usa punteggiatura variabile: virgole, punti e virgola; trattini—come questo—e tre punti quando serve...
✅ Ogni tanto fai mini-digressioni che sembrano tangenziali (ma poi le ricolleghi)
✅ Contraddici leggermente te stesso: "All'inizio pensavo X, ma poi ho capito che..."

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
🧬 IMPERFEZIONI UMANE (ESSENZIALI!)
═══════════════════════════════════════

Per sembrare DAVVERO umano, il testo NON deve essere perfetto. Gli umani:
✅ Ripetono occasionalmente concetti (riformulandoli diversamente)
✅ Usano punteggiatura variabile: a volte virgole, a volte no; punti e virgola qua e là
✅ Fanno mini-digressioni tra parentesi (come questa, che aggiunge un pensiero laterale)
✅ Ammettono dubbi o incertezze: "Non sono sicuro al 100%", "Potrebbe anche darsi che...", "Secondo me..."
✅ Si contraddicono leggermente o presentano punti di vista multipli: "Da un lato X, ma dall'altro Y"
✅ Usano formattazione inconsistente: a volte grassetto per enfasi, a volte no anche per concetti simili
✅ Includono frasi più complesse e subordinate che si intrecciano tra loro, alternate a frasi brevissime
✅ Esprimono opinioni forti senza giustificarle sempre: "Secondo me è la scelta migliore, punto."

🚨 TRIGGER CHE SEGNALANO AI (DA EVITARE COME LA PESTE):
❌ Paragrafi TUTTI della stessa lunghezza (150-180 parole) → Varia: 80, 200, 120, 250
❌ Liste di ESATTAMENTE 5 o 10 elementi → Usa 3, 4, 6, 7 elementi
❌ Transizioni TROPPO PULITE tra sezioni → A volte salta direttamente al punto
❌ ZERO contraddizioni o dubbi espressi → Ammetti limiti, incertezze
❌ Linguaggio TROPPO NEUTRO e bilanciato → Esprimi preferenze forti
❌ ASSENZA di opinioni personali → Usa "Io preferisco", "Secondo me"
❌ Ogni sezione ha SEMPRE sottosezioni H3 → Alcune sezioni senza H3 vanno bene
❌ Uso eccessivo di emoji o simboli → Usa con parsimonia

ESEMPI PRIMA/DOPO (STUDIARE ATTENTAMENTE):

❌ AI: "Le slot machine online funzionano tramite generatori di numeri casuali (RNG), garantendo risultati equi e imprevedibili."
✅ UMANO: "Ok, le slot online funzionano con gli RNG (quei generatori di numeri casuali di cui parlano tutti). Ma diciamoci la verità: quanti giocatori sanno DAVVERO cosa significa? Pochi."

❌ AI: "I bonus di benvenuto offrono vantaggi competitivi significativi agli operatori."
✅ UMANO: "I bonus di benvenuto? Beh, possono essere una manna dal cielo (se sai come sfruttarli), ma attenzione: molti hanno requisiti di scommessa assurdi. Tipo 50x o più. Roba da pazzi."

❌ AI: "Per ottimizzare le conversioni, è consigliabile implementare strategie di marketing mirate."
✅ UMANO: "Se vuoi davvero aumentare le conversioni, lascia perdere le strategie generiche. Concentrati sul traffico di qualità—meglio 100 visite targetizzate che 10.000 visitatori a caso che rimbalzano via dopo 3 secondi."

❌ AI: "Esistono numerose piattaforme di affiliazione disponibili sul mercato."
✅ UMANO: "Ci sono tipo centinaia di network di affiliazione là fuori. Alcuni sono ottimi (tipo CasinoGrounds o PartnerMatrix), altri... beh, meglio lasciar perdere. Non faccio nomi, ma sai di cosa parlo."

❌ AI: "La SEO per siti di gambling richiede un approccio strategico e metodico."
✅ UMANO: "Fare SEO nel gambling è una rottura di scatole (lo dico senza peli sulla lingua). Google ti penalizza, la concorrenza è spietata, e devi competere con siti che hanno budget da milioni. Ma si può fare—ci vuole pazienza e testa."

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

Immagina di essere un esperto del settore iGaming che sta scrivendo per il proprio blog personale—NON un AI, NON un assistente virtuale, ma una PERSONA REALE con esperienze, opinioni forti, e un modo di scrivere imperfetto ma autentico.

L'articolo DEVE:
✅ Avere una voce personale e diretta: usa "nella mia esperienza", "ho visto", "ti dico una cosa", "secondo me" LIBERAMENTE
✅ Essere pratico e concreto: numeri, scenari reali, esempi specifici, confronti senza filtri
✅ Variare nella struttura: NON essere prevedibile, meccanico o simmetrico
✅ Sembrare scritto da un umano con IMPERFEZIONI: incisi, parentesi, domande, variazioni di tono, ammissioni di dubbio, contraddizioni leggere
✅ Includere 3-5 link interni contestuali ben integrati (formato /blog/{slug})
✅ Essere ottimizzato SEO ma in modo NATURALE (keyword density < 2%, usa sinonimi)
✅ Esprimere OPINIONI FORTI: "Preferisco X", "Y è sopravvalutato", "Secondo me Z non funziona"

VIETATO ASSOLUTAMENTE:
❌ "In questo articolo scoprirai" / "Nel mondo del gambling" / "Ecco i vantaggi"
❌ Paragrafi tutti della stessa lunghezza (150-180 parole)
❌ Transizioni meccaniche: "Inoltre", "Pertanto", "In conclusione"
❌ Liste di 5 o 10 elementi esatti (varia: 3, 4, 6, 7)
❌ Linguaggio troppo neutro, bilanciato, enciclopedico
❌ Perfezione eccessiva—gli umani fanno digressioni, ripetono concetti, si contraddicono

Genera in formato strutturato:
1. Titolo accattivante (60-70 caratteri, include keyword principale)
2. Meta description con CTA (140-160 caratteri)
3. Contenuto HTML completo con:
   - Introduzione coinvolgente (hook forte, opinione personale, NON generica)
   - 3-7 sezioni H2 (varia in base al topic—non sempre 5!)
   - Esempi concreti con numeri e scenari
   - Link interni ben integrati (3-5 link distribuiti bene)
   - Conclusione con opinione forte o call-to-action personale
4. Slug URL-friendly
5. Keywords rilevanti (3-5 keywords)

RICORDA: L'obiettivo è che un AI detector dia MENO del 40% di probabilità AI. Sii umano, imperfetto, opinionato.`;

    console.log('Calling Lovable AI for content generation...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
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
