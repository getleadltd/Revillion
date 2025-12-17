import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

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

// Helper function to verify admin authentication
async function verifyAdmin(req: Request): Promise<{ error?: Response; userId?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  // Check admin role via RPC
  const { data: isAdmin, error: roleError } = await supabase
    .rpc('has_role', { _user_id: user.id, _role: 'admin' });

  if (roleError || !isAdmin) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { userId: user.id };
}

// Translate to a single language with retry logic
async function translateToLanguage(
  title: string,
  content: string,
  metaDescription: string,
  sourceLang: Language,
  targetLang: Language,
  apiKey: string
): Promise<{ title: string; content: string; meta_description: string } | null> {
  const maxAttempts = 3;
  let attempts = 0;

  const sourceLanguageName = LANGUAGE_NAMES[sourceLang];
  const targetLanguageName = LANGUAGE_NAMES[targetLang];

  const systemPrompt = `Sei un traduttore professionista specializzato in contenuti per il settore iGaming e gambling online. 
Traduci il seguente contenuto da ${sourceLanguageName} a ${targetLanguageName}.

IMPORTANTE:
- Mantieni ESATTAMENTE la stessa formattazione HTML nel contenuto
- Usa terminologia appropriata per il settore gambling/casino
- Le traduzioni devono essere naturali e idiomatiche, non letterali
- Mantieni lo stesso tono professionale e coinvolgente
- Preserva tutti i tag HTML (<h2>, <p>, <strong>, ecc.)`;

  const userPrompt = `Traduci questi contenuti da ${sourceLanguageName} a ${targetLanguageName}:

TITOLO: ${title}

CONTENUTO: ${content}

META DESCRIPTION: ${metaDescription || ""}`;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[${targetLang}] Tentativo ${attempts}/${maxAttempts}...`);

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
                name: "return_translation",
                description: `Restituisce la traduzione del contenuto in ${targetLanguageName}`,
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: `Titolo tradotto in ${targetLanguageName}` },
                    content: { type: "string", description: `Contenuto HTML tradotto in ${targetLanguageName}` },
                    meta_description: { type: "string", description: `Meta description tradotta in ${targetLanguageName}` }
                  },
                  required: ["title", "content", "meta_description"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "return_translation" } }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${targetLang}] Errore HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 429) {
          console.log(`[${targetLang}] Rate limit, attendo prima di riprovare...`);
          await new Promise(r => setTimeout(r, 3000 * attempts));
          continue;
        }
        
        if (response.status === 402) {
          throw new Error("Crediti Lovable AI esauriti");
        }
        
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      const data = await response.json();
      
      // Check for error in response body (e.g., 524 timeout)
      if (data.error) {
        console.error(`[${targetLang}] Errore nel body:`, data.error);
        if (data.error.code === 524 || data.error.message?.includes('timeout')) {
          console.log(`[${targetLang}] Timeout, attendo ${2000 * attempts}ms prima di riprovare...`);
          await new Promise(r => setTimeout(r, 2000 * attempts));
          continue;
        }
        throw new Error(data.error.message || "Errore AI");
      }

      // Extract translation from tool call
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || !toolCall.function?.arguments) {
        console.error(`[${targetLang}] Risposta non valida:`, JSON.stringify(data).substring(0, 500));
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      const result = JSON.parse(toolCall.function.arguments);
      console.log(`[${targetLang}] Traduzione completata con successo`);
      
      return {
        title: result.title,
        content: result.content,
        meta_description: result.meta_description
      };

    } catch (error) {
      console.error(`[${targetLang}] Errore tentativo ${attempts}:`, error);
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000 * attempts));
      }
    }
  }

  console.error(`[${targetLang}] Fallito dopo ${maxAttempts} tentativi`);
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdmin(req);
    if (authResult.error) {
      return authResult.error;
    }

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

    console.log(`=== Inizio traduzione sequenziale ===`);
    console.log(`Lingua sorgente: ${LANGUAGE_NAMES[sourceLang]}`);
    console.log(`Lingue target: ${targetLanguages.map(l => LANGUAGE_NAMES[l]).join(', ')}`);
    console.log(`Titolo: ${title.substring(0, 50)}...`);

    // Translate to each language sequentially
    const translations: Record<string, { title: string; content: string; meta_description: string }> = {};
    const failedLanguages: string[] = [];

    for (const targetLang of targetLanguages) {
      console.log(`\n--- Traduzione verso ${LANGUAGE_NAMES[targetLang]} (${targetLang}) ---`);
      
      const result = await translateToLanguage(
        title,
        content,
        meta_description || "",
        sourceLang,
        targetLang,
        LOVABLE_API_KEY
      );

      if (result) {
        translations[targetLang] = result;
      } else {
        failedLanguages.push(targetLang);
      }

      // Small delay between translations to avoid rate limiting
      if (targetLanguages.indexOf(targetLang) < targetLanguages.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log(`\n=== Riepilogo ===`);
    console.log(`Completate: ${Object.keys(translations).join(', ') || 'nessuna'}`);
    console.log(`Fallite: ${failedLanguages.join(', ') || 'nessuna'}`);

    // If all translations failed, return error
    if (Object.keys(translations).length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Tutte le traduzioni sono fallite. Riprova più tardi.",
          failed_languages: failedLanguages
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return successful translations (even if some failed)
    const response = {
      translations,
      source_language: sourceLang,
      ...(failedLanguages.length > 0 && { 
        warning: `Alcune traduzioni non sono riuscite: ${failedLanguages.join(', ')}`,
        failed_languages: failedLanguages
      })
    };

    return new Response(
      JSON.stringify(response), 
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
