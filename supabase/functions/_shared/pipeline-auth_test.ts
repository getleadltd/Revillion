import assert from "node:assert/strict";
import {
  type AdminVerification,
  areIndependentMachineSecrets,
  authorizePipelineRequest,
  AUTOPILOT_CRON_HEADER,
  AUTOPILOT_INTERNAL_HEADER,
  buildInternalFunctionHeaders,
  constantTimeSecretEqual,
  isStrongMachineSecret,
  pipelineCorsHeaders,
} from "./pipeline-auth-core.ts";
import {
  hasMachineOnlyOverrides,
  hasReviewQuorum,
  isUuid,
  isValidReviewAgentResult,
  normalizeScore,
  parseBoundedInteger,
  parseScheduleHours,
  utcHourSlot,
} from "./autopilot-policy.ts";

const configuredSecret = "a-secure-machine-secret-with-32-bytes-minimum";

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://example.test/functions/v1/autopilot", {
    method: "POST",
    headers,
  });
}

function authorize(
  req: Request,
  verification: AdminVerification = { status: "invalid" },
  secret: string | null = configuredSecret,
) {
  return authorizePipelineRequest(req, {
    m2mHeaderName: AUTOPILOT_CRON_HEADER,
    m2mSecretEnvName: "AUTOPILOT_CRON_SECRET",
    getSecret: () => secret ?? undefined,
    verifyAdmin: async () => verification,
  });
}

Deno.test("machine secret comparison accepts only the exact value", async () => {
  assert.equal(
    await constantTimeSecretEqual(configuredSecret, configuredSecret),
    true,
  );
  assert.equal(
    await constantTimeSecretEqual(configuredSecret, `${configuredSecret}x`),
    false,
  );
  assert.equal(
    await constantTimeSecretEqual(`x${configuredSecret}`, configuredSecret),
    false,
  );
});

Deno.test("machine secrets must be bounded, trimmed, and free of control bytes", () => {
  assert.equal(isStrongMachineSecret("x".repeat(31)), false);
  assert.equal(isStrongMachineSecret("x".repeat(32)), true);
  assert.equal(isStrongMachineSecret(` ${"x".repeat(32)}`), false);
  assert.equal(isStrongMachineSecret(`${"x".repeat(32)}\n`), false);
  assert.equal(isStrongMachineSecret("x".repeat(513)), false);
});

Deno.test("cron and internal credentials must be strong and independent", async () => {
  assert.equal(
    await areIndependentMachineSecrets(configuredSecret, configuredSecret),
    false,
  );
  assert.equal(
    await areIndependentMachineSecrets(
      configuredSecret,
      `${configuredSecret}-internal`,
    ),
    true,
  );
  assert.equal(
    await areIndependentMachineSecrets(
      "too-short",
      `${configuredSecret}-internal`,
    ),
    false,
  );
});

Deno.test("valid M2M authentication never calls the admin verifier", async () => {
  let adminVerifierCalled = false;
  const result = await authorizePipelineRequest(
    request({ [AUTOPILOT_CRON_HEADER]: configuredSecret }),
    {
      m2mHeaderName: AUTOPILOT_CRON_HEADER,
      m2mSecretEnvName: "AUTOPILOT_CRON_SECRET",
      getSecret: () => configuredSecret,
      verifyAdmin: async () => {
        adminVerifierCalled = true;
        return { status: "authorized", userId: "unexpected" };
      },
    },
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.identity, { kind: "m2m" });
  assert.equal(adminVerifierCalled, false);
});

Deno.test("an invalid supplied M2M header cannot fall back to a valid bearer", async () => {
  let adminVerifierCalled = false;
  const result = await authorizePipelineRequest(
    request({
      [AUTOPILOT_CRON_HEADER]: "wrong",
      authorization: "Bearer valid.jwt.value",
    }),
    {
      m2mHeaderName: AUTOPILOT_CRON_HEADER,
      m2mSecretEnvName: "AUTOPILOT_CRON_SECRET",
      getSecret: () => configuredSecret,
      verifyAdmin: async () => {
        adminVerifierCalled = true;
        return { status: "authorized", userId: "admin-id" };
      },
    },
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.response.status, 401);
    assert.equal(
      (await result.response.text()).includes(configuredSecret),
      false,
    );
  }
  assert.equal(adminVerifierCalled, false);
});

Deno.test("missing or weak configured M2M secrets fail closed", async () => {
  for (const secret of [null, "too-short"]) {
    const result = await authorize(
      request({ [AUTOPILOT_CRON_HEADER]: configuredSecret }),
      { status: "invalid" },
      secret,
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, 503);
  }
});

Deno.test("invalid shared machine configuration fails closed only on the M2M path", async () => {
  const m2mResult = await authorizePipelineRequest(
    request({ [AUTOPILOT_CRON_HEADER]: configuredSecret }),
    {
      m2mHeaderName: AUTOPILOT_CRON_HEADER,
      m2mSecretEnvName: "AUTOPILOT_CRON_SECRET",
      getSecret: () => configuredSecret,
      validateMachineConfiguration: async () => false,
      verifyAdmin: async () => ({ status: "invalid" }),
    },
  );
  assert.equal(m2mResult.ok, false);
  if (!m2mResult.ok) assert.equal(m2mResult.response.status, 503);

  const adminResult = await authorizePipelineRequest(
    request({ authorization: "Bearer valid.jwt.value" }),
    {
      m2mHeaderName: AUTOPILOT_CRON_HEADER,
      m2mSecretEnvName: "AUTOPILOT_CRON_SECRET",
      getSecret: () => configuredSecret,
      validateMachineConfiguration: async () => false,
      verifyAdmin: async () => ({ status: "authorized", userId: "admin-id" }),
    },
  );
  assert.equal(adminResult.ok, true);
});

