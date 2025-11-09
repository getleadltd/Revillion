import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title_it, content_it, meta_description_it } = await req.json();
    
    if (!title_it || !content_it) {
      return new Response(
        JSON.stringify({ error: "title_it e content_it sono obbligatori" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurata");
    }

    console.log("Inizio traduzione da italiano per:", title_it);

    const systemPrompt = `Sei un traduttore professionista specializzato in contenuti per il settore iGaming e gambling online. 
Traduci il seguente contenuto dall'italiano verso inglese, tedesco, spagnolo e portoghese.

IMPORTANTE:
- Mantieni ESATTAMENTE la stessa formattazione HTML nel contenuto
- Usa terminologia appropriata per il settore gambling/casino
- Le traduzioni devono essere naturali e idiomatiche, non letterali
- Mantieni lo stesso tono professionale e coinvolgente
- Preserva tutti i tag HTML (<h2>, <p>, <strong>, ecc.)`;

    const userPrompt = `Traduci questi contenuti dall'italiano:

TITOLO: ${title_it}

CONTENUTO: ${content_it}

META DESCRIPTION: ${meta_description_it || ""}`;

    // ⏱️ Timeout 90s con AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
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
                description: "Restituisce le traduzioni del contenuto del blog in 4 lingue",
                parameters: {
                  type: "object",
                  properties: {
                    translations: {
                      type: "object",
                      properties: {
                        en: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Titolo tradotto in inglese" },
                            content: { type: "string", description: "Contenuto HTML tradotto in inglese" },
                            meta_description: { type: "string", description: "Meta description tradotta in inglese" }
                          },
                          required: ["title", "content", "meta_description"]
                        },
                        de: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Titolo tradotto in tedesco" },
                            content: { type: "string", description: "Contenuto HTML tradotto in tedesco" },
                            meta_description: { type: "string", description: "Meta description tradotta in tedesco" }
                          },
                          required: ["title", "content", "meta_description"]
                        },
                        es: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Titolo tradotto in spagnolo" },
                            content: { type: "string", description: "Contenuto HTML tradotto in spagnolo" },
                            meta_description: { type: "string", description: "Meta description tradotta in spagnolo" }
                          },
                          required: ["title", "content", "meta_description"]
                        },
                        pt: {
                          type: "object",
                          properties: {
                            title: { type: "string", description: "Titolo tradotto in portoghese" },
                            content: { type: "string", description: "Contenuto HTML tradotto in portoghese" },
                            meta_description: { type: "string", description: "Meta description tradotta in portoghese" }
                          },
                          required: ["title", "content", "meta_description"]
                        }
                      },
                      required: ["en", "de", "es", "pt"]
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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ Translation request timeout after 90s');
        return new Response(
          JSON.stringify({ error: 'Timeout: richiesta traduzione superato 90 secondi. Riprova.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

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

    const translations = JSON.parse(toolCall.function.arguments);
    console.log("Traduzioni completate con successo");

    return new Response(
      JSON.stringify(translations), 
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
