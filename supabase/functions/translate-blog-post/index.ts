import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPPORTED_LANGUAGES = ['en', 'de', 'it', 'pt', 'es'] as const;
type Language = typeof SUPPORTED_LANGUAGES[number];

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'inglese',
  de: 'tedesco',
  it: 'italiano',
  pt: 'portoghese',
  es: 'spagnolo',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, meta_description, source_language = 'it' } = await req.json();
    
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "title e content sono obbligatori" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate source language
    const sourceLang = SUPPORTED_LANGUAGES.includes(source_language) ? source_language : 'it';
    const targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang !== sourceLang);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurata");
    }

    console.log(`Inizio traduzione da ${LANGUAGE_NAMES[sourceLang]} verso: ${targetLanguages.join(', ')}`);
    console.log(`Titolo sorgente: ${title}`);

    const sourceLanguageName = LANGUAGE_NAMES[sourceLang];
    const targetLanguagesList = targetLanguages.map(lang => LANGUAGE_NAMES[lang]).join(', ');

    const systemPrompt = `Sei un traduttore professionista specializzato in contenuti per il settore iGaming e gambling online. 
Traduci il seguente contenuto da ${sourceLanguageName} verso ${targetLanguagesList}.

IMPORTANTE:
- Mantieni ESATTAMENTE la stessa formattazione HTML nel contenuto
- Usa terminologia appropriata per il settore gambling/casino
- Le traduzioni devono essere naturali e idiomatiche, non letterali
- Mantieni lo stesso tono professionale e coinvolgente
- Preserva tutti i tag HTML (<h2>, <p>, <strong>, ecc.)`;

    const userPrompt = `Traduci questi contenuti da ${sourceLanguageName}:

TITOLO: ${title}

CONTENUTO: ${content}

META DESCRIPTION: ${meta_description || ""}`;

    // Build dynamic translation schema based on target languages
    const translationProperties: Record<string, any> = {};
    for (const lang of targetLanguages) {
      translationProperties[lang] = {
        type: "object",
        properties: {
          title: { type: "string", description: `Titolo tradotto in ${LANGUAGE_NAMES[lang]}` },
          content: { type: "string", description: `Contenuto HTML tradotto in ${LANGUAGE_NAMES[lang]}` },
          meta_description: { type: "string", description: `Meta description tradotta in ${LANGUAGE_NAMES[lang]}` }
        },
        required: ["title", "content", "meta_description"]
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_translations",
              description: `Restituisce le traduzioni del contenuto del blog in ${targetLanguages.length} lingue`,
              parameters: {
                type: "object",
                properties: {
                  translations: {
                    type: "object",
                    properties: translationProperties,
                    required: targetLanguages
                  }
                },
                required: ["translations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_translations" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore AI Gateway:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite di richieste superato. Riprova tra qualche minuto." }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti Lovable AI esauriti. Contatta l'amministratore." }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Risposta AI ricevuta:", JSON.stringify(data).substring(0, 200));

    // Estrai le traduzioni dalla risposta tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error("Formato risposta AI non valido");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Add source language info to result
    result.source_language = sourceLang;
    
    console.log(`Traduzioni completate: ${Object.keys(result.translations || {}).join(', ')}`);

    return new Response(
      JSON.stringify(result), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Errore in translate-blog-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
