import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── VAPID JWT signing ────────────────────────────────────────────────────────
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
async function importVapidPrivateKey(privateKeyB64: string, publicKeyB64: string): Promise<CryptoKey> {
  const d = b64urlToBytes(privateKeyB64);
  const pub = b64urlToBytes(publicKeyB64);
  if (d.length !== 32) throw new Error('VAPID private key must be 32 bytes');
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error('VAPID public key must be 65 bytes uncompressed');
  const jwk: JsonWebKey = {
    kty: 'EC', crv: 'P-256',
    d: bytesToB64url(d),
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    ext: true,
  };
  return await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
async function signVapidJwt(audience: string, subject: string, privateKey: CryptoKey): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, sub: subject };
  const enc = new TextEncoder();
  const headerB64 = bytesToB64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToB64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, enc.encode(signingInput));
  return `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`;
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
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:hello@vecto.fit';

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const privateKey = await importVapidPrivateKey(vapidPrivateKey, vapidPublicKey);

    // Today's date in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split('T')[0];

    console.log(`Nudge-trainers: checking for date ${today}`);

    // Get all trainers with active subscription
    const { data: trainers, error: trainerErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'trainer');

    if (trainerErr) throw trainerErr;
    if (!trainers?.length) {
      return new Response(JSON.stringify({ success: true, nudged: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let failed = 0;
    let trainersNudged = 0;

    for (const trainer of trainers) {
      // AUDIT-002: verify trainer has an active subscription, including valid grace window.
      const { data: subData } = await supabase
        .from('trainer_platform_subscriptions')
        .select('id, status, grace_end_date, plan_type')
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!subData?.length) continue;
      const sub = subData[0];
      const isActive =
        sub.plan_type === 'free' ||
        sub.status === 'trial' ||
        sub.status === 'active' ||
        (sub.status === 'grace' && sub.grace_end_date && sub.grace_end_date >= today);
      if (!isActive) continue;

      // Get trainer's clients
      const { data: clients } = await supabase
        .from('profiles')
        .select('id')
        .eq('trainer_id', trainer.id)
        .eq('role', 'client');

      if (!clients?.length) continue;

      const clientIds = clients.map((c) => c.id);

      // Check if any client has incomplete logs
      const [workoutsRes, foodRes, stepsRes] = await Promise.all([
        supabase.from('workouts').select('client_id').eq('date', today).in('client_id', clientIds),
        supabase.from('food_logs').select('client_id').eq('logged_date', today).in('client_id', clientIds),
        supabase.from('step_logs').select('client_id').eq('logged_date', today).in('client_id', clientIds),
      ]);

      const workoutSet = new Set((workoutsRes.data || []).map((w) => w.client_id));
      const foodSet = new Set((foodRes.data || []).map((f) => f.client_id));
      const stepSet = new Set((stepsRes.data || []).map((s) => s.client_id));

      const hasDefaulter = clientIds.some(
        (cid) => !workoutSet.has(cid) || !foodSet.has(cid) || !stepSet.has(cid)
      );

      if (!hasDefaulter) continue;

      // Send push to trainer
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh_key, auth_key')
        .eq('profile_id', trainer.id);

      if (!subs?.length) continue;

      trainersNudged++;

      const payload = {
        title: '100% logging not done',
        body: 'Remind your clients to log their workout, meals & steps for today',
        data: { url: 'https://wa.me/?text=The%20day%20is%20still%20not%20over.%20We%20got%20work%20to%20be%20done.%20Please%20make%20sure%20all%20of%20your%20workout%20-%20meals%20-%20steps%20are%20logged%20for%20today.' },
      };

      for (const sub of subs) {
        try {
          // AUDIT-007: sign with VAPID JWT so Chrome/Edge accept the push.
          const url = new URL(sub.endpoint);
          const audience = `${url.protocol}//${url.host}`;
          const jwt = await signVapidJwt(audience, vapidSubject, privateKey);
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'TTL': '86400',
              'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            },
            body: JSON.stringify(payload),
          });
          await response.arrayBuffer().catch(() => {});

          if (response.ok) sent++;
          else {
            failed++;
            // Clean up expired subscriptions
            if (response.status === 410 || response.status === 404) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
          }
        } catch {
          failed++;
        }
      }
    }

    console.log(`Nudge-trainers done: ${trainersNudged} trainers nudged, ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, trainersNudged, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Nudge-trainers error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
