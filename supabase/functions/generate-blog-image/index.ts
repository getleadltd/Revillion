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
      const photographyStyles = {
        news: {
          scene: 'Real casino dealer or professional gambler in action at an authentic casino table',
          people: 'Include real people: dealer, players, or gambling professionals',
          setting: 'Luxurious casino floor or modern online betting office',
          camera: 'DSLR camera, 50mm lens, f/2.8',
          reference: 'Like professional Getty Images casino photography'
        },
        guides: {
          scene: 'Real person reading, learning, or studying gambling strategies on laptop or tablet',
          people: 'Include real person: student, professional, or casual learner focused on screen',
          setting: 'Modern home office, bright study area, or coffee shop',
          camera: 'DSLR camera, 35mm lens, f/2.0',
          reference: 'Like professional stock photography for online education'
        },
        reviews: {
          scene: 'Real satisfied player celebrating win or examining luxury casino environment',
          people: 'Include real people: happy winner, VIP player, or elegant casino guest',
          setting: 'Premium casino interior, VIP lounge, or high-end gaming room',
          camera: 'DSLR camera, 85mm lens, f/1.8',
          reference: 'Like high-end lifestyle magazine editorial photography'
        },
        tips: {
          scene: 'Real gambling expert or professional player in thoughtful moment with casino elements',
          people: 'Include real person: confident professional, strategic thinker, or experienced player',
          setting: 'Upscale casino, professional gaming environment, or elegant study',
          camera: 'DSLR camera, 50mm lens, f/2.2',
          reference: 'Like professional business lifestyle photography'
        }
      };

      const styleConfig = photographyStyles[autoPrompt.category as keyof typeof photographyStyles] 
        || photographyStyles.news;

      finalPrompt = `IMPORTANT: Create a REAL PHOTOGRAPH (NOT 3D, NOT CGI, NOT illustration, NOT isometric, NOT cartoon) for: "${autoPrompt.title}".

MANDATORY PHOTOGRAPHIC REQUIREMENTS:

📸 CAMERA & TECHNICAL SPECS:
- Shot with: ${styleConfig.camera}
- Real DSLR/mirrorless camera photograph
- Shallow depth of field with natural bokeh
- Professional color grading
- 4K resolution quality
- Sharp focus on main subject

👥 HUMAN ELEMENT (CRITICAL):
- ${styleConfig.people}
- Real human faces and expressions
- Natural body language and poses
- Authentic emotions and interactions
- Professional models or real people

🎬 SCENE & COMPOSITION:
- Scene: ${styleConfig.scene}
- Setting: ${styleConfig.setting}
- Natural casino elements: real poker chips, authentic cards, genuine roulette wheel
- Clean, uncluttered composition
- Cinematic framing

💡 LIGHTING:
- Natural lighting or professional studio setup
- Soft shadows and highlights
- Warm, inviting atmosphere
- Professional photography lighting techniques

🚫 STRICTLY AVOID:
- NO 3D renders or CGI graphics
- NO isometric or axonometric views
- NO illustrations or digital art
- NO cartoon or stylized elements
- NO floating objects or impossible physics
- NO geometric/abstract patterns
- NO text, logos, or overlays

✅ STYLE REFERENCE:
${styleConfig.reference}

The final image MUST look like an authentic photograph you would find in:
- Professional stock photography websites (Getty Images, Shutterstock editorial)
- High-end casino promotional materials
- Premium lifestyle or business magazines
- Professional journalism or editorial publications

REMEMBER: This must be a REAL PHOTOGRAPH with REAL PEOPLE in a REAL ENVIRONMENT.`;
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
