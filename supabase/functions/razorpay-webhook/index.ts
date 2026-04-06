import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// Razorpay signature verification using Web Crypto API
async function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Constant-time comparison to prevent timing side-channel attacks
  if (expectedSignature.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// Map payment amount (paise) to plan type
function inferPlanType(amountPaise: number): 'monthly' | 'annual' | null {
  if (amountPaise === 49900) return 'monthly';   // ₹499
  if (amountPaise === 598800) return 'annual';    // ₹5988
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature
    const isValid = await verifyRazorpaySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid Razorpay signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the verified payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    console.log('Razorpay webhook event:', event);

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle payment events
    if (event === 'payment.captured' || event === 'payment_link.paid') {
      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = paymentEntity?.order_id;
      const amount = paymentEntity?.amount; // Amount in paise
      const notes = paymentEntity?.notes || {};
      
      // Try to get trainer info from notes first (API-created orders)
      let trainerProfileId = notes.trainer_profile_id;
      let planType = notes.plan_type as 'monthly' | 'annual' | undefined;

      // FALLBACK: For Payment Button payments, notes are empty.
      // Infer plan type from amount and find the matching pending_payment subscription.
      if (!trainerProfileId && amount) {
        const inferredPlan = inferPlanType(amount);
        console.log('No trainer_profile_id in notes. Inferring from amount:', { amount, inferredPlan });

        if (inferredPlan) {
          planType = inferredPlan;
          
          // Find the most recent pending_payment subscription matching this plan type
          const { data: pendingSub, error: pendingError } = await supabase
            .from('trainer_platform_subscriptions')
            .select('id, trainer_id')
            .eq('status', 'pending_payment')
            .eq('plan_type', inferredPlan)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pendingError) {
            console.error('Error finding pending subscription:', pendingError);
          } else if (pendingSub) {
            trainerProfileId = pendingSub.trainer_id;
            console.log('Matched pending_payment subscription:', { 
              subscriptionId: pendingSub.id, 
              trainerId: trainerProfileId,
              planType 
            });
          } else {
            console.warn('No pending_payment subscription found for plan:', inferredPlan);
          }
        }
      }

      console.log('Payment captured:', {
        razorpayPaymentId,
        razorpayOrderId,
        amount,
        trainerProfileId,
        planType,
      });

      if (trainerProfileId && planType) {
        const durationDays = planType === 'annual' ? 425 : 30; // Annual = 14 months (425 days)

        // Check for existing subscription
        const { data: existingSub } = await supabase
          .from('trainer_platform_subscriptions')
          .select('id')
          .eq('trainer_id', trainerProfileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingSub) {
          // Update via server-side SQL date math
          const { error: updateError } = await supabase.rpc('renew_trainer_subscription_webhook', {
            p_subscription_id: existingSub.id,
            p_plan_type: planType,
            p_duration_days: durationDays,
            p_razorpay_payment_id: razorpayPaymentId,
            p_razorpay_order_id: razorpayOrderId || '',
          });

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            throw updateError;
          }
          console.log('Subscription updated successfully:', existingSub.id);
        } else {
          // Create via server-side SQL date math
          const { error: insertError } = await supabase.rpc('create_trainer_subscription_webhook', {
            p_trainer_id: trainerProfileId,
            p_plan_type: planType,
            p_duration_days: durationDays,
            p_razorpay_payment_id: razorpayPaymentId,
            p_razorpay_order_id: razorpayOrderId || '',
          });

          if (insertError) {
            console.error('Error creating subscription:', insertError);
            throw insertError;
          }
          console.log('New subscription created for trainer:', trainerProfileId);
        }
      } else {
        console.error('Could not resolve trainer or plan type for payment:', razorpayPaymentId);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
