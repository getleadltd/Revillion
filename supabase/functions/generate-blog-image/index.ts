import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyAdmin(req: Request): Promise<{ error?: Response; userId?: string }> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return { error: new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (roleError || !isAdmin) return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
  return { userId: user.id };
}

// ═══════════════════════════════════════════════════════
// SPECIFIC iGAMING TOPIC → VISUAL CONCEPT MAPPINGS
// Fine-grained mappings to avoid generic "casino" images
// ═══════════════════════════════════════════════════════
const TOPIC_VISUALS: Array<{ pattern: RegExp; subjects: string[] }> = [
  // Slot machines
  {
    pattern: /slot|slots|slot machine|slot online|videopoker|pokies/i,
    subjects: [
      'extreme close-up of spinning slot machine reels with cherries and sevens, dramatic lighting, shallow depth of field, cinematic',
      'rows of colorful slot machines in a dark casino, neon reflections on polished floor, wide angle',
      'hand reaching toward glowing slot machine touchscreen, warm orange ambient light, selective focus on fingertip',
      'abstract visualization of slot symbols flying through dark space, motion blur, vibrant colors',
    ]
  },
  // Roulette
  {
    pattern: /roulette|ruota|pallina|puntare|tavolo verde/i,
    subjects: [
      'top-down aerial view of roulette wheel with white ball in motion, selective focus, dark background, dramatic shadows',
      'extreme close-up of roulette wheel numbers, red and black alternating, shallow focus, golden rim',
      'roulette ball mid-spin frozen in time, motion blur on wheel, studio lighting',
      'elegant hands placing chips on roulette table felt, selective focus on chips, dark luxurious atmosphere',
    ]
  },
  // Blackjack / Card games
  {
    pattern: /blackjack|carte|poker|21|mazzo|deck|bacarà|baccarat/i,
    subjects: [
      'close-up of playing cards fanned out on green felt, selective focus on ace and king, dramatic side lighting',
      'poker chips stacked in columns with playing cards, dark wood background, cinematic lighting',
      'single playing card held between fingers against dark background, spotlight on card face',
      'dealer hands shuffling playing cards mid-air, motion blur on cards, black gloves against dark background',
    ]
  },
  // Sports betting
  {
    pattern: /scommesse?|sportsbook|sport betting|calcio|football|match|partita|quote/i,
    subjects: [
      'smartphone displaying sports betting interface with live odds, bokeh stadium lights in background',
      'football stadium crowd from above with green pitch, aerial photography, evening lights',
      'close-up of hand tapping phone screen with live match scores and betting odds visible',
      'sports data analytics screen with multiple match statistics, dark dashboard, selective focus',
    ]
  },
  // Mobile gaming / App
  {
    pattern: /mobile|smartphone|app|ios|android|cellulare|tablet/i,
    subjects: [
      'person holding smartphone playing casino app, soft focus on glowing screen in dark room, hands closeup',
      'top-down flat lay of smartphone with casino app on screen, dark marble surface, playing cards and chips around it',
      'close-up of smartphone screen showing casino game interface, bokeh background, vibrant neon colors',
      'multiple devices (phone, tablet) showing casino apps in dark tech environment, blue light',
    ]
  },
  // Crypto / Blockchain payments
  {
    pattern: /crypto|bitcoin|ethereum|blockchain|btc|eth|usdt|criptovalut/i,
    subjects: [
      'gold bitcoin coin on dark background with circuit board patterns, macro photography, dramatic light',
      'digital cryptocurrency visualization with glowing network nodes, abstract blue and gold',
      'close-up of hardware wallet with crypto amounts on screen, dark moody background',
      'hands holding smartphone with crypto wallet interface, blockchain network visualization in background',
    ]
  },
  // Affiliate marketing / commissions
  {
    pattern: /affiliat|commission|CPA|revshare|partner|referral|network|guadagn/i,
    subjects: [
      'business professional analyzing affiliate dashboard on laptop, dark office, screen glow on face',
      'digital funnel visualization with conversion metrics and dollar signs flowing, dark background',
      'network of connected people icons with commission flows between them, abstract visualization',
      'hand holding growing stack of dollar bills with upward arrow chart overlay, dark background',
    ]
  },
  // SEO / Traffic / Marketing
  {
    pattern: /SEO|traffico|traffic|keyword|posizionam|google|ranking|ricerca organic/i,
    subjects: [
      'laptop screen showing SEO analytics dashboard with ranking graphs, bokeh office background',
      'abstract search engine result page visualization with glowing position #1 highlighted',
      'magnifying glass over digital data flow and keyword clusters, dark background, blue light',
      'upward trending organic traffic graph on screen, selective focus, dark analytics environment',
    ]
  },
  // Bonus / Promotions
  {
    pattern: /bonus|promozione|offerta|welcome|free spins|giri gratis|cashback|no deposit/i,
    subjects: [
      'gift box with casino chips spilling out, dramatic lighting, dark luxurious background',
      'percent sign made of gold coins on dark background, abstract financial concept',
      'digital coupon/voucher visualization with glowing "BONUS" text, neon style against dark background',
      'hands catching falling gold coins and casino chips, motion blur, dramatic studio lighting',
    ]
  },
  // Live casino / Live dealer
  {
    pattern: /live casino|live dealer|dealer dal vivo|studio|streaming/i,
    subjects: [
      'professional casino dealer with elegant attire at live table, studio lighting, selective focus on hands',
      'camera crew setup in luxury live casino studio, multiple screens showing table games',
      'roulette table from dealer perspective, overhead studio lights, dramatic professional environment',
      'elegant croupier spinning roulette wheel in professional live streaming setup, dark background',
    ]
  },
  // Responsible gambling / Safety
  {
    pattern: /responsabile|sicurezza|protezione|limite|dipendenza|autoesclusione/i,
    subjects: [
      'person placing "responsible" symbol chip on game table, selective focus, warm light',
      'shield protection icon visualization with digital security elements, dark professional background',
      'balanced scale between entertainment and protection concept, clean studio photography',
    ]
  },
  // Regulation / License / Legal
  {
    pattern: /regolament|licenza|ADM|AAMS|MGA|Curacao|legal|compliance|legale/i,
    subjects: [
      'official document with legal seal and signature, dark marble desk background, professional lighting',
      'digital compliance checklist interface with approved checkmarks, dark dashboard',
      'scales of justice with casino chip on one side, clean studio photography, dark background',
    ]
  },
  // Payment methods
  {
    pattern: /pagamento|payment|withdrawal|prelievo|deposito|bonifico|carta|Skrill|Neteller/i,
    subjects: [
      'close-up of credit card on glass surface with digital payment elements, dark background, side light',
      'smartphone contactless payment near casino chip, NFC visualization, dark tech aesthetic',
      'stack of international currency with digital payment icons floating above, abstract',
      'secure payment interface on laptop screen, padlock icon prominent, dark office environment',
    ]
  },
  // Analytics / Data / Strategy
  {
    pattern: /strateg|analytics|dati|ROI|conversion|KPI|ottimizza|analisi/i,
    subjects: [
      'data analyst looking at multiple screens with casino analytics dashboards, dark room, screen glow',
      'abstract 3D bar chart visualization with gaming metrics, floating in dark space, blue accent light',
      'close-up of hands typing on laptop with analytics dashboard in background, selective focus',
      'chess pieces on board with data visualization overlay, strategy concept, dark cinematic',
    ]
  },
  // VIP / High roller
  {
    pattern: /VIP|high roller|premium|lusso|luxury|esclusivo|elite/i,
    subjects: [
      'luxury casino interior with chandeliers and private gaming tables, wide angle, warm golden light',
      'champagne glass next to high-value casino chips on polished dark table, close-up, bokeh',
      'private jet interior with casino table setup, exclusive high-end aesthetic, warm lighting',
      'close-up of diamond-encrusted casino chip, macro photography, dark velvet background',
    ]
  },
  // Tournaments / Competition
  {
    pattern: /torneo|tournament|competizione|campionato|leaderboard|classifica/i,
    subjects: [
      'tournament bracket visualization with glowing player positions, dark gaming aesthetic',
      'trophy cup on casino table surrounded by chips and cards, dramatic studio lighting',
      'leaderboard display on screen with competing player names and scores, dark esports aesthetic',
    ]
  },
  // Italy / Italian market
  {
    pattern: /italia|italiano|mercato italiano|ADM|gioco online italia/i,
    subjects: [
      'Italian flag colors incorporated in digital casino interface visualization, elegant',
      'Rome colosseum silhouette with digital gaming overlay, sunset colors, composite photography',
      'Italian stylish hands at casino table, luxury aesthetic, warm Mediterranean lighting',
    ]
  },
];

