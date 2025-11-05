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
    const { prompt, autoPrompt } = await req.json();

    let finalPrompt = prompt;

    // Se richiesta auto-generazione prompt, crea un prompt ottimizzato
    if (autoPrompt && autoPrompt.title) {
      const categoryContext = {
        news: 'notizie e aggiornamenti dal mondo dei casinò online',
        guides: 'guida educativa per giocatori',
        reviews: 'recensione di casinò o giochi',
        tips: 'consigli e strategie di gioco'
      }[autoPrompt.category] || 'contenuto di casinò online';

      finalPrompt = `Crea un'immagine professionale e accattivante per un articolo di blog sul tema: "${autoPrompt.title}". 
L'immagine rappresenta ${categoryContext}. 
Stile: moderno, professionale, colori vivaci ma eleganti, alta qualità, tema casinò/gambling online.
Include elementi visivi rilevanti: carte da gioco, chips, roulette, slot machine (dove appropriato).
Evita testo nell'immagine, focus su elementi grafici puliti e professionali.`;
    }

    if (!finalPrompt || finalPrompt.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Prompt è obbligatorio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurato');
    }

    console.log('Generating image with prompt:', finalPrompt);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: finalPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI image error:', aiResponse.status, errorText);
      
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
    console.log('Image generated successfully');

    // Estrarre l'immagine base64 dalla risposta
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('Nessuna immagine generata dalla risposta AI');
    }

    return new Response(
      JSON.stringify({
        imageBase64: imageUrl,
        prompt: finalPrompt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-blog-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore durante la generazione dell\'immagine' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
