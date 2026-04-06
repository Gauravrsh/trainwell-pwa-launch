import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Notification content for each day offset
const NOTIFICATION_CONTENT: Record<number, { title: string; body: string }> = {
  [-3]: {
    title: "Your Journey Isn't Over Yet",
    body: "Your Vecto subscription ends in 3 days. Your clients are counting on you - keep the momentum going!",
  },
  [-2]: {
    title: '48 Hours Left',
    body: "Only 2 days until your subscription expires. Trainers who renewed saw 40% better client retention. Don't let your clients down!",
  },
  [-1]: {
    title: 'Final Day Tomorrow',
    body: 'This is it - your subscription expires tomorrow! Renew now to ensure uninterrupted access to your client management tools.',
  },
  [0]: {
    title: 'Subscription Expired Today',
    body: "Your subscription has ended. You're now in a 3-day grace period. Renew immediately to avoid read-only mode!",
  },
  [1]: {
    title: 'Grace Period: 2 Days Left',
    body: "You're in grace period. Tomorrow's the second-last day to renew before your account goes read-only. Act now!",
  },
  [2]: {
    title: 'One Day of Grace Remains',
    body: 'This is your final day in grace period. Tomorrow your account becomes read-only. Renew today to maintain full access!',
  },
  [3]: {
    title: 'Read-Only Mode Activated',
    body: 'Your account is now read-only. Renew your subscription today to unlock full access and continue serving your clients!',
  },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // This is an internal maintenance function that runs with a service role key.
  // Since verify_jwt is disabled (Lovable Cloud requirement), we MUST protect it
  // with a shared secret to prevent anonymous callers from triggering it.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  const maintenanceToken = Deno.env.get('MAINTENANCE_TOKEN');
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
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

    const today = new Date().toISOString().split('T')[0];

    // Fetch all trainers with subscriptions that need notifications
    // We need to generate notifications for T-3 to T+3 relative to end_date
    const { data: subscriptions, error: subError } = await supabase
      .from('trainer_platform_subscriptions')
      .select('id, trainer_id, end_date, grace_end_date, status')
      .in('status', ['trial', 'active', 'grace', 'expired']);

    if (subError) {
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions to process`);

    const notificationsToInsert: Array<{
      trainer_id: string;
      notification_type: string;
      title: string;
      body: string;
      day_offset: number;
      cta_text: string;
      cta_action: string;
      scheduled_for: string;
    }> = [];

    for (const sub of subscriptions || []) {
      const endDate = new Date(sub.end_date);
      const todayDate = new Date(today);
      
      // Calculate days from expiry (negative = before, positive = after)
      const diffTime = todayDate.getTime() - endDate.getTime();
      const daysFromExpiry = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Check each notification day offset (-3 to +3)
      for (let offset = -3; offset <= 3; offset++) {
        // Calculate what date this notification should have been scheduled for
        const notificationDate = new Date(endDate);
        notificationDate.setDate(notificationDate.getDate() + offset);
        const scheduledFor = notificationDate.toISOString().split('T')[0];

        // Only create notification if scheduled_for is today or in the past (but not too old)
        if (scheduledFor > today) continue;
        
        // Don't create notifications older than 7 days
        const scheduledDate = new Date(scheduledFor);
        const daysSinceScheduled = Math.floor((todayDate.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceScheduled > 7) continue;

        const content = NOTIFICATION_CONTENT[offset];
        if (!content) continue;

        notificationsToInsert.push({
          trainer_id: sub.trainer_id,
          notification_type: 'subscription_expiry',
          title: content.title,
          body: content.body,
          day_offset: offset,
          cta_text: 'Select Plan',
          cta_action: 'open_plan_selection',
          scheduled_for: scheduledFor,
        });
      }
    }

    console.log(`Preparing to upsert ${notificationsToInsert.length} notifications`);

    // Upsert notifications (will skip duplicates due to unique constraint)
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('trainer_notifications')
        .upsert(notificationsToInsert, {
          onConflict: 'trainer_id,notification_type,day_offset,scheduled_for',
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: subscriptions?.length || 0,
        notifications_created: notificationsToInsert.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Error generating notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate notifications. Please try again.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
