/**
 * Meta Conversions API (CAPI) — authenticated, server-to-server ingestion.
 *
 * Browser code must never call this function or receive either secret. The
 * gateway intentionally allows this machine-to-machine request through, and
 * the function requires a dedicated x-capi-ingest-key. META_CAPI_ACCESS_TOKEN and
 * META_CAPI_INGEST_KEY must be configured as Edge Function secrets.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const MAX_BODY_BYTES = 16_384;
const META_GRAPH_API_VERSION = 'v26.0';
const ALLOWED_EVENTS = new Set(['Lead', 'CompleteRegistration']);
const ALLOWED_PAGE_ORIGINS = new Set([
  'https://revillion-partners.com',
  'https://www.revillion-partners.com',
  'https://dashboard.revillion.com',
]);
const DEFAULT_PAGE_URL = 'https://revillion-partners.com/en';
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('invalid_payload');
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error('invalid_payload');
  return normalized;
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function secretsMatch(provided: string, configured: string): Promise<boolean> {
  const [providedHash, configuredHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(provided)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(configured)),
  ]);
  const left = new Uint8Array(providedHash);
  const right = new Uint8Array(configuredHash);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function getSetting(supabase: SupabaseClient, key: string): Promise<string> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) throw new Error('configuration_unavailable');
  return typeof data?.value === 'string' ? data.value.trim() : '';
}

function validatedPageUrl(value: unknown): string {
  const pageUrl = optionalString(value, 2_048) ?? DEFAULT_PAGE_URL;
  let parsed: URL;
  try {
    parsed = new URL(pageUrl);
  } catch {
    throw new Error('invalid_payload');
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_PAGE_ORIGINS.has(parsed.origin)) {
    throw new Error('invalid_payload');
  }
  parsed.username = '';
  parsed.password = '';
  parsed.hash = '';
  return parsed.toString();
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const accessToken = Deno.env.get('META_CAPI_ACCESS_TOKEN')?.trim();
  const ingestKey = Deno.env.get('META_CAPI_INGEST_KEY')?.trim();
  if (!accessToken || !ingestKey) {
    console.error('Meta CAPI secrets are not configured');
    return jsonResponse({ error: 'Service unavailable' }, 503);
  }

  const providedIngestKey = req.headers.get('x-capi-ingest-key') ?? '';
  if (!providedIngestKey || !(await secretsMatch(providedIngestKey, ingestKey))) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Payload too large' }, 413);
  }

  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Payload too large' }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ error: 'Invalid request' }, 400);
    }
    if (!isRecord(body)) return jsonResponse({ error: 'Invalid request' }, 400);

    const eventName = optionalString(body.event_name, 64);
    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return jsonResponse({ error: 'Invalid request' }, 400);
    }

    const email = optionalString(body.email, 254);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Invalid request' }, 400);
    }

    const source = optionalString(body.source, 128) ?? eventName;
    const eventId = optionalString(body.event_id, 128) ?? crypto.randomUUID();
    const pageUrl = validatedPageUrl(body.page_url);
    const value = body.value === undefined ? 0 : Number(body.value);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
      return jsonResponse({ error: 'Invalid request' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const pixelId = await getSetting(supabase, 'meta_pixel_id');
    if (!/^\d{5,30}$/.test(pixelId)) {
      console.error('Meta Pixel ID is not configured or invalid');
      return jsonResponse({ error: 'Service unavailable' }, 503);
    }

    const userData: Record<string, string> = {};
    const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const userAgent = req.headers.get('user-agent')?.trim();
    if (forwardedFor) userData.client_ip_address = forwardedFor.slice(0, 64);
    if (userAgent) userData.client_user_agent = userAgent.slice(0, 512);
    if (email) userData.em = await sha256(email);

    const metaResponse = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1_000),
            event_id: eventId,
            action_source: 'website',
            event_source_url: pageUrl,
            user_data: userData,
            custom_data: {
              content_name: source,
              currency: 'USD',
              value,
            },
          }],
        }),
      },
    );

    if (!metaResponse.ok) {
      console.error(`Meta CAPI request failed with HTTP ${metaResponse.status}`);
      return jsonResponse({ error: 'Upstream service error' }, 502);
    }

    const metaData: unknown = await metaResponse.json();
    const eventsReceived = isRecord(metaData) && typeof metaData.events_received === 'number'
      ? metaData.events_received
      : undefined;
    return jsonResponse({ success: true, events_received: eventsReceived });
  } catch (error: unknown) {
    const knownClientError = error instanceof Error && error.message === 'invalid_payload';
    if (!knownClientError) console.error('Meta CAPI request failed');
    return jsonResponse(
      { error: knownClientError ? 'Invalid request' : 'Internal server error' },
      knownClientError ? 400 : 500,
    );
  }
});