// ═══════════════════════════════════════════════════════
// VISUAL STYLE POOL — rotates to ensure image variety
// ═══════════════════════════════════════════════════════
const VISUAL_STYLES = [
  {
    style: 'ultra-realistic 8K photography',
    lighting: 'dramatic chiaroscuro lighting, deep shadows, sharp highlights',
    mood: 'dark luxury, cinematic atmosphere, premium feel',
    composition: 'rule of thirds, shallow depth of field f/1.8, bokeh background'
  },
  {
    style: 'editorial photography in style of Vogue Business',
    lighting: 'clean studio lighting with rim light, white reflector',
    mood: 'clean, modern, high-end magazine aesthetic',
    composition: 'centered composition with generous negative space, minimalist'
  },
  {
    style: 'cinematic photography in style of Hollywood production still',
    lighting: 'motivated lighting from practical sources, lens flare, anamorphic',
    mood: 'tense, atmospheric, immersive, filmic',
    composition: 'wide angle establishing shot, dynamic angle, foreground elements'
  },
  {
    style: 'moody noir photography',
    lighting: 'single hard light source, heavy shadows, neon color accent',
    mood: 'mysterious, urban, edgy, sophisticated',
    composition: 'asymmetric framing, leading lines, urban textures'
  },
  {
    style: 'hyperrealistic macro photography',
    lighting: 'ring flash, perfectly even illumination, high resolution detail',
    mood: 'technical, precise, revealing hidden detail',
    composition: 'extreme close-up, filling the frame, perfect focus on texture'
  },
  {
    style: 'lifestyle photography in premium magazine style',
    lighting: 'golden hour light, warm tones, natural light through window',
    mood: 'aspirational, human, relatable, premium',
    composition: 'candid moment, environmental context, authentic atmosphere'
  },
  {
    style: 'dark luxury product photography',
    lighting: 'dramatic side lighting, deep blacks, metallic reflections',
    mood: 'prestigious, exclusive, high-value, premium brand',
    composition: 'product hero shot, dark background, single spotlight'
  },
  {
    style: 'tech editorial photography',
    lighting: 'blue-tinted LED ambient, screen glow as key light',
    mood: 'futuristic, innovative, cutting-edge, digital-native',
    composition: 'person + technology interaction, environment tells story'
  },
];

