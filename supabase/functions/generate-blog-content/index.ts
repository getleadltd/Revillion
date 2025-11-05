import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const systemPrompt = `Sei un esperto copywriter specializzato in contenuti per il settore iGaming e gambling online.

Il tuo compito è creare articoli di ALTA QUALITÀ che siano:
✅ UNICI e ORIGINALI (non copiare da altre fonti)
✅ OTTIMIZZATI SEO (usa keywords naturalmente, titoli H2/H3, meta description efficaci)
✅ DI VALORE per il lettore (informazioni pratiche, consigli actionable, esempi concreti)
✅ BEN STRUTTURATI (introduzione, sezioni chiare con H2, conclusione)
✅ COINVOLGENTI (mantieni il tono richiesto, evita contenuti generici)

STRUTTURA ARTICOLO:
- Titolo accattivante (60-70 caratteri, include keyword principale)
- Meta Description (140-160 caratteri, include CTA)
- Introduzione (100-150 parole, hook + panoramica)
- 3-5 sezioni principali con H2 (contenuto sostanzioso per ogni sezione)
- Sottosezioni con H3 dove appropriato
- Conclusione con riassunto o CTA
- Usa <p>, <strong>, <em>, liste <ul>/<ol> per formattazione HTML pulita

OTTIMIZZAZIONE SEO:
- Keyword principale nel titolo, primo paragrafo, almeno un H2
- Keywords secondarie distribuite naturalmente
- Evita keyword stuffing
- Frasi brevi e leggibili
- Lunghezza appropriata per il topic

SETTORE: ${category || 'gambling/casino online'}
TONO: ${toneGuide}
LUNGHEZZA TARGET: ${lengthGuide}

${keywords ? `KEYWORDS DA INCLUDERE NATURALMENTE: ${keywords}` : ''}

IMPORTANTE: Restituisci SOLO contenuto HTML ben formattato, senza wrapper esterni come <html> o <body>. Inizia direttamente con <h2> per la prima sezione.`;

    const userPrompt = `Crea un articolo completo in italiano sull'argomento: "${topic}"

L'articolo deve essere:
- Informativo e di valore per lettori italiani interessati a gambling/casino online
- Ottimizzato per SEO con le keywords fornite
- Ben strutturato con H2 e H3
- Scritto in HTML pulito (usa <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>)

Genera:
1. Un titolo accattivante (60-70 caratteri)
2. Una meta description efficace (140-160 caratteri con CTA)
3. Il contenuto HTML completo dell'articolo
4. Uno slug URL-friendly
5. Keywords rilevanti (se non fornite, suggeriscile tu)`;

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
