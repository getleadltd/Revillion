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

const MAX_CHUNK_SIZE = 6000; // Caratteri per chunk (ridotto per sicurezza)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Allow internal service role calls (e.g., from autopilot)
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceKey && authHeader === `Bearer ${serviceKey}`) {
    return { userId: 'service-role' };
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

// Split content into chunks at safe HTML boundaries
function splitContentIntoChunks(content: string): string[] {
  if (content.length <= MAX_CHUNK_SIZE) {
    return [content];
  }

  const chunks: string[] = [];
  const splitPoints = ['</p>', '</h2>', '</h3>', '</h4>', '</ul>', '</ol>', '</blockquote>', '</div>', '</section>'];
  
  let remaining = content;
  
  while (remaining.length > MAX_CHUNK_SIZE) {
    let splitIndex = -1;
    
    // Find the best split point within MAX_CHUNK_SIZE
    for (const point of splitPoints) {
      const idx = remaining.lastIndexOf(point, MAX_CHUNK_SIZE);
      if (idx > splitIndex) {
        splitIndex = idx + point.length;
      }
    }
    
    // If no good split point found, force split at MAX_CHUNK_SIZE
    if (splitIndex <= 0) {
      // Try to at least split at a space
      const spaceIdx = remaining.lastIndexOf(' ', MAX_CHUNK_SIZE);
      splitIndex = spaceIdx > MAX_CHUNK_SIZE / 2 ? spaceIdx : MAX_CHUNK_SIZE;
    }
    
    chunks.push(remaining.substring(0, splitIndex).trim());
    remaining = remaining.substring(splitIndex).trim();
  }
  
  if (remaining) {
    chunks.push(remaining);
  }
  
  return chunks;
}

// Translate a single content chunk
async function translateChunk(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  sourceLang: Language,
  targetLang: Language,
  apiKey: string
): Promise<string | null> {
  const maxAttempts = 3;
  let attempts = 0;

  const sourceLanguageName = LANGUAGE_NAMES[sourceLang];
  const targetLanguageName = LANGUAGE_NAMES[targetLang];

  const systemPrompt = `Sei un traduttore professionista specializzato in contenuti per il settore iGaming e gambling online. 
Traduci il seguente contenuto HTML da ${sourceLanguageName} a ${targetLanguageName}.

IMPORTANTE:
- Mantieni ESATTAMENTE la stessa formattazione HTML
- Usa terminologia appropriata per il settore gambling/casino
- Le traduzioni devono essere naturali e idiomatiche
- Preserva tutti i tag HTML (<h2>, <p>, <strong>, ecc.)
- Restituisci SOLO il contenuto HTML tradotto, nient'altro`;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[${targetLang}] Chunk ${chunkIndex}/${totalChunks} - Tentativo ${attempts}/${maxAttempts}...`);

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
            { role: "user", content: `Traduci questo contenuto HTML in ${targetLanguageName}:\n\n${chunk}` }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${targetLang}] Chunk ${chunkIndex} - Errore HTTP ${response.status}: ${errorText.substring(0, 200)}`);
        
        if (response.status === 429) {
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
      
      if (data.error) {
        console.error(`[${targetLang}] Chunk ${chunkIndex} - Errore nel body:`, data.error);
        if (data.error.code === 524 || data.error.message?.includes('timeout')) {
          await new Promise(r => setTimeout(r, 2000 * attempts));
          continue;
        }
        throw new Error(data.error.message || "Errore AI");
      }

      const translatedContent = data.choices?.[0]?.message?.content;
      if (!translatedContent) {
        console.error(`[${targetLang}] Chunk ${chunkIndex} - Risposta vuota`);
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      console.log(`[${targetLang}] Chunk ${chunkIndex}/${totalChunks} - Completato`);
      return translatedContent.trim();

    } catch (error) {
      console.error(`[${targetLang}] Chunk ${chunkIndex} - Errore:`, error);
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000 * attempts));
      }
    }
  }

  console.error(`[${targetLang}] Chunk ${chunkIndex} - Fallito dopo ${maxAttempts} tentativi`);
  return null;
}

