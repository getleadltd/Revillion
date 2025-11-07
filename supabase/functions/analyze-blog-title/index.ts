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

    const systemPrompt = `Sei un esperto SEO e content strategist specializzato in gambling e casino online.
Analizza il titolo fornito e determina i parametri ottimali per la generazione dell'articolo.`;

    const userPrompt = `Analizza questo titolo di articolo: "${title}"

Determina:
1. **Categoria** (scegli UNA tra: news, guides, reviews, tips)
2. **Keywords** (3-5 keywords SEO principali in italiano)
3. **Tone** (scegli UNO tra: professional, casual, technical)
4. **Length** (scegli UNO tra: short, medium, long)

Basati su:
- Intento del titolo (informativo, guida, recensione, notizia)
- Complessità dell'argomento
- Target audience (principianti vs esperti)

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
                  minItems: 3,
                  maxItems: 5,
                  description: 'SEO keywords'
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
                }
              },
              required: ['category', 'keywords', 'tone', 'length'],
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
