import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
      // Check if trainer has active subscription
      const { data: subData } = await supabase
        .from('trainer_platform_subscriptions')
        .select('id, status')
        .eq('trainer_id', trainer.id)
        .in('status', ['trial', 'active', 'grace'])
        .limit(1);

      if (!subData?.length) continue;

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
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream', 'TTL': '86400' },
            body: JSON.stringify(payload),
          });

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