Deno.test("missing or malformed bearer authentication returns 401", async () => {
  const headerCases: Array<Record<string, string>> = [
    {},
    { authorization: "Basic abc" },
    { authorization: "Bearer two tokens" },
  ];
  for (const headers of headerCases) {
    const result = await authorize(request(headers));
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, 401);
  }
});

Deno.test("admin verification maps authorized, invalid, forbidden, and unavailable states", async () => {
  const cases: Array<[AdminVerification, number | "ok"]> = [
    [{ status: "authorized", userId: "admin-id" }, "ok"],
    [{ status: "invalid" }, 401],
    [{ status: "forbidden" }, 403],
    [{ status: "unavailable" }, 503],
  ];

  for (const [verification, expected] of cases) {
    const result = await authorize(
      request({ authorization: "Bearer valid.jwt.value" }),
      verification,
    );
    if (expected === "ok") {
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.deepEqual(result.identity, {
          kind: "admin",
          userId: "admin-id",
        });
      }
    } else {
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.response.status, expected);
    }
  }
});

Deno.test("downstream headers contain only the dedicated internal credential", () => {
  const headers = buildInternalFunctionHeaders(configuredSecret, "anon-key");
  assert.equal(headers[AUTOPILOT_INTERNAL_HEADER], configuredSecret);
  assert.equal(headers.apikey, "anon-key");
  assert.equal(headers["Content-Type"], "application/json");
  assert.equal("Authorization" in headers, false);
  assert.equal(AUTOPILOT_CRON_HEADER in headers, false);
});

Deno.test("browser CORS never advertises machine credential headers", () => {
  const allowed = pipelineCorsHeaders["Access-Control-Allow-Headers"]
    .toLowerCase();
  assert.equal(allowed.includes(AUTOPILOT_CRON_HEADER), false);
  assert.equal(allowed.includes(AUTOPILOT_INTERNAL_HEADER), false);
  assert.equal(pipelineCorsHeaders["Cache-Control"], "no-store");
});

Deno.test("scheduled policy parsing fails closed for malformed values", () => {
  assert.equal(parseBoundedInteger("2", 1, 10), 2);
  assert.equal(parseBoundedInteger("2x", 1, 10), null);
  assert.equal(parseBoundedInteger("0", 1, 10), null);
  assert.deepEqual(parseScheduleHours("9, 15,9"), {
    valid: true,
    hours: [9, 15],
  });
  assert.deepEqual(parseScheduleHours(""), { valid: true, hours: [] });
  assert.deepEqual(parseScheduleHours("9,24"), { valid: false, hours: [] });
  assert.deepEqual(parseScheduleHours("9,noon"), { valid: false, hours: [] });
});

Deno.test("scheduled callers cannot supply admin-only overrides", () => {
  assert.equal(hasMachineOnlyOverrides({}), false);
  assert.equal(hasMachineOnlyOverrides({ force: false }), true);
  assert.equal(hasMachineOnlyOverrides({ queue_item_id: null }), true);
});

Deno.test("UTC schedule slots and queue UUID validation are deterministic", () => {
  assert.equal(
    utcHourSlot(new Date("2026-09-11T09:37:45.123Z")),
    "2026-09-11T09:00:00.000Z",
  );
  assert.equal(isUuid("2da8f002-1785-4e43-b7ea-6e1031609797"), true);
  assert.equal(isUuid("not-a-uuid"), false);
});

Deno.test("untrusted review scores are finite integers from zero to one hundred", () => {
  assert.equal(normalizeScore(74.6), 75);
  assert.equal(normalizeScore(-2), 0);
  assert.equal(normalizeScore(900), 100);
  assert.equal(normalizeScore(Number.NaN), 0);
  assert.equal(normalizeScore("90"), 0);
});

Deno.test("automatic publication requires a valid review-agent quorum", () => {
  const requiredAgentIds = [
    "seo",
    "readability",
    "structure",
    "cta",
    "eeat",
    "image",
  ];
  const successfulAgent = (id: string) => ({
    id,
    score: 80,
    result: { score: 80, issues: [], suggestions: [], passed: [] },
  });
  const completeReview = {
    score: 80,
    agents: requiredAgentIds.map(successfulAgent),
  };

  assert.equal(hasReviewQuorum(completeReview, requiredAgentIds), true);
  assert.equal(
    hasReviewQuorum({ ...completeReview, score: Number.NaN }, requiredAgentIds),
    false,
  );
  assert.equal(
    hasReviewQuorum({ ...completeReview, score: 101 }, requiredAgentIds),
    false,
  );
  assert.equal(
    hasReviewQuorum({
      ...completeReview,
      agents: [...completeReview.agents.slice(0, 5), { error: "failed" }],
    }, requiredAgentIds),
    false,
  );
  assert.equal(
    hasReviewQuorum({ score: 0, agents: [] }, requiredAgentIds),
    false,
  );
  assert.equal(
    hasReviewQuorum({
      score: 0,
      agents: requiredAgentIds.map((id) => ({
        id,
        score: 0,
        result: { score: 0 },
      })),
    }, requiredAgentIds),
    false,
  );
  assert.equal(
    isValidReviewAgentResult({
      score: 75,
      issues: [],
      suggestions: [],
      passed: ["valid"],
    }),
    true,
  );
  assert.equal(isValidReviewAgentResult({ score: 75 }), false);
});
