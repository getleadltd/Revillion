/**
 * Autopilot Orchestrator — returns immediately, processes in background
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { authorizeAdminOrMachine } from "../_shared/function-auth.ts";
import {
  areIndependentMachineSecrets,
  AUTOPILOT_CRON_HEADER,
  AUTOPILOT_CRON_SECRET_ENV,
  AUTOPILOT_INTERNAL_SECRET_ENV,
  buildInternalFunctionHeaders,
  isStrongMachineSecret,
  jsonResponse,
  methodNotAllowed,
  pipelineCorsHeaders as corsHeaders,
} from "../_shared/pipeline-auth-core.ts";
import {
  hasMachineOnlyOverrides,
  hasReviewQuorum,
  isRequestBody,
  isUuid,
  normalizeScore,
  parseBoundedInteger,
  parseScheduleHours,
  utcHourSlot,
} from "../_shared/autopilot-policy.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function supabaseAdmin(serviceRoleKey: string) {
  return createClient(SUPABASE_URL, serviceRoleKey);
}

async function getSetting(sb: any, key: string, fallback = "") {
  const { data } = await sb.from("site_settings").select("value").eq("key", key)
    .single();
  return data?.value ?? fallback;
}

function log(taskId: string | null, msg: string) {
  console.log(`[autopilot${taskId ? ":" + taskId.slice(0, 8) : ""}] ${msg}`);
}

async function appendLog(sb: any, taskId: string, entry: object) {
  const { data: task } = await sb.from("agent_tasks").select("agents").eq(
    "id",
    taskId,
  ).single();
  const logs = Array.isArray(task?.agents) ? task.agents : [];
  logs.push({ ts: new Date().toISOString(), ...entry });
  await sb.from("agent_tasks").update({
    agents: logs,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId);
}

// ── Full pipeline (runs in background) ───────────────────────────────────────
async function runPipeline(
  sb: any,
  item: any,
  taskId: string,
  minScore: number,
  internalSecret: string,
  lovableApiKey: string,
) {
  const functionHeaders = buildInternalFunctionHeaders(
    internalSecret,
    SUPABASE_ANON_KEY,
  );

  try {
    // ── 3. Analyze title ──────────────────────────────────────────────────────
    await appendLog(sb, taskId, {
      step: "analyze",
      msg: "Analisi parametri articolo...",
    });
    const analyzeHttpRes = await fetch(
      `${SUPABASE_URL}/functions/v1/analyze-blog-title`,
      {
        method: "POST",
        headers: functionHeaders,
        redirect: "error",
        body: JSON.stringify({ title: item.title }),
      },
    );
    if (!analyzeHttpRes.ok) {
      const errText = await analyzeHttpRes.text();
      throw new Error(
        `Analyze failed: HTTP ${analyzeHttpRes.status} — ${
          errText.slice(0, 300)
        }`,
      );
    }
    const analyzeData = await analyzeHttpRes.json();
    const { category, keywords, tone, length, search_intent, content_format } =
      analyzeData;
    await appendLog(sb, taskId, {
      step: "analyze_done",
      category,
      keywords,
      msg: `Categoria: ${category}`,
    });

    // ── 4. Generate IT content + image IN PARALLEL ────────────────────────────
    await appendLog(sb, taskId, {
      step: "generate_start",
      msg: "Generazione parallela: contenuto IT + immagine...",
    });

    const [contentRes, imageRes] = await Promise.allSettled([
      fetch(`${SUPABASE_URL}/functions/v1/generate-blog-content`, {
        method: "POST",
        headers: functionHeaders,
        redirect: "error",
        body: JSON.stringify({
          topic: item.title,
          keywords: keywords.join(", "),
          category,
          tone,
          length,
          search_intent,
          content_format,
        }),
      }),
      fetch(`${SUPABASE_URL}/functions/v1/generate-blog-image`, {
        method: "POST",
        headers: functionHeaders,
        redirect: "error",
        body: JSON.stringify({ autoPrompt: { title: item.title, category } }),
      }),
    ]);

    if (contentRes.status === "rejected") {
      throw new Error(
        `Content generation failed: ${
          (contentRes as PromiseRejectedResult).reason
        }`,
      );
    }
    const contentHttpRes =
      (contentRes as PromiseFulfilledResult<Response>).value;
    if (!contentHttpRes.ok) {
      const errText = await contentHttpRes.text();
      throw new Error(
        `Content generation failed: HTTP ${contentHttpRes.status} — ${
          errText.slice(0, 300)
        }`,
      );
    }
    const genData = await contentHttpRes.json();
    const gen = genData?.generated;
    if (!gen) throw new Error("No content generated");

    await appendLog(sb, taskId, {
      step: "content_done",
      title: gen.title_it,
      words: gen.estimated_word_count,
      msg:
        `IT generato: "${gen.title_it}" (${gen.estimated_word_count} parole)`,
    });

    // ── Handle image ──────────────────────────────────────────────────────────
    let featuredImageUrl: string | null = null;
    let imageBase64: string | null = null;
    if (
      imageRes.status === "fulfilled" &&
      (imageRes as PromiseFulfilledResult<Response>).value.ok
    ) {
      try {
        const imgData = await (imageRes as PromiseFulfilledResult<Response>)
          .value.json();
        imageBase64 = imgData?.imageBase64 ?? null;
      } catch { /* non-blocking */ }
    }
    if (imageBase64) {
      try {
        const dataUrl: string = imageBase64;
        const match = dataUrl.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
        );
        if (match) {
          const mimeType = match[1];
          const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
          let ext = mimeType.split("/")[1]?.toLowerCase() || "png";
          if (ext === "jpeg") ext = "jpg";
          const fileName = `blog/${gen.slug || "post"}-${Date.now()}.${ext}`;
          const { data: uploaded } = await sb.storage.from("blog-images")
            .upload(fileName, bytes, { contentType: mimeType, upsert: false });
          if (uploaded) {
            const { data: urlData } = sb.storage.from("blog-images")
              .getPublicUrl(fileName);
            featuredImageUrl = urlData?.publicUrl ?? null;
          }
        }
      } catch (imgErr) {
        console.error("Image upload failed (non-blocking):", imgErr);
      }
    }
    await appendLog(sb, taskId, {
      step: "image_done",
      url: featuredImageUrl,
      msg: featuredImageUrl ? "Immagine caricata" : "Immagine non disponibile",
    });

    // ── 6. Save blog post (IT only — translations happen in background) ────────
    await appendLog(sb, taskId, {
      step: "save",
      msg: "Salvataggio articolo nel database (IT)...",
    });
    const slugify = (t: string) =>
      t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const baseSlug = gen.slug || slugify(gen.title_it);

    const truncateMeta = (m: string) =>
      m.length > 158 ? m.slice(0, 155).replace(/\s+\S*$/, "") + "…" : m;

    const postData = {
      title_it: gen.title_it,
      content_it: gen.content_it,
      meta_description_it: truncateMeta(gen.meta_description_it || ""),
      slug: baseSlug,
      slug_it: baseSlug,
      // EN fallback from IT (will be overwritten by async translation)
      title_en: gen.title_it,
      content_en: gen.content_it,
      meta_description_en: gen.meta_description_it,
      slug_en: baseSlug,
      category,
      status: "draft",
      featured_image_url: featuredImageUrl,
      featured_image_alt: gen.title_it || item.title,
      keywords: gen.keywords || [],
      faq_items: gen.faq_items || [],
      schema_type: gen.schema_type || "Article",
      views: 0,
    };

    let savedPostId: string | null = null;
    for (let attempt = 0; attempt < 2 && savedPostId === null; attempt++) {
      const { data: rawSavedPostId, error: saveError } = await sb.rpc(
        "create_and_link_autopilot_post",
        {
          p_post: postData,
          p_queue_item_id: item.id,
          p_task_id: taskId,
        },
      );
      const candidatePostId: unknown = rawSavedPostId;
      if (
        !saveError && typeof candidatePostId === "string" &&
        isUuid(candidatePostId)
      ) {
        savedPostId = candidatePostId;
      }
    }
    if (savedPostId === null) {
      throw new Error("Post creation failed");
    }
    await appendLog(sb, taskId, {
      step: "saved",
      post_id: savedPostId,
      msg:
        `Articolo salvato IT (ID: ${savedPostId}) — traduzione avviata in background`,
    });

    // ── 5b. Translate EN/DE/PT/ES in background (non-blocking) ────────────────
    const translationPromise = fetch(
      `${SUPABASE_URL}/functions/v1/translate-blog-post`,
      {
        method: "POST",
        headers: functionHeaders,
        redirect: "error",
        body: JSON.stringify({
          title: gen.title_it,
          content: gen.content_it,
          meta_description: gen.meta_description_it,
          source_language: "it",
        }),
      },
    ).then(async (r) => {
      if (r.ok) {
        const transData = await r.json();
        const translations = transData?.translations ?? {};
        if (Object.keys(translations).length > 0) {
          const update: Record<string, any> = {};
          if (translations.en) {
            update.title_en = translations.en.title;
            update.content_en = translations.en.content;
            update.meta_description_en = translations.en.meta_description;
            update.slug_en = slugify(translations.en.title || gen.title_it);
          }
          if (translations.de) {
            update.title_de = translations.de.title;
            update.content_de = translations.de.content;
            update.meta_description_de = translations.de.meta_description;
            update.slug_de = slugify(translations.de.title);
          }
          if (translations.pt) {
            update.title_pt = translations.pt.title;
            update.content_pt = translations.pt.content;
            update.meta_description_pt = translations.pt.meta_description;
            update.slug_pt = slugify(translations.pt.title);
          }
          if (translations.es) {
            update.title_es = translations.es.title;
            update.content_es = translations.es.content;
            update.meta_description_es = translations.es.meta_description;
            update.slug_es = slugify(translations.es.title);
          }
          if (Object.keys(update).length > 0) {
            const { error: translationSaveError } = await sb.from("blog_posts")
              .update(update).eq("id", savedPostId);
            if (translationSaveError) {
              console.error(
                `[autopilot] Background translation save failed for post ${savedPostId}`,
              );
            } else {
              console.log(
                `[autopilot] Translations saved for post ${savedPostId}: ${
                  Object.keys(translations).join(", ")
                }`,
              );
            }
          }
        }
      } else {
        console.error(`[autopilot] Background translation failed: ${r.status}`);
      }
    }).catch((e) =>
      console.error("[autopilot] Background translation error:", e)
    );

    // ── 7-8. Review → Fix loop (max 2 iterations) ────────────────────────────
    // Multilingual excluded: translations happen in background, can't be fixed here
    const EXCLUDE_AGENTS = ["multilingual"];
    const MAX_FIX_ITERATIONS = 3;
    const REQUIRED_REVIEW_AGENT_IDS = [
      "seo",
      "readability",
      "structure",
      "cta",
      "eeat",
      "image",
    ] as const;
    let reviewScore = 0;
    let reviewAgents: any[] = [];
    let reviewSucceeded = false;

    for (let iteration = 1; iteration <= MAX_FIX_ITERATIONS + 1; iteration++) {
      const isLastIteration = iteration === MAX_FIX_ITERATIONS + 1;
      await appendLog(sb, taskId, {
        step: "review_start",
        iteration,
        msg: `Review swarm (iterazione ${iteration})...`,
      });

      const reviewHttpRes = await fetch(
        `${SUPABASE_URL}/functions/v1/article-review-swarm`,
        {
          method: "POST",
          headers: functionHeaders,
          redirect: "error",
          body: JSON.stringify({
            post_id: savedPostId,
            lang: "it",
            exclude_agents: EXCLUDE_AGENTS,
          }),
        },
      );
      const reviewData: unknown = reviewHttpRes.ok
        ? await reviewHttpRes.json()
        : null;
      if (!hasReviewQuorum(reviewData, REQUIRED_REVIEW_AGENT_IDS)) {
        await appendLog(sb, taskId, {
          step: "review_failed",
          iteration,
          msg: "Review incompleta: quorum degli agenti non raggiunto",
        });
        throw new Error("Article review quorum not reached");
      }

      const reviewBody = reviewData as Record<string, unknown>;
      const reviewSummary = isRequestBody(reviewBody.summary)
        ? reviewBody.summary
        : {};
      reviewScore = normalizeScore(reviewBody.score);
      reviewAgents = Array.isArray(reviewBody.agents) ? reviewBody.agents : [];
      const reviewIssues = Array.isArray(reviewSummary.top_issues)
        ? reviewSummary.top_issues.filter((issue): issue is string =>
          typeof issue === "string"
        )
        : [];
      const reviewSuggestions = Array.isArray(reviewSummary.top_suggestions)
        ? reviewSummary.top_suggestions.filter((
          suggestion,
        ): suggestion is string => typeof suggestion === "string")
        : [];
      reviewSucceeded = true;
      await appendLog(sb, taskId, {
        step: "review_done",
        score: reviewScore,
        iteration,
        msg:
          `Review ${iteration}: score ${reviewScore}/100 — ${reviewIssues.length} problemi`,
      });

      // Stop looping only when no more issues or max iterations reached
      if (
        isLastIteration ||
        (reviewIssues.length === 0 && reviewSuggestions.length === 0)
      ) break;

      // ── Fix pass ────────────────────────────────────────────────────────────
      await appendLog(sb, taskId, {
        step: "fix_start",
        iteration,
        msg: `Auto-fix ${iteration}: applico ${
          reviewIssues.length + reviewSuggestions.length
        } correzioni...`,
      });
      try {
        const { data: currentPost } = await sb.from("blog_posts").select(
          "content_it, meta_description_it, title_it",
        ).eq("id", savedPostId).single();
        if (currentPost) {
          const agentFeedbackSection = reviewAgents.length > 0
            ? `\n\nANALISI DETTAGLIATA PER AGENTE:\n${
              reviewAgents.map((a: any) => {
                const feedback = a.result ?? a;
                const lines: string[] = [
                  `### ${a.name} (Score: ${a.score}/100)`,
                ];
                if (feedback.issues?.length) {
                  lines.push(`Problemi: ${feedback.issues.join(" | ")}`);
                }
                if (feedback.suggestions?.length) {
                  lines.push(
                    `Suggerimenti: ${feedback.suggestions.join(" | ")}`,
                  );
                }
                if (feedback.extra && Object.keys(feedback.extra).length > 0) {
                  lines.push(
                    `Dati extra: ${
                      Object.entries(feedback.extra).map(([k, v]) =>
                        `${k}: ${v}`
                      ).join(", ")
                    }`,
                  );
                }
                return lines.join("\n");
              }).join("\n\n")
            }`
            : "";

          const metaLen = currentPost.meta_description_it?.length ?? 0;
          const fixPrompt =
            `Sei un esperto editor di contenuti SEO per affiliati iGaming. Correggi questo articolo basandoti sui problemi identificati dagli agenti.

