/**
 * Article Review Swarm
 *
 * Runs 7 specialized agents IN PARALLEL to review a blog article:
 * 1. SEO Agent          — title, meta desc, slug, keyword density, heading structure
 * 2. Readability Agent  — sentences, paragraphs, jargon, reading level
 * 3. Structure Agent    — intro, body, conclusion, H2/H3 hierarchy, word count
 * 4. CTA Agent          — affiliate links, CTA presence, Revillion mentions
 * 5. Multilingual Agent — consistency across available languages
 * 6. E-E-A-T Agent      — expertise signals, trustworthiness, author authority
 * 7. Image Agent        — featured image, alt text, image count
 *
 * Stores results in agent_tasks table. Returns task ID immediately (async).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

// ─── Agent definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'seo',
    name: 'SEO Agent',
    prompt: (post: any, lang: string) => `
You are an expert SEO analyst for iGaming affiliate content. Analyze this article for SEO quality.

Title: ${post[`title_${lang}`] || post.title_en}
Slug: ${post[`slug_${lang}`] || post.slug_en}
Meta description: ${post[`meta_description_${lang}`] || post.meta_description_en}
Category: ${post.category}
Content (first 8000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(0, 8000)}

Evaluate:
1. Title: is it 50-60 chars? Contains primary keyword? Compelling?
2. Meta description: is it 140-160 chars? Has CTA? Contains keyword?
3. Slug: clean, keyword-rich, no stop words?
4. Keyword density: appropriate (1-3%) or stuffed?
5. H2/H3 structure: logical hierarchy? Keywords in headings?
6. Internal/external links appropriate for iGaming affiliate content?

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "passed": ["what works well"]
}`,
  },
  {
    id: 'readability',
    name: 'Readability Agent',
    prompt: (post: any, lang: string) => `
You are a content readability expert. Analyze this iGaming article for readability.

Language: ${lang}
Content (first 8000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(0, 8000)}

Evaluate:
1. Average sentence length (ideal: <20 words)
2. Paragraph length (ideal: 2-4 sentences)
3. Use of jargon (is it explained?)
4. Active vs passive voice ratio
5. Reading level (aim for general audience, not academic)
6. Use of bullet points / lists for scannability
7. Subheadings frequency (every 300-400 words)

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "reading_level": "<beginner|intermediate|advanced>",
  "avg_sentence_length": <number>,
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "passed": ["what works well"]
}`,
  },
  {
    id: 'structure',
    name: 'Structure Agent',
    prompt: (post: any, lang: string) => `
You are a content structure expert for iGaming affiliate blogs. Analyze article structure.

Title: ${post[`title_${lang}`] || post.title_en}
Total word count: ${Math.round((post[`content_${lang}`] || post.content_en || '').split(' ').length)}
Content START (first 6000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(0, 6000)}
Content END (last 4000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(-4000)}

Evaluate:
1. Does it have a compelling introduction (hook + value prop in first 100 words)?
2. Is the body logically organized with clear sections?
3. Does it have a conclusion with next steps or CTA?
4. Word count (1200-2500 is standard; 2500-6000+ is fine for comprehensive guides)?
5. Is there an FAQ section? (boosts featured snippets)
6. Does it cover the topic comprehensively?
7. Does it have a clear unique angle vs generic content?

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "word_count": <number>,
  "has_intro": <boolean>,
  "has_conclusion": <boolean>,
  "has_faq": <boolean>,
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "passed": ["what works well"]
}`,
  },
  {
    id: 'cta',
    name: 'CTA & Affiliate Agent',
    prompt: (post: any, lang: string) => `
You are an affiliate marketing conversion expert. Analyze CTA and affiliate elements.

Content START (first 5000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(0, 5000)}
Content END (last 4000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(-4000)}
Category: ${post.category}

Evaluate:
1. Does it mention Revillion Partners or encourage affiliate signup?
2. Is there at least 1 clear CTA (call to action) to join/register?
3. Are CTAs placed strategically (early, middle, end)?
4. Is the value proposition clear (what the reader gains)?
5. Does it create urgency or desire to act?
6. Are affiliate links or dashboard references present?
7. Does it avoid being too salesy (balance value vs promotion)?

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "cta_count": <number>,
  "has_revillion_mention": <boolean>,
  "cta_placement": "<poor|ok|good>",
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "passed": ["what works well"]
}`,
  },
  {
    id: 'multilingual',
    name: 'Multilingual Consistency Agent',
    prompt: (post: any, _lang: string) => `
You are a multilingual content consistency expert. Check this article across languages.

Available languages and word counts:
- EN: ${Math.round((post.content_en || '').split(' ').length)} words, title: "${post.title_en || 'missing'}"
- IT: ${Math.round((post.content_it || '').split(' ').length)} words, title: "${post.title_it || 'missing'}"
- DE: ${Math.round((post.content_de || '').split(' ').length)} words, title: "${post.title_de || 'missing'}"
- PT: ${Math.round((post.content_pt || '').split(' ').length)} words, title: "${post.title_pt || 'missing'}"
- ES: ${Math.round((post.content_es || '').split(' ').length)} words, title: "${post.title_es || 'missing'}"

Meta descriptions:
- EN: ${post.meta_description_en || 'missing'}
- IT: ${post.meta_description_it || 'missing'}
- DE: ${post.meta_description_de || 'missing'}
- PT: ${post.meta_description_pt || 'missing'}
- ES: ${post.meta_description_es || 'missing'}

Evaluate:
1. Which languages are missing content?
2. Are word counts reasonably consistent across languages (±20%)?
3. Are all meta descriptions present and non-empty?
4. Are slugs available for all languages?

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "missing_languages": ["de", "pt"],
  "word_count_variance": "<low|medium|high>",
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "passed": ["what works well"]
}`,
  },
  {
    id: 'eeat',
    name: 'E-E-A-T Agent',
    prompt: (post: any, lang: string) => `
You are an E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) evaluator for Google quality guidelines.

Title: ${post[`title_${lang}`] || post.title_en}
Content (first 8000 chars): ${(post[`content_${lang}`] || post.content_en || '').slice(0, 8000)}

Evaluate for iGaming affiliate content:
1. Experience: Does it show first-hand knowledge of the topic?
2. Expertise: Does it demonstrate deep iGaming/affiliate knowledge?
3. Authoritativeness: Does it cite data, stats, or credible sources?
4. Trustworthiness: Is it accurate, balanced, not misleading?
5. Does it avoid YMYL (Your Money Your Life) red flags?
6. Does it have original insights vs generic information?
7. Would Google consider this "helpful content"?

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "experience_score": <0-10>,
  "expertise_score": <0-10>,
  "authority_score": <0-10>,
  "trust_score": <0-10>,
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "passed": ["what works well"]
}`,
  },
  {
    id: 'image',
    name: 'Image Agent',
    prompt: (post: any, lang: string) => `
You are an image optimization expert for web content.

Featured image URL: ${post.featured_image_url || 'MISSING'}
Featured image alt: ${post.featured_image_alt || 'MISSING'}
Content (looking for img tags): ${(post[`content_${lang}`] || post.content_en || '').slice(0, 6000)}

Evaluate:
1. Is there a featured image?
2. Does the featured image have descriptive alt text?
3. Is alt text SEO-optimized (includes keyword)?
4. Are there inline images in the content? (1 per 500 words is good)
5. Do inline images have alt text?
6. Is the image URL from a CDN/Supabase storage (not external)?

Respond ONLY with valid JSON:
{
  "score": <0-100>,
  "has_featured_image": <boolean>,
  "has_alt_text": <boolean>,
  "inline_image_count": <number>,
  "issues": ["issue1"],
  "suggestions": ["suggestion1"],
  "passed": ["what works well"]
}`,
  },
];

// ─── AI call via Lovable gateway ─────────────────────────────────────────────

async function callAI(prompt: string): Promise<any> {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI call failed: ${res.status} — ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { post_id, lang = 'en', exclude_agents = [] } = await req.json();
    if (!post_id) throw new Error('post_id required');

    // Fetch full post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', post_id)
      .single();
    if (error || !post) throw new Error('Post not found');

    // Create task record
    const { data: task } = await supabase
      .from('agent_tasks')
      .insert({
        type: 'article_review',
        status: 'running',
        input: { post_id, lang, title: post[`title_${lang}`] || post.title_en },
      })
      .select()
      .single();

    const taskId = task?.id;

    // Run agents IN PARALLEL (optionally excluding some)
    const activeAgents = exclude_agents.length > 0
      ? AGENTS.filter(a => !exclude_agents.includes(a.id))
      : AGENTS;

    const agentResults = await Promise.allSettled(
      activeAgents.map(async (agent) => {
        const start = Date.now();
        try {
          const result = await callAI(agent.prompt(post, lang));
          return { id: agent.id, name: agent.name, score: result.score ?? 0, result, duration_ms: Date.now() - start };
        } catch (e) {
          return { id: agent.id, name: agent.name, score: 0, error: String(e), duration_ms: Date.now() - start };
        }
      })
    );

    const agents = agentResults.map(r => r.status === 'fulfilled' ? r.value : { error: 'failed' });

    // Calculate overall score (weighted average)
    const weights: Record<string, number> = {
      seo: 25, readability: 15, structure: 15, cta: 20, multilingual: 10, eeat: 10, image: 5,
    };
    let totalWeight = 0, weightedScore = 0;
    agents.forEach((a: any) => {
      const w = weights[a.id] ?? 10;
      weightedScore += (a.score ?? 0) * w;
      totalWeight += w;
    });
    const overallScore = Math.round(weightedScore / totalWeight);

    // Collect all issues and suggestions
    const allIssues = agents.flatMap((a: any) => a.result?.issues ?? []);
    const allSuggestions = agents.flatMap((a: any) => a.result?.suggestions ?? []);
    const allPassed = agents.flatMap((a: any) => a.result?.passed ?? []);

    const summary = {
      overall_score: overallScore,
      grade: overallScore >= 80 ? 'A' : overallScore >= 65 ? 'B' : overallScore >= 50 ? 'C' : 'D',
      top_issues: allIssues.slice(0, 5),
      top_suggestions: allSuggestions.slice(0, 5),
      passed: allPassed.slice(0, 5),
      post_title: post[`title_${lang}`] || post.title_en,
      reviewed_at: new Date().toISOString(),
    };

    // Update task with results
    await supabase.from('agent_tasks').update({
      status: 'completed',
      agents,
      summary,
      score: overallScore,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    }).eq('id', taskId);

    return new Response(JSON.stringify({ task_id: taskId, score: overallScore, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