// Translate title and meta description (short texts)
async function translateTitleAndMeta(
  title: string,
  metaDescription: string,
  sourceLang: Language,
  targetLang: Language,
  apiKey: string
): Promise<{ title: string; meta_description: string } | null> {
  const maxAttempts = 3;
  let attempts = 0;

  const sourceLanguageName = LANGUAGE_NAMES[sourceLang];
  const targetLanguageName = LANGUAGE_NAMES[targetLang];

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[${targetLang}] Titolo/Meta - Tentativo ${attempts}/${maxAttempts}...`);

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
            { 
              role: "system", 
              content: `Sei un traduttore professionista specializzato in SEO e contenuti per il settore iGaming. Traduci da ${sourceLanguageName} a ${targetLanguageName}.` 
            },
            { 
              role: "user", 
              content: `Traduci in ${targetLanguageName}:\n\nTITOLO: ${title}\n\nMETA DESCRIPTION: ${metaDescription || ""}` 
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_translation",
                description: `Restituisce titolo e meta description tradotti`,
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: `Titolo tradotto in ${targetLanguageName}` },
                    meta_description: { type: "string", description: `Meta description tradotta in ${targetLanguageName}` }
                  },
                  required: ["title", "meta_description"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "return_translation" } }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${targetLang}] Titolo/Meta - Errore HTTP ${response.status}`);
        
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 3000 * attempts));
          continue;
        }
        
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`[${targetLang}] Titolo/Meta - Errore:`, data.error);
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || !toolCall.function?.arguments) {
        await new Promise(r => setTimeout(r, 2000 * attempts));
        continue;
      }

      const result = JSON.parse(toolCall.function.arguments);
      console.log(`[${targetLang}] Titolo/Meta - Completato`);
      
      return {
        title: result.title,
        meta_description: result.meta_description
      };

    } catch (error) {
      console.error(`[${targetLang}] Titolo/Meta - Errore:`, error);
      if (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000 * attempts));
      }
    }
  }

  return null;
}

// Translate full content to a single language (with chunking)
async function translateToLanguage(
  title: string,
  content: string,
  metaDescription: string,
  sourceLang: Language,
  targetLang: Language,
  apiKey: string
): Promise<{ title: string; content: string; meta_description: string } | null> {
  
  // 1. Translate title and meta description first (small request)
  const titleMeta = await translateTitleAndMeta(title, metaDescription, sourceLang, targetLang, apiKey);
  if (!titleMeta) {
    console.error(`[${targetLang}] Fallita traduzione titolo/meta`);
    return null;
  }

  // 2. Split content into chunks
  const chunks = splitContentIntoChunks(content);
  console.log(`[${targetLang}] Contenuto diviso in ${chunks.length} chunk (totale: ${content.length} caratteri)`);

  // 3. Translate each chunk
  const translatedChunks: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    // Small delay between chunks
    if (i > 0) {
      await new Promise(r => setTimeout(r, 500));
    }

    const translatedChunk = await translateChunk(
      chunks[i],
      i + 1,
      chunks.length,
      sourceLang,
      targetLang,
      apiKey
    );

    if (!translatedChunk) {
      console.error(`[${targetLang}] Fallito chunk ${i + 1}/${chunks.length}`);
      return null; // Fail if any chunk fails
    }

    translatedChunks.push(translatedChunk);
  }

  // 4. Combine translated chunks
  const translatedContent = translatedChunks.join('\n\n');
  console.log(`[${targetLang}] Traduzione completata - ${translatedContent.length} caratteri`);

  return {
    title: titleMeta.title,
    content: translatedContent,
    meta_description: titleMeta.meta_description
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const sourceLang = SUPPORTED_LANGUAGES.includes(source_language) ? source_language : 'it';
    const targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang !== sourceLang);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurata");
    }

    console.log(`=== Inizio traduzione con chunking ===`);
    console.log(`Lingua sorgente: ${LANGUAGE_NAMES[sourceLang]}`);
    console.log(`Lingue target: ${targetLanguages.map(l => LANGUAGE_NAMES[l]).join(', ')}`);
    console.log(`Titolo: ${title.substring(0, 50)}...`);
    console.log(`Lunghezza contenuto: ${content.length} caratteri`);

    const translations: Record<string, { title: string; content: string; meta_description: string }> = {};
    const failedLanguages: string[] = [];

    // Traduci tutte le lingue in parallelo per rientrare nei timeout della funzione.
    // I chunk restano sequenziali *all'interno* di ogni lingua, ma le lingue partono insieme.
    const results = await Promise.all(
      targetLanguages.map(async (targetLang, idx) => {
        // piccolo "stagger" per ridurre picchi e 429
        await sleep(idx * 750);

        console.log(`\n--- Traduzione verso ${LANGUAGE_NAMES[targetLang]} (${targetLang}) ---`);

        try {
          const result = await translateToLanguage(
            title,
            content,
            meta_description || "",
            sourceLang,
            targetLang,
            LOVABLE_API_KEY
          );

          return { targetLang, result };
        } catch (err) {
          console.error(`[${targetLang}] Errore traduzione (caught):`, err);
          return { targetLang, result: null as any };
        }
      })
    );

    for (const { targetLang, result } of results) {
      if (result) {
        translations[targetLang] = result;
      } else {
        failedLanguages.push(targetLang);
      }
    }



    console.log(`\n=== Riepilogo ===`);
    console.log(`Completate: ${Object.keys(translations).join(', ') || 'nessuna'}`);
    console.log(`Fallite: ${failedLanguages.join(', ') || 'nessuna'}`);

    if (Object.keys(translations).length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Tutte le traduzioni sono fallite. Riprova più tardi.",
          failed_languages: failedLanguages
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