ARTICOLO DA CORREGGERE:
Titolo: ${currentPost.title_it}
Meta description attuale (${metaLen} caratteri): ${currentPost.meta_description_it}
Contenuto (HTML):
${currentPost.content_it}

PROBLEMI PRIORITARI DA CORREGGERE (OBBLIGATORI):
${reviewIssues.map((i: string, n: number) => `${n + 1}. ${i}`).join("\n")}

SUGGERIMENTI DA APPLICARE:
${
              reviewSuggestions.map((s: string, n: number) => `${n + 1}. ${s}`)
                .join("\n")
            }${agentFeedbackSection}

REGOLE PRECISE DA RISPETTARE (VERIFICA OBBLIGATORIA PRIMA DI RISPONDERE):
1. META DESCRIPTION: deve essere ESATTAMENTE tra 148 e 158 caratteri. Conta i caratteri uno per uno. Attuale: ${metaLen} caratteri. ${
              metaLen > 158
                ? `Devi ACCORCIARE di ${metaLen - 155} caratteri.`
                : metaLen < 148
                ? `Devi ALLUNGARE di ${148 - metaLen} caratteri.`
                : "Lunghezza ok."
            }
2. KEYWORD DENSITY: usa la keyword principale MAX 2 volte ogni 100 parole. Se appare più spesso, sostituisci con sinonimi (es. "segmenti di mercato", "verticali iGaming", "nicchie di gioco online").
3. FRASI CORTE: spezza ogni frase sopra 20 parole in due frasi separate. Usa punti, non virgole.
4. PARAGRAFI: max 3-4 frasi per paragrafo. Se un paragrafo ha 5+ frasi, dividilo.
5. Mantieni la stessa struttura HTML e i link interni esistenti.
6. Mantieni il link CTA a Revillion Partners: <a href="https://dashboard.revillion.com/en/registration">
7. Assicurati che ci siano almeno 2-3 CTA a Revillion Partners nel contenuto.
8. NON aggiungere statistiche o dati esterni non verificabili.

