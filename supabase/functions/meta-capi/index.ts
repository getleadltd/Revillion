/**
 * Meta Conversions API (CAPI) — Server-side event tracking
 *
 * SETUP:
 * 1. Go to Meta Business Manager → Events Manager → your Pixel → Settings
 * 2. Generate a "System User Access Token" with ads_management permission
 * 3. Add it as a secret: supabase secrets set META_CAPI_ACCESS_TOKEN=your_token
 * 4. Replace META_PIXEL_ID below with your actual Pixel ID
 *
 * Why CAPI matters: iOS 14+ blocks ~40% of browser pixel events.
 * CAPI sends events server-side, bypassing ad blockers and browser restrictions,
 * giving Meta more signal to optimize your campaigns.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createHash } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Both secrets set via: supabase secrets set META_PIXEL_ID=xxx META_CAPI_ACCESS_TOKEN=EAAxxx
const META_PIXEL_ID = Deno.env.get('META_PIXEL_ID') ?? '';

/** SHA-256 hash a string (Meta requires hashed PII) */
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const ACCESS_TOKEN = Deno.env.get('META_CAPI_ACCESS_TOKEN');

    if (!ACCESS_TOKEN || ACCESS_TOKEN.startsWith('REPLACE')) {
      console.warn('META_CAPI_ACCESS_TOKEN not configured — skipping CAPI event');
      return new Response(JSON.stringify({ skipped: true, reason: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!META_PIXEL_ID || META_PIXEL_ID.startsWith('REPLACE')) {
      console.warn('META_PIXEL_ID not configured — skipping CAPI event');
      return new Response(JSON.stringify({ skipped: true, reason: 'pixel_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { event_name, email, source, page_url, event_id } = body;

    if (!event_name) {
      return new Response(JSON.stringify({ error: 'event_name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build user data (hash all PII before sending)
    const user_data: Record<string, string> = {
      client_ip_address: req.headers.get('x-forwarded-for') || '',
      client_user_agent: req.headers.get('user-agent') || '',
    };

    if (email) {
      user_data.em = await sha256(email);
    }

    // Build CAPI payload
    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || crypto.randomUUID(), // deduplication with browser pixel
          action_source: 'website',
          event_source_url: page_url || 'https://revillion-partners.com/en/earn',
          user_data,
          custom_data: {
            content_name: source || event_name,
            currency: 'USD',
          },
        },
      ],
    };

    // Send to Meta CAPI
    const metaResponse = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error('Meta CAPI error:', metaData);
      return new Response(JSON.stringify({ error: 'Meta API error', details: metaData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`CAPI event sent: ${event_name}`, metaData);

    return new Response(JSON.stringify({ success: true, events_received: metaData.events_received }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('CAPI error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
