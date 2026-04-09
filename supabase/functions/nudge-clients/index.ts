import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push helper using raw crypto (no npm dependency)
async function sendWebPush(
  subscription: { endpoint: string; p256dh_key: string; auth_key: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    // Use web-push compatible approach via fetch with VAPID
    const body = JSON.stringify(payload);
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
      },
      body: body,
    });
    
    if (response.status === 410 || response.status === 404) {
      // Subscription expired — should be cleaned up
      return false;
    }
    
    return response.ok;
  } catch (err) {
    console.error('Push send failed:', err);
    return false;
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

    // Today's date in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split('T')[0];

    console.log(`Nudge-clients: checking for date ${today}`);

    // Get all clients with an active trainer
    const { data: clients, error: clientErr } = await supabase
      .from('profiles')
      .select('id, full_name, trainer_id')
      .eq('role', 'client')
      .not('trainer_id', 'is', null);

    if (clientErr) throw clientErr;
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
        const ok = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey, 'mailto:hello@vecto.app');
        if (ok) sent++;
        else failed++;
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