Rispondi SOLO con JSON valido (no markdown):
{"content_it": "<contenuto HTML corretto e completo>", "meta_description_it": "<meta description di 148-158 caratteri esatti>"}`;

          const fixRes = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${lovableApiKey}`,
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: fixPrompt }],
                max_tokens: 8192,
              }),
            },
          );

          if (fixRes.ok) {
            const fixText =
              (await fixRes.json()).choices?.[0]?.message?.content ?? "";
            const jsonMatch = fixText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const fixed = JSON.parse(jsonMatch[0]);
                if (fixed.content_it && fixed.content_it.length > 500) {
                  // Programmatic meta description truncation — AI can't count chars reliably
                  let metaFinal = fixed.meta_description_it ||
                    currentPost.meta_description_it || "";
                  if (metaFinal.length > 158) {
                    metaFinal = metaFinal.slice(0, 155).replace(/\s+\S*$/, "") +
                      "…";
                  }
                  const { error: fixSaveError } = await sb.from("blog_posts")
                    .update({
                      content_it: fixed.content_it,
                      meta_description_it: metaFinal,
                    }).eq("id", savedPostId);
                  if (fixSaveError) {
                    throw new Error("Corrected content could not be saved");
                  }
                  await appendLog(sb, taskId, {
                    step: "fix_done",
                    iteration,
                    msg:
                      `✅ Fix ${iteration} applicato (meta: ${metaFinal.length} chars)`,
                  });
                } else {
                  await appendLog(sb, taskId, {
                    step: "fix_skipped",
                    iteration,
                    msg: "Fix ignorato: risposta AI non valida",
                  });
                  break;
                }
              } catch {
                await appendLog(sb, taskId, {
                  step: "fix_skipped",
                  iteration,
                  msg: "Fix ignorato: JSON non parsabile",
                });
                break;
              }
            }
          } else {
            await appendLog(sb, taskId, {
              step: "fix_skipped",
              iteration,
              msg: `Fix non applicato: ${fixRes.status}`,
            });
            break;
          }
        }
      } catch (fixErr: any) {
        await appendLog(sb, taskId, {
          step: "fix_skipped",
          iteration,
          msg: `Fix non applicato: ${fixErr.message}`,
        });
        break;
      }
    }

    // Keep the translation work inside the lifetime tracked by runPipeline.
    // It still runs in parallel with review/fix, but must settle before the
    // pipeline completes (and before a post can be auto-published).
    await translationPromise;

    // ── 9. Auto publish ───────────────────────────────────────────────────────
    // Publication and the final task/queue state are committed by one RPC.
    const published = reviewSucceeded && reviewScore >= minScore;

    const summary = {
      post_id: savedPostId,
      title: gen.title_it,
      score: reviewScore,
      published,
      category,
      word_count: gen.estimated_word_count,
    };
    const { data: rawFinalized, error: finalizeError } = await sb.rpc(
      "complete_autopilot_queue_item",
      {
        p_post_id: savedPostId,
        p_queue_item_id: item.id,
        p_score: reviewScore,
        p_summary: summary,
        p_task_id: taskId,
        p_publish: published,
      },
    );
    const finalized: unknown = rawFinalized;
    if (finalizeError || finalized !== true) {
      throw new Error("Autopilot finalization failed");
    }

    log(taskId, `Done. Score: ${reviewScore}, published: ${published}`);
  } catch (err: any) {
    console.error(`[autopilot:${taskId?.slice(0, 8)}] Pipeline error:`, err);
    const failureMessage = err instanceof Error
      ? err.message
      : "Autopilot pipeline failed";
    const { data: rawFailed, error: failError } = await sb.rpc(
      "fail_autopilot_queue_item",
      {
        p_error_message: failureMessage,
        p_queue_item_id: item.id,
        p_task_id: taskId,
      },
    );
    const failed: unknown = rawFailed;
    if (failError || failed !== true) {
      console.error(
        `[autopilot:${
          taskId?.slice(0, 8)
        }] Failure state could not be persisted`,
      );
    }
  }
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return methodNotAllowed(corsHeaders);

  try {
    const auth = await authorizeAdminOrMachine(
      req,
      AUTOPILOT_CRON_HEADER,
      AUTOPILOT_CRON_SECRET_ENV,
      corsHeaders,
    );
    if (!auth.ok) return auth.response;

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const cronSecret = Deno.env.get(AUTOPILOT_CRON_SECRET_ENV);
    const internalSecret = Deno.env.get(AUTOPILOT_INTERNAL_SECRET_ENV);
    if (
      !SUPABASE_URL || !SUPABASE_ANON_KEY || !serviceRoleKey ||
      !lovableApiKey ||
      !isStrongMachineSecret(internalSecret) ||
      !await areIndependentMachineSecrets(cronSecret, internalSecret)
    ) {
      console.error("Autopilot server credentials are not configured");
      return jsonResponse(
        { error: "Autopilot service unavailable" },
        503,
        corsHeaders,
      );
    }

    const rawBody = await req.text();
    let parsedBody: unknown = {};
    if (rawBody.trim()) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
      }
    }
    if (!isRequestBody(parsedBody)) {
      return jsonResponse({ error: "Invalid request body" }, 400, corsHeaders);
    }
    const body = parsedBody;

    if (auth.identity.kind === "m2m" && hasMachineOnlyOverrides(body)) {
      return jsonResponse(
        { error: "Scheduled requests cannot override execution guards" },
        400,
        corsHeaders,
      );
    }
    if (Object.hasOwn(body, "force") && typeof body.force !== "boolean") {
      return jsonResponse({ error: "Invalid force value" }, 400, corsHeaders);
    }

    const force = auth.identity.kind === "admin" && body.force === true;
    const rawQueueItemId = body.queue_item_id;
    if (
      rawQueueItemId !== undefined && rawQueueItemId !== null &&
      (typeof rawQueueItemId !== "string" || !isUuid(rawQueueItemId))
    ) {
      return jsonResponse({ error: "Invalid queue item id" }, 400, corsHeaders);
    }
    const queueItemId = typeof rawQueueItemId === "string"
      ? rawQueueItemId
      : null;
    if (queueItemId && !force) {
      return jsonResponse(
        { error: "Selecting a queue item requires an admin forced run" },
        400,
        corsHeaders,
      );
    }

    const sb = supabaseAdmin(serviceRoleKey);

    // ── Guards (bypassed by force) ────────────────────────────────────────────
    const enabled = await getSetting(sb, "autopilot_enabled", "false");
    if (!force && enabled !== "true") {
      return jsonResponse(
        { skipped: true, reason: "autopilot_disabled" },
        200,
        corsHeaders,
      );
    }

    const minScore = parseBoundedInteger(
      await getSetting(sb, "autopilot_min_score", "70"),
      1,
      100,
    );
    const dailyLimit = parseBoundedInteger(
      await getSetting(sb, "autopilot_daily_limit", "2"),
      1,
      10,
    );
    if (minScore === null || dailyLimit === null) {
      console.error("Autopilot numeric settings are invalid");
      return jsonResponse(
        { error: "Autopilot configuration is invalid" },
        503,
        corsHeaders,
      );
    }

    const now = new Date();
    let scheduleSlot: string | null = null;
    if (!force) {
      const schedule = parseScheduleHours(
        await getSetting(sb, "autopilot_schedule_hours", ""),
      );
      if (!schedule.valid) {
        console.error("Autopilot schedule setting is invalid");
        return jsonResponse(
          { error: "Autopilot configuration is invalid" },
          503,
          corsHeaders,
        );
      }
      if (schedule.hours.length === 0) {
        return jsonResponse(
          { skipped: true, reason: "schedule_not_configured" },
          200,
          corsHeaders,
        );
      }

      const currentHour = now.getUTCHours();
      if (!schedule.hours.includes(currentHour)) {
        return jsonResponse(
          {
            skipped: true,
            reason: "outside_schedule",
            current_hour: currentHour,
          },
          200,
          corsHeaders,
        );
      }
      scheduleSlot = utcHourSlot(now);
    }

    // Queue reservation, quota enforcement, slot dedupe, and task creation are
    // one database transaction. The RPC is executable by service_role only.
    const { data: rawClaim, error: claimError } = await sb.rpc(
      "claim_autopilot_queue_item",
      {
        p_daily_limit: dailyLimit,
        p_force: force,
        p_queue_item_id: queueItemId,
        p_schedule_slot: scheduleSlot,
      },
    ).single();

    if (
      claimError || !isRequestBody(rawClaim) ||
      typeof rawClaim.outcome !== "string"
    ) {
      console.error("Autopilot queue claim failed");
      return jsonResponse(
        { error: "Autopilot queue claim failed" },
        500,
        corsHeaders,
      );
    }
    const claim = rawClaim;

    if (claim?.outcome !== "started") {
      return jsonResponse(
        {
          skipped: true,
          reason: claim?.outcome ?? "queue_empty",
          ...(claim?.outcome === "daily_limit_reached"
            ? { today: claim.today_count, limit: dailyLimit }
            : {}),
        },
        200,
        corsHeaders,
      );
    }

    const item = claim.queue_item;
    const taskId = claim.task_id;
    if (
      !isRequestBody(item) || typeof item.id !== "string" ||
      typeof item.title !== "string" ||
      typeof taskId !== "string"
    ) {
      console.error("Autopilot queue claim returned an invalid payload");
      return jsonResponse(
        { error: "Autopilot queue claim failed" },
        500,
        corsHeaders,
      );
    }

    // ── Return immediately, process in background ─────────────────────────────
    const pipeline = runPipeline(
      sb,
      item,
      taskId,
      minScore,
      internalSecret,
      lovableApiKey,
    );
    const edgeRuntime = (globalThis as typeof globalThis & {
      EdgeRuntime?: { waitUntil: (promise: Promise<unknown>) => void };
    }).EdgeRuntime;
    if (typeof edgeRuntime?.waitUntil === "function") {
      edgeRuntime.waitUntil(pipeline);
    } else {
      await pipeline; // fallback: run sync if EdgeRuntime is not available
    }

    return jsonResponse(
      { started: true, task_id: taskId, title: item.title },
      200,
      corsHeaders,
    );
  } catch (error: any) {
    console.error("Autopilot error:", error);
    return jsonResponse(
      { error: "Autopilot request failed" },
      500,
      corsHeaders,
    );
  }
});
