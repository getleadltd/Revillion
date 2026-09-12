export interface ParsedSchedule {
  valid: boolean;
  hours: number[];
}

export function parseBoundedInteger(
  value: string,
  minimum: number,
  maximum: number,
): number | null {
  if (!/^-?\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

export function parseScheduleHours(value: string): ParsedSchedule {
  if (!value.trim()) return { valid: true, hours: [] };

  const hours: number[] = [];
  for (const token of value.split(",")) {
    const hour = parseBoundedInteger(token, 0, 23);
    if (hour === null) return { valid: false, hours: [] };
    if (!hours.includes(hour)) hours.push(hour);
  }
  return { valid: true, hours: hours.sort((left, right) => left - right) };
}

export function utcHourSlot(now: Date): string {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
  )).toISOString();
}

export function hasMachineOnlyOverrides(
  body: Record<string, unknown>,
): boolean {
  return Object.hasOwn(body, "force") || Object.hasOwn(body, "queue_item_id");
}

export function isRequestBody(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

export function normalizeScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function isValidReviewAgentResult(value: unknown): boolean {
  if (
    !isRequestBody(value) ||
    typeof value.score !== "number" ||
    !Number.isFinite(value.score) ||
    value.score < 0 ||
    value.score > 100
  ) {
    return false;
  }

  return ["issues", "suggestions", "passed"].every((key) =>
    Array.isArray(value[key]) &&
    (value[key] as unknown[]).every((entry) => typeof entry === "string")
  );
}

export function hasReviewQuorum(
  value: unknown,
  requiredAgentIds: readonly string[],
): boolean {
  if (
    requiredAgentIds.length < 1 ||
    new Set(requiredAgentIds).size !== requiredAgentIds.length ||
    !isRequestBody(value) ||
    typeof value.score !== "number" ||
    !Number.isFinite(value.score) ||
    value.score < 0 ||
    value.score > 100 ||
    !Array.isArray(value.agents)
  ) {
    return false;
  }

  const successfulAgentIds = new Set<string>();
  for (const agent of value.agents) {
    if (
      isRequestBody(agent) &&
      typeof agent.id === "string" &&
      typeof agent.score === "number" &&
      Number.isFinite(agent.score) &&
      agent.score >= 0 &&
      agent.score <= 100 &&
      isValidReviewAgentResult(agent.result) &&
      !Object.hasOwn(agent, "error")
    ) {
      successfulAgentIds.add(agent.id);
    }
  }
  return requiredAgentIds.every((agentId) => successfulAgentIds.has(agentId));
}
