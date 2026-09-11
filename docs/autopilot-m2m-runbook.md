# Autopilot M2M release runbook

This document describes the future production rollout. Committing these files does **not** deploy Edge Functions, apply the migration, create a cron job, process the queue, or configure secrets.

## Security model

- `AUTOPILOT_CRON_SECRET` authenticates only the scheduler request to `autopilot` through `x-autopilot-cron-secret`.
- `AUTOPILOT_INTERNAL_SECRET` authenticates only `autopilot` calls to the five pipeline functions through `x-autopilot-internal-secret`.
- Use two independently generated secrets with at least 32 random bytes. Never reuse the service-role key, anon key, a user JWT, or the Meta token.
- The orchestrator fails closed if the two configured M2M secrets are equal, missing, malformed, or outside the accepted length range.
- Do not expose either M2M header through CORS, logs, source control, workflow output, or chat.
- `process-blog-queue` is retained only as an authenticated `410 Gone` tombstone. It must never process queue rows; `autopilot` is the sole supported worker.

## Required order of operations

1. Keep `process-blog-queue-automation` disabled, keep the Autopilot setting disabled, and prohibit manual “Run now” calls during deployment. Do not re-enable or delete the legacy job during this rollout.
2. Back up and preflight the database, then separately approve and apply `20260911120000_add_atomic_autopilot_claim.sql`.
3. Deploy the safe frontend controls before enabling any M2M execution. Cached or stale clients are additionally constrained by the migration's queue/task integrity triggers.
4. Configure both Edge secrets through the approved secret-management path. Store only the cron credential in Supabase Vault for `pg_cron`; do not copy the internal credential into Vault.
5. Verify presence and minimum length without printing either value.
6. Deploy the retired `process-blog-queue` tombstone and the five child functions first: `analyze-blog-title`, `generate-blog-content`, `generate-blog-image`, `translate-blog-post`, and `article-review-swarm`. Deploy `autopilot` last. The deployment workflow enforces dependency-first ordering because Edge deployments are sequential, not atomic.
7. Test authentication without queue work:
   - missing, malformed, and incorrect credentials are rejected;
   - a valid admin session still reaches the handler;
   - a cron credential with `force` or `queue_item_id` is rejected;
   - no test request is allowed to claim a production queue item.
8. In a controlled non-production queue, verify one successful claim, concurrent claim exclusion, failed-attempt quota reservation, stale/current hour-slot enforcement, hour-slot deduplication, atomic post creation/linking, atomic success/failure finalization, review quorum enforcement, and downstream authentication.
9. Add an alert for `content_generation` tasks left `running` or queue rows left `processing` beyond the agreed runtime threshold. A runtime crash is intentionally fail-closed; never auto-reset a stale row, and reconcile its linked post/task/queue IDs before any state change.
10. Decide explicitly how to handle the production backlog before any production invocation.
11. Only after a separate approval, create a new cron job that sends `POST {SUPABASE_URL}/functions/v1/autopilot`, body `{}`, and the cron header obtained from Vault. Do not include `force` or `queue_item_id`.
12. Confirm the cron expression and `autopilot_schedule_hours` agree in UTC. A job that polls more than once in an allowed hour is safe but redundant because the database permits only one scheduled start per UTC hour slot.
13. Monitor rejected M2M requests and rotate both credentials independently on a defined schedule. Treat any unexpected internal-header use as a compromise signal and keep Autopilot disabled during rotation.

## Validation gates

- `deno test --no-remote --no-npm supabase/functions/_shared/pipeline-auth_test.ts`
- `deno check supabase/functions/*/index.ts`
- frontend production build
- migration lint/dry run against a disposable Supabase database
- production preflight confirms the legacy cron is still inactive and the queue counts are unchanged

## Rollback

Before the first production invocation:

- disable the new cron if one was created;
- with all invocations disabled, redeploy the previous `autopilot` first and then the previous child functions;
- keep the legacy cron disabled;
- after confirming no running Autopilot task exists, separately approve dropping the four Autopilot RPCs (`claim`, `create_and_link`, `complete`, `fail`), both integrity triggers and their trigger functions, and `agent_tasks_autopilot_schedule_slot_key` if database rollback is required;
- do not reset queue statuses or delete task/post rows automatically. Reconcile any claimed item by ID first.

Publication/draft retention, task completion, and queue completion are committed by one finalizer transaction. After any production invocation, rollback still requires a read-only reconciliation of `blog_queue`, `agent_tasks`, and linked `blog_posts` before changing data.
