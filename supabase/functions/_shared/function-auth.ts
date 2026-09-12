import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import {
  type AdminVerification,
  areIndependentMachineSecrets,
  authorizeAdminRequest as authorizeAdminRequestCore,
  authorizePipelineRequest,
  AUTOPILOT_CRON_SECRET_ENV,
  AUTOPILOT_INTERNAL_SECRET_ENV,
  type PipelineAuthResult,
  pipelineCorsHeaders,
} from "./pipeline-auth-core.ts";

async function verifySupabaseAdmin(
  authorization: string,
): Promise<AdminVerification> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase authentication is not configured");
    return { status: "unavailable" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "invalid" };

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (roleError) {
    console.error("Admin role verification failed");
    return { status: "unavailable" };
  }
  if (isAdmin !== true) return { status: "forbidden" };
  return { status: "authorized", userId: user.id };
}

export function authorizeAdminOrMachine(
  req: Request,
  m2mHeaderName: string,
  m2mSecretEnvName: string,
  responseHeaders: HeadersInit = pipelineCorsHeaders,
): Promise<PipelineAuthResult> {
  return authorizePipelineRequest(req, {
    m2mHeaderName,
    m2mSecretEnvName,
    getSecret: (name) => Deno.env.get(name),
    validateMachineConfiguration: () =>
      areIndependentMachineSecrets(
        Deno.env.get(AUTOPILOT_CRON_SECRET_ENV),
        Deno.env.get(AUTOPILOT_INTERNAL_SECRET_ENV),
      ),
    verifyAdmin: verifySupabaseAdmin,
    responseHeaders,
  });
}

export function authorizeAdminRequest(
  req: Request,
  responseHeaders: HeadersInit = pipelineCorsHeaders,
): Promise<PipelineAuthResult> {
  return authorizeAdminRequestCore(req, verifySupabaseAdmin, responseHeaders);
}
