export const AUTOPILOT_CRON_HEADER = "x-autopilot-cron-secret";
export const AUTOPILOT_CRON_SECRET_ENV = "AUTOPILOT_CRON_SECRET";
export const AUTOPILOT_INTERNAL_HEADER = "x-autopilot-internal-secret";
export const AUTOPILOT_INTERNAL_SECRET_ENV = "AUTOPILOT_INTERNAL_SECRET";

const MIN_SECRET_BYTES = 32;
const MAX_SECRET_BYTES = 512;
const encoder = new TextEncoder();

export const pipelineCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  // Machine credentials are intentionally omitted. They are never browser credentials.
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
} as const;

export type AdminVerification =
  | { status: "authorized"; userId: string }
  | { status: "invalid" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export type PipelineIdentity =
  | { kind: "admin"; userId: string }
  | { kind: "m2m" };

export type PipelineAuthResult =
  | { ok: true; identity: PipelineIdentity }
  | { ok: false; response: Response };

interface PipelineAuthOptions {
  m2mHeaderName: string;
  m2mSecretEnvName: string;
  getSecret: (name: string) => string | undefined;
  validateMachineConfiguration?: () => Promise<boolean>;
  verifyAdmin: (authorization: string) => Promise<AdminVerification>;
  responseHeaders?: HeadersInit;
}

function byteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

export function isStrongMachineSecret(
  value: string | undefined,
): value is string {
  if (!value || value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) {
    return false;
  }
  const bytes = byteLength(value);
  return bytes >= MIN_SECRET_BYTES && bytes <= MAX_SECRET_BYTES;
}

export async function constantTimeSecretEqual(
  left: string,
  right: string,
): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);

  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index++) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

export async function areIndependentMachineSecrets(
  first: string | undefined,
  second: string | undefined,
): Promise<boolean> {
  if (!isStrongMachineSecret(first) || !isStrongMachineSecret(second)) {
    return false;
  }
  return !await constantTimeSecretEqual(first, second);
}

export function jsonResponse(
  payload: unknown,
  status = 200,
  headers: HeadersInit = pipelineCorsHeaders,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...Object.fromEntries(new Headers(headers)),
      "Content-Type": "application/json",
    },
  });
}

export function methodNotAllowed(
  headers: HeadersInit = pipelineCorsHeaders,
): Response {
  return jsonResponse({ error: "Method not allowed" }, 405, headers);
}

export async function authorizeAdminRequest(
  req: Request,
  verifyAdmin: (authorization: string) => Promise<AdminVerification>,
  headers: HeadersInit = pipelineCorsHeaders,
): Promise<PipelineAuthResult> {
  const authorization = req.headers.get("authorization");
  if (!authorization || !/^Bearer [^\s]+$/.test(authorization)) {
    return {
      ok: false,
      response: jsonResponse(
        { error: "Authentication required" },
        401,
        headers,
      ),
    };
  }

  let verification: AdminVerification;
  try {
    verification = await verifyAdmin(authorization);
  } catch {
    verification = { status: "unavailable" };
  }

  switch (verification.status) {
    case "authorized":
      return {
        ok: true,
        identity: { kind: "admin", userId: verification.userId },
      };
    case "invalid":
      return {
        ok: false,
        response: jsonResponse(
          { error: "Invalid authentication" },
          401,
          headers,
        ),
      };
    case "forbidden":
      return {
        ok: false,
        response: jsonResponse(
          { error: "Admin access required" },
          403,
          headers,
        ),
      };
    case "unavailable":
      return {
        ok: false,
        response: jsonResponse(
          { error: "Authentication service unavailable" },
          503,
          headers,
        ),
      };
  }
}

export async function authorizePipelineRequest(
  req: Request,
  options: PipelineAuthOptions,
): Promise<PipelineAuthResult> {
  const headers = options.responseHeaders ?? pipelineCorsHeaders;
  const presentedMachineSecret = req.headers.get(options.m2mHeaderName);

  // A supplied machine header always selects the M2M path. Never fall back to a
  // bearer token when that header is invalid, which avoids credential smuggling.
  if (presentedMachineSecret !== null) {
    if (
      options.validateMachineConfiguration &&
      !await options.validateMachineConfiguration()
    ) {
      return {
        ok: false,
        response: jsonResponse(
          { error: "Authentication service unavailable" },
          503,
          headers,
        ),
      };
    }

    const configuredMachineSecret = options.getSecret(options.m2mSecretEnvName);
    if (!isStrongMachineSecret(configuredMachineSecret)) {
      return {
        ok: false,
        response: jsonResponse(
          { error: "Authentication service unavailable" },
          503,
          headers,
        ),
      };
    }

    if (
      byteLength(presentedMachineSecret) > MAX_SECRET_BYTES ||
      !await constantTimeSecretEqual(
        presentedMachineSecret,
        configuredMachineSecret,
      )
    ) {
      return {
        ok: false,
        response: jsonResponse(
          { error: "Invalid authentication" },
          401,
          headers,
        ),
      };
    }

    return { ok: true, identity: { kind: "m2m" } };
  }

  return authorizeAdminRequest(req, options.verifyAdmin, headers);
}

export function buildInternalFunctionHeaders(
  internalSecret: string,
  anonKey: string,
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "apikey": anonKey,
    [AUTOPILOT_INTERNAL_HEADER]: internalSecret,
  };
}
