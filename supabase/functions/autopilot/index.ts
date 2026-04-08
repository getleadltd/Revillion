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

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

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
    const analyzeHttpRes = await fetch(`${SUPABASE_URL}/functions/v1/analyze-blog-title`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ title: item.title }),
    });
    if (!analyzeHttpRes.ok) {
      const errText = await analyzeHttpRes.text();
      throw new Error(`Analyze failed: HTTP ${analyzeHttpRes.status} — ${errText.slice(0, 300)}`);
    }
    const analyzeData = await analyzeHttpRes.json();
    const { category, keywords, tone, length, search_intent, content_format } = analyzeData;
    await appendLog(sb, taskId, { step: 'analyze_done', category, keywords, msg: `Categoria: ${category}` });

    // ── 4. Generate IT content + image IN PARALLEL ────────────────────────────
    await appendLog(sb, taskId, { step: 'generate_start', msg: 'Generazione parallela: contenuto IT + immagine...' });

    const [contentRes, imageRes] = await Promise.allSettled([
      fetch(`${SUPABASE_URL}/functions/v1/generate-blog-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ topic: item.title, keywords: keywords.join(', '), category, tone, length, search_intent, content_format }),
      }),
      fetch(`${SUPABASE_URL}/functions/v1/generate-blog-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ autoPrompt: { title: item.title, category } }),
      }),
    ]);

    if (contentRes.status === 'rejected') {
      throw new Error(`Content generation failed: ${(contentRes as PromiseRejectedResult).reason}`);
    }
    const contentHttpRes = (contentRes as PromiseFulfilledResult<Response>).value;
    if (!contentHttpRes.ok) {
      const errText = await contentHttpRes.text();
      throw new Error(`Content generation failed: HTTP ${contentHttpRes.status} — ${errText.slice(0, 300)}`);
    }
    const genData = await contentHttpRes.json();
    const gen = genData?.generated;
    if (!gen) throw new Error('No content generated');

    await appendLog(sb, taskId, { step: 'content_done', title: gen.title_it, words: gen.estimated_word_count, msg: `IT generato: "${gen.title_it}" (${gen.estimated_word_count} parole)` });

    // ── Handle image ──────────────────────────────────────────────────────────
    let featuredImageUrl: string | null = null;
    let imageBase64: string | null = null;
    if (imageRes.status === 'fulfilled' && (imageRes as PromiseFulfilledResult<Response>).value.ok) {
      try {
        const imgData = await (imageRes as PromiseFulfilledResult<Response>).value.json();
        imageBase64 = imgData?.imageBase64 ?? null;
      } catch { /* non-blocking */ }
    }
    if (imageBase64) {
      try {
        const dataUrl: string = imageBase64;
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

    // ── 6. Save blog post (IT only — translations happen in background) ────────
    await appendLog(sb, taskId, { step: 'save', msg: 'Salvataggio articolo nel database (IT)...' });
    const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const baseSlug = gen.slug || slugify(gen.title_it);

    const postData = {
      title_it: gen.title_it, content_it: gen.content_it, meta_description_it: gen.meta_description_it,
      slug: baseSlug, slug_it: baseSlug,
      // EN fallback from IT (will be overwritten by async translation)
      title_en: gen.title_it, content_en: gen.content_it,
      meta_description_en: gen.meta_description_it,
      slug_en: baseSlug,
      category, status: 'draft', featured_image_url: featuredImageUrl,
      featured_image_alt: gen.title_it || item.title,
      keywords: gen.keywords || [], faq_items: gen.faq_items || [],
      schema_type: gen.schema_type || 'Article', views: 0,
    };

    const { data: savedPost, error: saveError } = await sb.from('blog_posts').insert(postData).select().single();
    if (saveError) throw new Error(`Save failed: ${saveError.message}`);
    await appendLog(sb, taskId, { step: 'saved', post_id: savedPost.id, msg: `Articolo salvato IT (ID: ${savedPost.id}) — traduzione avviata in background` });

    await sb.from('blog_queue').update({
      status: 'completed', generated_post_id: savedPost.id, processed_at: new Date().toISOString(),
    }).eq('id', item.id);

    // ── 5b. Translate EN/DE/PT/ES in background (non-blocking) ────────────────
    fetch(`${SUPABASE_URL}/functions/v1/translate-blog-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({
        post_id: savedPost.id,
        title_it: gen.title_it, content_it: gen.content_it, meta_description_it: gen.meta_description_it,
      }),
    }).then(async (r) => {
      if (r.ok) {
        const transData = await r.json();
        const translations = transData?.translations ?? {};
        if (Object.keys(translations).length > 0) {
          const update: Record<string, any> = {};
          if (translations.en) { update.title_en = translations.en.title; update.content_en = translations.en.content; update.meta_description_en = translations.en.meta_description; update.slug_en = slugify(translations.en.title || gen.title_it); }
          if (translations.de) { update.title_de = translations.de.title; update.content_de = translations.de.content; update.meta_description_de = translations.de.meta_description; update.slug_de = slugify(translations.de.title); }
          if (translations.pt) { update.title_pt = translations.pt.title; update.content_pt = translations.pt.content; update.meta_description_pt = translations.pt.meta_description; update.slug_pt = slugify(translations.pt.title); }
          if (translations.es) { update.title_es = translations.es.title; update.content_es = translations.es.content; update.meta_description_es = translations.es.meta_description; update.slug_es = slugify(translations.es.title); }
          if (Object.keys(update).length > 0) {
            await sb.from('blog_posts').update(update).eq('id', savedPost.id);
            console.log(`[autopilot] Translations saved for post ${savedPost.id}: ${Object.keys(translations).join(', ')}`);
          }
        }
      } else {
        console.error(`[autopilot] Background translation failed: ${r.status}`);
      }
    }).catch((e) => console.error('[autopilot] Background translation error:', e));

    // ── 7-8. Review → Fix loop (max 2 iterations) ────────────────────────────
    // Multilingual excluded: translations happen in background, can't be fixed here
    const EXCLUDE_AGENTS = ['multilingual'];
    const MAX_FIX_ITERATIONS = 3;
    let reviewScore = 0;
    let reviewAgents: any[] = [];

    for (let iteration = 1; iteration <= MAX_FIX_ITERATIONS + 1; iteration++) {
      const isLastIteration = iteration === MAX_FIX_ITERATIONS + 1;
      await appendLog(sb, taskId, { step: 'review_start', iteration, msg: `Review swarm (iterazione ${iteration})...` });

      const reviewHttpRes = await fetch(`${SUPABASE_URL}/functions/v1/article-review-swarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ post_id: savedPost.id, lang: 'it', exclude_agents: EXCLUDE_AGENTS }),
      });
      const reviewData = reviewHttpRes.ok ? await reviewHttpRes.json() : { score: 0 };
      reviewScore = reviewData?.score ?? 0;
      reviewAgents = reviewData?.agents ?? [];
      const reviewIssues: string[] = reviewData?.summary?.top_issues ?? [];
      const reviewSuggestions: string[] = reviewData?.summary?.top_suggestions ?? [];
      await appendLog(sb, taskId, { step: 'review_done', score: reviewScore, iteration, msg: `Review ${iteration}: score ${reviewScore}/100 — ${reviewIssues.length} problemi` });

      // Stop looping only when no more issues or max iterations reached
      if (isLastIteration || (reviewIssues.length === 0 && reviewSuggestions.length === 0)) break;

      // ── Fix pass ────────────────────────────────────────────────────────────
      await appendLog(sb, taskId, { step: 'fix_start', iteration, msg: `Auto-fix ${iteration}: applico ${reviewIssues.length + reviewSuggestions.length} correzioni...` });
      try {
        const { data: currentPost } = await sb.from('blog_posts').select('content_it, meta_description_it, title_it').eq('id', savedPost.id).single();
        if (currentPost) {
          const agentFeedbackSection = reviewAgents.length > 0
            ? `\n\nANALISI DETTAGLIATA PER AGENTE:\n${reviewAgents.map((a: any) => {
                const lines: string[] = [`### ${a.name} (Score: ${a.score}/100)`];
                if (a.issues?.length) lines.push(`Problemi: ${a.issues.join(' | ')}`);
                if (a.suggestions?.length) lines.push(`Suggerimenti: ${a.suggestions.join(' | ')}`);
                if (a.extra && Object.keys(a.extra).length > 0) {
                  lines.push(`Dati extra: ${Object.entries(a.extra).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
                }
                return lines.join('\n');
              }).join('\n\n')}`
            : '';

          const fixPrompt = `Sei un esperto editor di contenuti SEO per affiliati iGaming. Correggi questo articolo basandoti sui problemi identificati dagli agenti.

ARTICOLO DA CORREGGERE:
Titolo: ${currentPost.title_it}
Meta description: ${currentPost.meta_description_it}
Contenuto (HTML):
${currentPost.content_it}

PROBLEMI PRIORITARI DA CORREGGERE (OBBLIGATORI):
${reviewIssues.map((i: string, n: number) => `${n + 1}. ${i}`).join('\n')}

SUGGERIMENTI DA APPLICARE:
${reviewSuggestions.map((s: string, n: number) => `${n + 1}. ${s}`).join('\n')}${agentFeedbackSection}

REGOLE GENERALI:
- Mantieni la stessa struttura HTML e i link interni esistenti
- Mantieni il link CTA a Revillion Partners: <a href="https://dashboard.revillion.com/en/registration">
- NON menzionare competitor (Income Access, Bet365, ecc.)
- Aggiungi definizione di iGaming al primo utilizzo se mancante
- Spezza frasi lunghe in frasi più corte (max 20 parole)
- Assicurati che l'articolo sia COMPLETO (introduzione + corpo + conclusione + FAQ presenti)
- Meta description: 148-158 caratteri, include keyword + benefit + CTA
- Se il word count è basso, espandi le sezioni principali con dettagli pratici
- Se mancano CTA, aggiungi almeno 2-3 call to action a Revillion Partners
- Se la leggibilità è scarsa, usa più punti elenco e sottotitoli H3

Rispondi SOLO con JSON valido (no markdown):
{"content_it": "<contenuto HTML corretto e completo>", "meta_description_it": "<meta description corretta>"}`;

          const fixRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
            body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: fixPrompt }], max_tokens: 8192 }),
          });

          if (fixRes.ok) {
            const fixText = (await fixRes.json()).choices?.[0]?.message?.content ?? '';
            const jsonMatch = fixText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const fixed = JSON.parse(jsonMatch[0]);
                if (fixed.content_it && fixed.content_it.length > 500) {
                  await sb.from('blog_posts').update({
                    content_it: fixed.content_it,
                    ...(fixed.meta_description_it ? { meta_description_it: fixed.meta_description_it } : {}),
                  }).eq('id', savedPost.id);
                  await appendLog(sb, taskId, { step: 'fix_done', iteration, msg: `✅ Fix ${iteration} applicato` });
                } else {
                  await appendLog(sb, taskId, { step: 'fix_skipped', iteration, msg: 'Fix ignorato: risposta AI non valida' });
                  break;
                }
              } catch { await appendLog(sb, taskId, { step: 'fix_skipped', iteration, msg: 'Fix ignorato: JSON non parsabile' }); break; }
            }
          } else {
            await appendLog(sb, taskId, { step: 'fix_skipped', iteration, msg: `Fix non applicato: ${fixRes.status}` });
            break;
          }
        }
      } catch (fixErr: any) {
        await appendLog(sb, taskId, { step: 'fix_skipped', iteration, msg: `Fix non applicato: ${fixErr.message}` });
        break;
      }
    }

    // ── 9. Auto publish ───────────────────────────────────────────────────────
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
      summary: { post_id: savedPost.id, title: gen.title_it, score: reviewScore, published, category, word_count: gen.estimated_word_count },
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
