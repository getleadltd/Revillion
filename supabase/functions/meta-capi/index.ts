/**
 * Meta Conversions API (CAPI) — Server-side event tracking
 * Reads pixel ID and access token from site_settings DB table (admin-configurable).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** SHA-256 hash a string (Meta requires hashed PII) */
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Read a setting from site_settings table */
async function getSetting(supabase: any, key: string): Promise<string> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value ?? '';
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
    // Read config from DB (service role bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const [META_PIXEL_ID, ACCESS_TOKEN] = await Promise.all([
      getSetting(supabase, 'meta_pixel_id'),
      getSetting(supabase, 'meta_capi_access_token'),
    ]);

    if (!ACCESS_TOKEN) {
      console.warn('meta_capi_access_token not set in admin settings — skipping');
      return new Response(JSON.stringify({ skipped: true, reason: 'not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!META_PIXEL_ID) {
      console.warn('meta_pixel_id not set in admin settings — skipping');
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

    const payload = {
      data: [
        {
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || crypto.randomUUID(),
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
