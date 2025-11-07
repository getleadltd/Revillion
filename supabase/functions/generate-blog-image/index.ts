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
      // Variazioni di stile fotografico per categoria
      const photographyStyles = {
        news: {
          style: 'fotografia giornalistica professionale in stile reportage',
          mood: 'dinamica e attuale, con atmosfera moderna',
          composition: 'composizione cinematografica con soggetto principale ben definito',
          lighting: 'illuminazione naturale o studio lighting professionale'
        },
        guides: {
          style: 'fotografia educativa in stile documentario',
          mood: 'chiara e accogliente, atmosfera professionale ma friendly',
          composition: 'composizione bilanciata con focus sul soggetto centrale',
          lighting: 'illuminazione morbida e uniforme, soft lighting'
        },
        reviews: {
          style: 'fotografia editoriale in stile magazine premium',
          mood: 'elegante e lussuosa, atmosfera high-end',
          composition: 'composizione artistica con shallow depth of field',
          lighting: 'studio lighting drammatico con contrasti morbidi'
        },
        tips: {
          style: 'fotografia lifestyle professionale',
          mood: 'coinvolgente e aspirazionale, atmosfera positiva',
          composition: 'composizione dinamica con angolazioni interessanti',
          lighting: 'golden hour lighting o illuminazione calda e invitante'
        }
      };

      const styleConfig = photographyStyles[autoPrompt.category as keyof typeof photographyStyles] 
        || photographyStyles.news;

      finalPrompt = `Create a high-resolution professional photograph for a blog article about: "${autoPrompt.title}".

CRITICAL REQUIREMENT - ABSOLUTELY NO TEXT:
- NO text, letters, numbers, or written content of any kind
- NO logos, brand names, or typography
- NO signs, labels, or captions
- NO watermarks or overlays
- Pure photographic content only

Photography specifications:
- Style: ${styleConfig.style}
- Mood: ${styleConfig.mood}
- Composition: ${styleConfig.composition}
- Lighting: ${styleConfig.lighting}

Subject matter: Online casino/gambling theme with relevant elements like playing cards, poker chips, roulette wheel, slot machines, or casino environment.

Technical requirements:
- Photo-realistic, not illustration or CGI
- High resolution 4K quality
- Shallow depth of field with bokeh effect
- Professional color grading with rich, vibrant but elegant tones
- Sharp focus on main subject
- Natural or studio photography aesthetic
- Clean, uncluttered composition
- REMEMBER: Absolutely NO text, letters, or written content visible in the image

The final result should look like a professional photograph you would see in a premium gambling magazine or high-end casino website - a pure photograph without any text elements.`;
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
    console.log('AI Response structure:', JSON.stringify(aiData, null, 2));

    // Prova diversi percorsi nella risposta per estrarre l'immagine
    let imageUrl = null;

    // Percorso 1: images array con image_url nested
    if (aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
      imageUrl = aiData.choices[0].message.images[0].image_url.url;
      console.log('Image extracted via path 1: images[0].image_url.url');
    }
    // Percorso 2: images array con url diretto
    else if (aiData.choices?.[0]?.message?.images?.[0]?.url) {
      imageUrl = aiData.choices[0].message.images[0].url;
      console.log('Image extracted via path 2: images[0].url');
    }
    // Percorso 3: image_url diretto nel message
    else if (aiData.choices?.[0]?.message?.image_url) {
      imageUrl = aiData.choices[0].message.image_url;
      console.log('Image extracted via path 3: message.image_url');
    }

    if (!imageUrl) {
      console.error('Unable to extract image. Response structure:', JSON.stringify(aiData, null, 2));
      throw new Error('Nessuna immagine generata dalla risposta AI');
    }

    // Validare il formato base64
    if (!imageUrl.startsWith('data:image/')) {
      console.error('Invalid image format. First 50 chars:', imageUrl.substring(0, 50));
      throw new Error('Formato immagine non valido');
    }
    
    console.log('Image validated successfully');

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
