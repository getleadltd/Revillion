import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authorizeAdminRequest } from "../_shared/function-auth.ts";
import {
  jsonResponse,
  methodNotAllowed,
  pipelineCorsHeaders as corsHeaders,
} from "../_shared/pipeline-auth-core.ts";

// This endpoint used a non-atomic multi-item worker and is deliberately kept as
// an authenticated tombstone. Autopilot is the only supported queue writer.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return methodNotAllowed(corsHeaders);

  const auth = await authorizeAdminRequest(req, corsHeaders);
  if (!auth.ok) return auth.response;

  return jsonResponse(
    {
      error: "This queue worker is retired; use the Autopilot endpoint",
      code: "legacy_worker_retired",
    },
    410,
    corsHeaders,
  );
});
