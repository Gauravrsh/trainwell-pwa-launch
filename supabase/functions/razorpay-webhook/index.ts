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
      
      // Extract trainer info from notes (set during payment creation)
      const trainerProfileId = notes.trainer_profile_id;
      const planType = notes.plan_type; // 'monthly' or 'annual'

      console.log('Payment captured:', {
        razorpayPaymentId,
        razorpayOrderId,
        amount,
        trainerProfileId,
        planType,
      });

      if (trainerProfileId) {
        const durationDays = planType === 'annual' ? 365 : 30;

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
            p_plan_type: planType || 'monthly',
            p_duration_days: durationDays,
            p_razorpay_payment_id: razorpayPaymentId,
            p_razorpay_order_id: razorpayOrderId,
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
            p_plan_type: planType || 'monthly',
            p_duration_days: durationDays,
            p_razorpay_payment_id: razorpayPaymentId,
            p_razorpay_order_id: razorpayOrderId,
          });

          if (insertError) {
            console.error('Error creating subscription:', insertError);
            throw insertError;
          }
          console.log('New subscription created for trainer:', trainerProfileId);
        }
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