// ═══════════════════════════════════════════════════════
// FALLBACK POOL — rich variety for non-matched topics
// ═══════════════════════════════════════════════════════
const FALLBACK_SUBJECTS = [
  'overhead aerial view of full casino gaming floor with dealers and players at multiple tables, wide establishing shot',
  'close-up of casino chips stacked in perfect columns, various denominations, dark wood surface, single spotlight',
  'elegant casino dealer hands shuffling playing cards mid-air, black uniform, dark luxury background, motion blur',
  'top-down view of green felt blackjack table from player perspective, cards and chips arranged, dramatic shadow',
  'casino night skyline through floor-to-ceiling window, city lights bokeh, silhouette of gaming table in foreground',
  'pile of mixed denomination casino chips spilling across dark marble surface, macro lens, selective focus',
  'roulette wheel detail from 45 degree angle, selective focus on number pockets, ambient golden light',
  'person in business attire confidently checking casino analytics on phone, selective focus, dark background',
  'digital dashboard visualization with real-time casino gaming statistics, multiple data streams, dark blue aesthetic',
  'playing cards spread across reflective dark surface, ace of spades prominent, dramatic lighting from above',
  'casino vault door partially open revealing stacks of chips inside, cinematic lighting',
  'high-roller private casino room with chandelier, empty table, anticipation atmosphere',
];

