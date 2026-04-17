import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMBEDDING_MODEL = 'google/text-embedding-004';
const EMBEDDING_DIMS = 768;

async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    const vec = data?.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMS) return null;
    return vec;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') ?? '';

    // Manual JWT validation
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const action = body.action as 'edit' | 'delete';
    const dictionaryId = body.dictionaryId as string;
    const original = body.original as { kcal: number; protein: number; carbs: number; fat: number };

    if (!action || !dictionaryId || !original) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (action !== 'edit' && action !== 'delete') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Resolve client profile id from JWT
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!profile?.id) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      // Negative signal: full rejection. kcal_delta_pct = -100 sentinel.
      await adminClient.from('food_dictionary_edits').insert({
        dictionary_id: dictionaryId,
        client_id: profile.id,
        original_kcal: original.kcal,
        original_protein: original.protein,
        original_carbs: original.carbs,
        original_fat: original.fat,
        edited_kcal: null,
        edited_protein: null,
        edited_carbs: null,
        edited_fat: null,
        kcal_delta_pct: -100,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action === 'edit'
    const edited = body.edited as { kcal: number; protein: number; carbs: number; fat: number };
    const foodName = typeof body.foodName === 'string' ? body.foodName.trim().slice(0, 200) : '';
    if (!edited || !foodName) {
      return new Response(JSON.stringify({ error: 'edit requires edited macros + foodName' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const kcalDelta = original.kcal > 0
      ? ((edited.kcal - original.kcal) / original.kcal) * 100
      : 0;

    // 1) Log the edit signal
    await adminClient.from('food_dictionary_edits').insert({
      dictionary_id: dictionaryId,
      client_id: profile.id,
      original_kcal: original.kcal,
      original_protein: original.protein,
      original_carbs: original.carbs,
      original_fat: original.fat,
      edited_kcal: edited.kcal,
      edited_protein: edited.protein,
      edited_carbs: edited.carbs,
      edited_fat: edited.fat,
      kcal_delta_pct: Math.round(kcalDelta * 10) / 10,
    });

    // 2) Insert corrected variant into dictionary (so future searches can find it)
    if (LOVABLE_API_KEY) {
      const embedding = await getEmbedding(foodName, LOVABLE_API_KEY);
      if (embedding) {
        // Look up the source entry to inherit unit/base_quantity
        const { data: src } = await adminClient
          .from('food_dictionary')
          .select('quantity_unit, base_quantity')
          .eq('id', dictionaryId)
          .maybeSingle();

        await adminClient.from('food_dictionary').insert({
          food_name: foodName,
          quantity_unit: src?.quantity_unit ?? 'serving',
          base_quantity: src?.base_quantity ?? 1,
          base_kcal: edited.kcal,
          base_protein: edited.protein,
          base_carbs: edited.carbs,
          base_fat: edited.fat,
          embedding: embedding as any,
          original_raw_text: foodName,
          usage_count: 1,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('record-food-edit error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
