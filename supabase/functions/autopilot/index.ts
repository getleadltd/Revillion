/**
 * Autopilot Orchestrator — returns immediately, processes in background
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// EdgeRuntime is a Supabase-specific global — declare for TypeScript
declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void } | undefined;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function supabaseAdmin() {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

async function getSetting(sb: any, key: string, fallback = '') {
  const { data } = await sb.from('site_settings').select('value').eq('key', key).single();
  return data?.value ?? fallback;
}

function log(taskId: string | null, msg: string) {
  console.log(`[autopilot${taskId ? ':' + taskId.slice(0, 8) : ''}] ${msg}`);
}

async function appendLog(sb: any, taskId: string, entry: object) {
  const { data: task } = await sb.from('agent_tasks').select('agents').eq('id', taskId).single();
  const logs = Array.isArray(task?.agents) ? task.agents : [];
  logs.push({ ts: new Date().toISOString(), ...entry });
  await sb.from('agent_tasks').update({ agents: logs, updated_at: new Date().toISOString() }).eq('id', taskId);
}

// ── Full pipeline (runs in background) ───────────────────────────────────────
async function runPipeline(sb: any, item: any, taskId: string, minScore: number) {
  try {
    // ── 3. Analyze title ──────────────────────────────────────────────────────
    await appendLog(sb, taskId, { step: 'analyze', msg: 'Analisi parametri articolo...' });
    const analyzeRes = await sb.functions.invoke('analyze-blog-title', { body: { title: item.title } });
    if (analyzeRes.error) throw new Error(`Analyze failed: ${analyzeRes.error.message}`);
    const { category, keywords, tone, length, search_intent, content_format } = analyzeRes.data;
    await appendLog(sb, taskId, { step: 'analyze_done', category, keywords, msg: `Categoria: ${category}` });

    // ── 4. Generate IT content + image IN PARALLEL ────────────────────────────
    await appendLog(sb, taskId, { step: 'generate_start', msg: 'Generazione parallela: contenuto IT + immagine...' });

    const [contentRes, imageRes] = await Promise.allSettled([
      sb.functions.invoke('generate-blog-content', {
        body: { topic: item.title, keywords: keywords.join(', '), category, tone, length, search_intent, content_format },
      }),
      sb.functions.invoke('generate-blog-image', {
        body: { autoPrompt: { title: item.title, category } },
      }),
    ]);

    if (contentRes.status === 'rejected') {
      throw new Error(`Content generation failed: ${(contentRes as PromiseRejectedResult).reason}`);
    }
    if (contentRes.status === 'fulfilled' && contentRes.value?.error) {
      throw new Error(`Content generation failed: ${contentRes.value.error.message}`);
    }
    const gen = (contentRes as PromiseFulfilledResult<any>).value.data?.generated;
    if (!gen) throw new Error('No content generated');

    await appendLog(sb, taskId, { step: 'content_done', title: gen.title_it, words: gen.estimated_word_count, msg: `IT generato: "${gen.title_it}" (${gen.estimated_word_count} parole)` });

    // ── 5. Translate EN/DE/PT/ES ──────────────────────────────────────────────
    await appendLog(sb, taskId, { step: 'translate_start', msg: 'Traduzione in EN/DE/PT/ES...' });
    const translateRes = await sb.functions.invoke('translate-blog-post', {
      body: { title_it: gen.title_it, content_it: gen.content_it, meta_description_it: gen.meta_description_it },
    });
    if (translateRes.error) throw new Error(`Translation failed: ${translateRes.error.message}`);
    const translations = translateRes.data?.translations ?? {};
    await appendLog(sb, taskId, { step: 'translate_done', langs: Object.keys(translations), msg: `Tradotto in: ${Object.keys(translations).join(', ')}` });

    // ── Handle image ──────────────────────────────────────────────────────────
    let featuredImageUrl: string | null = null;
    if (imageRes.status === 'fulfilled' && imageRes.value?.data?.imageBase64) {
      try {
        const dataUrl: string = imageRes.value.data.imageBase64;
        const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
          let ext = mimeType.split('/')[1]?.toLowerCase() || 'png';
          if (ext === 'jpeg') ext = 'jpg';
          const fileName = `blog/${gen.slug || 'post'}-${Date.now()}.${ext}`;
          const { data: uploaded } = await sb.storage.from('blog-images').upload(fileName, bytes, { contentType: mimeType, upsert: false });
          if (uploaded) {
            const { data: urlData } = sb.storage.from('blog-images').getPublicUrl(fileName);
            featuredImageUrl = urlData?.publicUrl ?? null;
          }
        }
      } catch (imgErr) {
        console.error('Image upload failed (non-blocking):', imgErr);
      }
    }
    await appendLog(sb, taskId, { step: 'image_done', url: featuredImageUrl, msg: featuredImageUrl ? 'Immagine caricata' : 'Immagine non disponibile' });

    // ── 6. Save blog post ─────────────────────────────────────────────────────
    await appendLog(sb, taskId, { step: 'save', msg: 'Salvataggio articolo nel database...' });
    const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const baseSlug = gen.slug || slugify(gen.title_it);

    const postData = {
      title_it: gen.title_it, content_it: gen.content_it, meta_description_it: gen.meta_description_it,
      slug: baseSlug, slug_it: baseSlug,
      title_en: translations.en?.title || gen.title_it,
      content_en: translations.en?.content || gen.content_it,
      meta_description_en: translations.en?.meta_description || gen.meta_description_it,
      slug_en: slugify(translations.en?.title || gen.title_it),
      title_de: translations.de?.title || null, content_de: translations.de?.content || null,
      meta_description_de: translations.de?.meta_description || null,
      slug_de: translations.de?.title ? slugify(translations.de.title) : null,
      title_pt: translations.pt?.title || null, content_pt: translations.pt?.content || null,
      meta_description_pt: translations.pt?.meta_description || null,
      slug_pt: translations.pt?.title ? slugify(translations.pt.title) : null,
      title_es: translations.es?.title || null, content_es: translations.es?.content || null,
      meta_description_es: translations.es?.meta_description || null,
      slug_es: translations.es?.title ? slugify(translations.es.title) : null,
      category, status: 'draft', featured_image_url: featuredImageUrl,
      keywords: gen.keywords || [], faq_items: gen.faq_items || [],
      schema_type: gen.schema_type || 'Article', views: 0,
    };

    const { data: savedPost, error: saveError } = await sb.from('blog_posts').insert(postData).select().single();
    if (saveError) throw new Error(`Save failed: ${saveError.message}`);
    await appendLog(sb, taskId, { step: 'saved', post_id: savedPost.id, msg: `Articolo salvato (ID: ${savedPost.id})` });

    await sb.from('blog_queue').update({
      status: 'completed', generated_post_id: savedPost.id, processed_at: new Date().toISOString(),
    }).eq('id', item.id);

    // ── 7. Review swarm ───────────────────────────────────────────────────────
    await appendLog(sb, taskId, { step: 'review_start', msg: 'Avvio review swarm (7 agenti in parallelo)...' });
    const reviewRes = await sb.functions.invoke('article-review-swarm', { body: { post_id: savedPost.id, lang: 'en' } });
    const reviewScore = reviewRes.data?.score ?? 0;
    await appendLog(sb, taskId, { step: 'review_done', score: reviewScore, msg: `Review completata: score ${reviewScore}/100` });

    // ── 8. Auto publish ───────────────────────────────────────────────────────
    let published = false;
    if (reviewScore >= minScore) {
      await sb.from('blog_posts').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', savedPost.id);
      published = true;
      await appendLog(sb, taskId, { step: 'published', score: reviewScore, msg: `✅ Pubblicato! Score ${reviewScore} >= soglia ${minScore}` });
    } else {
      await appendLog(sb, taskId, { step: 'not_published', score: reviewScore, msg: `⚠️ Non pubblicato. Score ${reviewScore} < soglia ${minScore}. Rimane in draft.` });
    }

    await sb.from('agent_tasks').update({
      status: 'completed',
      summary: { post_id: savedPost.id, title: gen.title_it, score: reviewScore, published, languages: ['it', ...Object.keys(translations)], category, word_count: gen.estimated_word_count },
      score: reviewScore,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', taskId);

    log(taskId, `Done. Score: ${reviewScore}, published: ${published}`);
  } catch (err: any) {
    console.error(`[autopilot:${taskId?.slice(0, 8)}] Pipeline error:`, err);
    await sb.from('agent_tasks').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
      agents: (await sb.from('agent_tasks').select('agents').eq('id', taskId).single()).data?.agents ?? [],
    }).eq('id', taskId);
    await appendLog(sb, taskId, { step: 'error', msg: `Errore: ${err.message}` });
    await sb.from('blog_queue').update({ status: 'failed' }).eq('id', item.id);
  }
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const sb = supabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));
    const force       = body?.force === true;
    const queueItemId: string | null = body?.queue_item_id ?? null;

    // ── Guards (bypassed by force) ────────────────────────────────────────────
    const enabled = await getSetting(sb, 'autopilot_enabled', 'false');
    if (!force && enabled !== 'true') {
      return new Response(JSON.stringify({ skipped: true, reason: 'autopilot_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const minScore    = parseInt(await getSetting(sb, 'autopilot_min_score', '70'));
    const dailyLimit  = parseInt(await getSetting(sb, 'autopilot_daily_limit', '2'));
    const scheduleHours = await getSetting(sb, 'autopilot_schedule_hours', '9,15');

    if (!force && scheduleHours) {
      const allowedHours = scheduleHours.split(',').map((h: string) => parseInt(h.trim())).filter((h: number) => !isNaN(h));
      const currentHour = new Date().getUTCHours();
      if (allowedHours.length > 0 && !allowedHours.includes(currentHour)) {
        return new Response(JSON.stringify({ skipped: true, reason: 'outside_schedule', current_hour: currentHour }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!force) {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const { count: todayCount } = await sb.from('agent_tasks').select('*', { count: 'exact', head: true })
        .eq('type', 'content_generation').eq('status', 'completed').gte('completed_at', startOfDay.toISOString());
      if ((todayCount ?? 0) >= dailyLimit) {
        return new Response(JSON.stringify({ skipped: true, reason: 'daily_limit_reached', today: todayCount, limit: dailyLimit }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Pick queue item ───────────────────────────────────────────────────────
    let query = sb.from('blog_queue').select('*').eq('status', 'pending');
    if (queueItemId) {
      query = query.eq('id', queueItemId);
    } else {
      query = query.lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('scheduled_for', { ascending: true });
    }
    const { data: items } = await query.limit(1);

    if (!items?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: 'queue_empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const item = items[0];

    // ── Create task record + mark queue as processing ─────────────────────────
    const { data: task } = await sb.from('agent_tasks').insert({
      type: 'content_generation',
      status: 'running',
      input: { queue_id: item.id, title: item.title },
      agents: [{ ts: new Date().toISOString(), step: 'start', msg: `Avvio generazione: "${item.title}"` }],
    }).select().single();

    const taskId = task?.id ?? 'unknown';
    await sb.from('blog_queue').update({ status: 'processing' }).eq('id', item.id);

    // ── Return immediately, process in background ─────────────────────────────
    const pipeline = runPipeline(sb, item, taskId, minScore);
    const didSchedule = (globalThis as any).EdgeRuntime?.waitUntil?.(pipeline);
    if (!didSchedule) await pipeline; // fallback: run sync if EdgeRuntime not available

    return new Response(JSON.stringify({ started: true, task_id: taskId, title: item.title }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Autopilot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