function pickRandom<T>(arr: T[], seed?: number): T {
  const idx = seed !== undefined
    ? seed % arr.length
    : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function buildVisualConcept(title: string, category: string): string {
  const titleLower = title.toLowerCase();

  // Find specific topic match
  let matchedSubjects: string[] | null = null;
  for (const entry of TOPIC_VISUALS) {
    if (entry.pattern.test(titleLower)) {
      matchedSubjects = entry.subjects;
      break;
    }
  }

  // Use seed based on title hash for deterministic but varied results
  const titleHash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const subject = matchedSubjects
    ? pickRandom(matchedSubjects, titleHash % matchedSubjects.length)
    : pickRandom(FALLBACK_SUBJECTS, titleHash % FALLBACK_SUBJECTS.length);

  // Pick visual style — use different dimension to vary independently
  const style = pickRandom(VISUAL_STYLES, (titleHash * 7 + 13) % VISUAL_STYLES.length);

  return `${subject}. Style: ${style.style}. Lighting: ${style.lighting}. Mood: ${style.mood}. Composition: ${style.composition}.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authResult = await verifyAdmin(req);
    if (authResult.error) return authResult.error;

    const { prompt, autoPrompt } = await req.json();
    let finalPrompt = prompt;

    if (autoPrompt?.title) {
      const visualConcept = buildVisualConcept(autoPrompt.title, autoPrompt.category || 'news');

      finalPrompt = `Create a professional photograph for a blog article titled: "${autoPrompt.title}".

ABSOLUTE REQUIREMENT — ZERO TEXT:
- NO text, letters, numbers, words, or written content of any kind visible anywhere
- NO logos, brand names, typography, signs, labels, captions, watermarks, overlays
- Pure photographic content only — if any text appears, the image fails

VISUAL BRIEF:
${visualConcept}

TECHNICAL REQUIREMENTS:
- Photo-realistic, not illustration, CGI, or AI art style
- Aspect ratio: 16:9 landscape orientation
- Ultra high resolution, sharp details
- Professional color grading with rich tones
- NO generic stock photo feel — this should feel editorial and premium

CONTEXT: iGaming / online gambling industry. The image represents: "${autoPrompt.title}"
The visual should DIRECTLY relate to the article topic, not just generic casino imagery.

REMINDER: ABSOLUTELY ZERO text, letters, numbers, or symbols visible anywhere in the image.`;
    }

    if (!finalPrompt?.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt è obbligatorio' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY non configurato');

    console.log('Generating image for:', autoPrompt?.title || 'custom prompt');
    console.log('Visual concept hash-based style selection active');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: finalPrompt }],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Image API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'Rate limit raggiunto.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'Crediti AI esauriti.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    let imageUrl: string | null = null;
    if (aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
      imageUrl = aiData.choices[0].message.images[0].image_url.url;
    } else if (aiData.choices?.[0]?.message?.images?.[0]?.url) {
      imageUrl = aiData.choices[0].message.images[0].url;
    } else if (aiData.choices?.[0]?.message?.image_url) {
      imageUrl = aiData.choices[0].message.image_url;
    }

    if (!imageUrl) throw new Error('Nessuna immagine generata dalla risposta AI');
    if (!imageUrl.startsWith('data:image/')) throw new Error('Formato immagine non valido');

    return new Response(
      JSON.stringify({ imageBase64: imageUrl, prompt: finalPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore durante la generazione immagine' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
