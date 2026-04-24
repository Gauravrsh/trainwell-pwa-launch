import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── VAPID JWT signing (required by Chrome/Edge for Web Push) ───────────────────
// Converts a URL-safe base64 string to bytes.
function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice((b64.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert a raw 64-byte ECDSA signature (r||s) to ASN.1 DER — not needed for JWT
// (JWT uses raw r||s concatenation), so we keep this minimal.

// Convert P-256 private key (raw 32 bytes, from VAPID private key b64url) to a
// CryptoKey we can sign with. Since WebCrypto importKey for 'raw' private ECDSA
// isn't supported, we build a PKCS#8 wrapper around it and the corresponding
// public key (decoded from VAPID_PUBLIC_KEY, 65 bytes uncompressed 0x04||X||Y).
async function importVapidPrivateKey(
  privateKeyB64: string,
  publicKeyB64: string
): Promise<CryptoKey> {
  const d = b64urlToBytes(privateKeyB64); // 32 bytes
  const pub = b64urlToBytes(publicKeyB64); // 65 bytes (0x04 || X(32) || Y(32))
  if (d.length !== 32) throw new Error('VAPID private key must be 32 bytes');
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error('VAPID public key must be 65 bytes uncompressed');
  }
  // Build a JWK and import it (supported path in Deno WebCrypto).
  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    d: bytesToB64url(d),
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    ext: true,
  };
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

async function signVapidJwt(
  audience: string,
  subject: string,
  publicKeyB64: string,
  privateKey: CryptoKey
): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12h
    sub: subject,
  };
  const enc = new TextEncoder();
  const headerB64 = bytesToB64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToB64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    enc.encode(signingInput)
  );
  const sigB64 = bytesToB64url(new Uint8Array(sig));
  return `${signingInput}.${sigB64}`;
}

// Web Push sender with VAPID Authorization header (aesgcm / unencrypted body).
// Since we send no encrypted payload, browsers deliver a data-less push and the
// service worker falls back to the default notification. To keep the current
// payload-based flow working, we continue to POST the JSON body; Chrome accepts
// unencrypted payloads when Content-Encoding is absent AND Crypto-Key is absent.
// The critical fix is the signed Authorization header.
async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: object,
  vapidPublicKey: string,
  privateKey: CryptoKey,
  vapidSubject: string
): Promise<{ ok: boolean; status: number }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt = await signVapidJwt(audience, vapidSubject, vapidPublicKey, privateKey);

    const body = JSON.stringify(payload);
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body,
    });
    // Drain body to avoid resource leak in Deno.
    await response.arrayBuffer().catch(() => {});
    return { ok: response.ok, status: response.status };
  } catch (err) {
    console.error('Push send failed:', err);
    return { ok: false, status: 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  // Auth: maintenance token
  const maintenanceToken = Deno.env.get('MAINTENANCE_TOKEN');
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const tokenHeader = req.headers.get('x-maintenance-token');

  if (!maintenanceToken || (bearerToken !== maintenanceToken && tokenHeader !== maintenanceToken)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:hello@vecto.fit';
    const privateKey = await importVapidPrivateKey(vapidPrivateKey, vapidPublicKey);

    // Today's date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split('T')[0];

    console.log(`Nudge-clients: checking for date ${today}`);

    // Get all clients whose trainer has an active / trial / valid-grace / free subscription.
    // AUDIT-003: do not nudge clients whose trainer is expired.
    const { data: activeSubs, error: subErr } = await supabase
      .from('trainer_platform_subscriptions')
      .select('trainer_id, status, grace_end_date, plan_type');
    if (subErr) throw subErr;

    const activeTrainerIds = new Set<string>();
    for (const s of activeSubs || []) {
      if (s.plan_type === 'free') { activeTrainerIds.add(s.trainer_id); continue; }
      if (s.status === 'trial' || s.status === 'active') {
        activeTrainerIds.add(s.trainer_id);
      } else if (s.status === 'grace' && s.grace_end_date && s.grace_end_date >= today) {
        activeTrainerIds.add(s.trainer_id);
      }
    }

    const { data: allClients, error: clientErr } = await supabase
      .from('profiles')
      .select('id, full_name, trainer_id')
      .eq('role', 'client')
      .not('trainer_id', 'is', null);

    if (clientErr) throw clientErr;
    const clients = (allClients || []).filter(
      (c) => c.trainer_id && activeTrainerIds.has(c.trainer_id)
    );
    if (!clients?.length) {
      return new Response(JSON.stringify({ success: true, nudged: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIds = clients.map((c) => c.id);

    // Batch fetch today's logs
    const [workoutsRes, foodRes, stepsRes] = await Promise.all([
      supabase.from('workouts').select('client_id').eq('date', today).in('client_id', clientIds),
      supabase.from('food_logs').select('client_id').eq('logged_date', today).in('client_id', clientIds),
      supabase.from('step_logs').select('client_id').eq('logged_date', today).in('client_id', clientIds),
    ]);

    const workoutSet = new Set((workoutsRes.data || []).map((w) => w.client_id));
    const foodSet = new Set((foodRes.data || []).map((f) => f.client_id));
    const stepSet = new Set((stepsRes.data || []).map((s) => s.client_id));

    // Find defaulters
    const defaulters: { clientId: string; firstName: string; missing: string[] }[] = [];
    for (const client of clients) {
      const missing: string[] = [];
      if (!workoutSet.has(client.id)) missing.push('Workout');
      if (!foodSet.has(client.id)) missing.push('Meal');
      if (!stepSet.has(client.id)) missing.push('Steps');

      if (missing.length > 0) {
        const firstName = client.full_name?.split(' ')[0] || 'there';
        defaulters.push({ clientId: client.id, firstName, missing });
      }
    }

    console.log(`Found ${defaulters.length} clients with missing logs`);

    // Send push to each defaulter
    let sent = 0;
    let failed = 0;

    for (const d of defaulters) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh_key, auth_key')
        .eq('profile_id', d.clientId);

      if (!subs?.length) continue;

      const missingText = d.missing.join(', ');
      const payload = {
        title: 'Hey, something is pending',
        body: `${missingText} ${d.missing.length === 1 ? 'is' : 'are'} yet to be logged for the day`,
        data: { url: `/calendar?date=${today}` },
      };

      for (const sub of subs) {
        const result = await sendWebPush(sub, payload, vapidPublicKey, privateKey, vapidSubject);
        if (result.ok) {
          sent++;
        } else {
          failed++;
          if (result.status === 404 || result.status === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
    }

    console.log(`Nudge-clients done: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, defaulters: defaulters.length, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Nudge-clients error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
