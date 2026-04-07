import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authResult = await verifyAdmin(req);
    if (authResult.error) {
      return authResult.error;
    }

    const { title } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Sei un esperto SEO e content strategist specializzato in affiliate marketing iGaming.
Il sito è Revillion Partners, una rete di affiliazione casino. Il pubblico del blog sono AFFILIATI (publisher, marketer, SEO specialist) — NON giocatori.
Analizza il titolo e determina i parametri ottimali per generare contenuto che attiri potenziali affiliati e li convinca a iscriversi alla rete.`;

    const userPrompt = `Analizza questo titolo di articolo: "${title}"

Determina i parametri ottimali per creare il miglior articolo SEO possibile:
1. **Categoria** (news, guides, reviews, tips)
2. **Keywords** (4-6 keywords: prima la principale, poi secondarie, poi LSI)
3. **Tone** (professional, casual, technical)
4. **Length** (short=600 parole, medium=1100 parole, long=2000 parole)
5. **Search intent** (informational, transactional, commercial, navigational)
6. **Content format** (listicle, howto, review, comparison, news)

Criteri per length:
- short: argomenti semplici, notizie, glossario
- medium: guide pratiche, recensioni, consigli
- long: guide complete, confronti approfonditi, tutorial step-by-step

Rispondi SOLO con i parametri richiesti in formato strutturato.`;

    console.log('Analyzing title:', title);

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
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_title',
            description: 'Analyze blog title and return optimal parameters',
            parameters: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['news', 'guides', 'reviews', 'tips'],
                  description: 'Article category'
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 4,
                  maxItems: 6,
                  description: 'SEO keywords: primary first, then secondary, then LSI'
                },
                tone: {
                  type: 'string',
                  enum: ['professional', 'casual', 'technical'],
                  description: 'Writing tone'
                },
                length: {
                  type: 'string',
                  enum: ['short', 'medium', 'long'],
                  description: 'Article length'
                },
                search_intent: {
                  type: 'string',
                  enum: ['informational', 'transactional', 'commercial', 'navigational'],
                  description: 'Primary search intent of users searching this title'
                },
                content_format: {
                  type: 'string',
                  enum: ['listicle', 'howto', 'review', 'comparison', 'news'],
                  description: 'Best content format for this topic'
                }
              },
              required: ['category', 'keywords', 'tone', 'length', 'search_intent', 'content_format'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_title' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient AI credits. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    console.log('Analysis result:', analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-blog-title:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
