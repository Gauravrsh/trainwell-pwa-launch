import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phase A: text-only cache. Distance threshold is empirical — start at 0.20.
const MATCH_THRESHOLD = 0.20;
const EMBEDDING_MODEL = 'google/text-embedding-004';
const EMBEDDING_DIMS = 768;
const ANALYSIS_MODEL = 'google/gemini-2.5-flash';

// Cold-start seeding flag — allow AI re-runs while dictionary is sparse.
const ALLOW_AI_RETRY_FOR_SEEDING = true;

// 15 supported quantity units (synonyms map to canonical form)
const UNIT_SYNONYMS: Record<string, string> = {
  roti: 'roti', rotis: 'roti', chapati: 'roti', chapatis: 'roti',
  cup: 'cup', cups: 'cup',
  piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
  g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g',
  katori: 'katori', katoris: 'katori',
  bowl: 'bowl', bowls: 'bowl',
  plate: 'plate', plates: 'plate',
  slice: 'slice', slices: 'slice',
  spoon: 'spoon', spoons: 'spoon',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  ml: 'ml',
  l: 'l', litre: 'l', liter: 'l', litres: 'l', liters: 'l',
};

interface ParsedQuantity {
  qty: number;
  unit: string;
  foodName: string;
}

// Lightweight quantity parser. Falls back to qty=1, unit=serving.
function parseQuantity(rawText: string): ParsedQuantity {
  const text = rawText.trim();
  // Match leading "<number> <unit>" or "<number><unit>"
  const re = new RegExp(
    `^\\s*(\\d+(?:\\.\\d+)?)\\s*(${Object.keys(UNIT_SYNONYMS).join('|')})\\b\\s*(.*)$`,
    'i'
  );
  const m = text.match(re);
  if (m) {
    const qty = parseFloat(m[1]);
    const unit = UNIT_SYNONYMS[m[2].toLowerCase()] || 'serving';
    const foodName = (m[3] || '').trim() || text;
    return { qty: Number.isFinite(qty) && qty > 0 ? qty : 1, unit, foodName };
  }
  return { qty: 1, unit: 'serving', foodName: text };
}

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AnalysisResponse {
  items: FoodItem[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  source: 'cache' | 'ai';
  matched_dictionary_id?: string;
}

async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
    if (!r.ok) {
      console.error('Embedding error:', r.status, await r.text());
      return null;
    }
    const data = await r.json();
    const vec = data?.data?.[0]?.embedding;
    if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMS) {
      console.error('Embedding malformed: dims=', vec?.length);
      return null;
    }
    return vec;
  } catch (e) {
    console.error('Embedding exception:', e);
    return null;
  }
}

async function callGemini(foodText: string, apiKey: string): Promise<{ ok: true; items: FoodItem[] } | { ok: false; status: number; code: string }> {
  const messages = [
    {
      role: 'system',
      content: `You are a nutrition analysis expert. Analyze the food and return ONLY a JSON object with this structure:
{
  "items": [{"name":"Food", "quantity":"1 cup", "calories":N, "protein":N, "carbs":N, "fat":N}]
}
Be accurate. No prose.`,
    },
    { role: 'user', content: `Analyze: ${foodText}` },
  ];

  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ANALYSIS_MODEL, messages, temperature: 0.3 }),
  });

  if (!r.ok) {
    const code = r.status === 402 ? 'CREDITS_EXHAUSTED' : r.status === 429 ? 'RATE_LIMITED' : 'AI_UNAVAILABLE';
    console.error('Gemini error:', r.status, await r.text());
    return { ok: false, status: r.status, code };
  }

  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return { ok: false, status: 500, code: 'AI_UNAVAILABLE' };

  try {
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { ok: false, status: 500, code: 'AI_UNAVAILABLE' };
    }
    const items: FoodItem[] = parsed.items.map((it: any) => ({
      name: String(it.name || '').slice(0, 200),
      quantity: String(it.quantity || '1 serving').slice(0, 100),
      calories: Math.max(0, Math.min(10000, Number(it.calories) || 0)),
      protein: Math.max(0, Math.min(1000, Number(it.protein) || 0)),
      carbs: Math.max(0, Math.min(1000, Number(it.carbs) || 0)),
      fat: Math.max(0, Math.min(1000, Number(it.fat) || 0)),
    })).filter((it: FoodItem) => it.name);
    if (items.length === 0) return { ok: false, status: 500, code: 'AI_UNAVAILABLE' };
    return { ok: true, items };
  } catch (e) {
    console.error('Parse error:', e);
    return { ok: false, status: 500, code: 'AI_UNAVAILABLE' };
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate JWT
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
    console.log('User:', userId);

    const body = await req.json();
    const foodText = typeof body.foodText === 'string' ? body.foodText.trim() : '';
    if (!foodText) {
      return new Response(JSON.stringify({ error: 'foodText required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (foodText.length > 1000) {
      return new Response(JSON.stringify({ error: 'foodText too long (max 1000)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Step 1: parse quantity
    const { qty, unit, foodName } = parseQuantity(foodText);
    console.log('Parsed:', { qty, unit, foodName });

    // Step 2: embed the food name
    const embedding = await getEmbedding(foodName, LOVABLE_API_KEY);

    // Step 3: vector search (only if embedding succeeded)
    if (embedding) {
      const { data: matches, error: searchErr } = await adminClient.rpc('search_food_dictionary', {
        query_embedding: embedding,
        match_threshold: MATCH_THRESHOLD,
        match_count: 3,
      });

      if (!searchErr && Array.isArray(matches) && matches.length > 0) {
        const best = matches[0];
        console.log('Cache hit:', { name: best.food_name, distance: best.distance });

        // Bump usage stats (fire-and-forget)
        adminClient.rpc('bump_dictionary_usage', { p_dictionary_id: best.id }).then(() => {});

        const multiplier = qty / Number(best.base_quantity || 1);
        const item: FoodItem = {
          name: best.food_name,
          quantity: `${qty} ${unit}`,
          calories: Math.round(Number(best.base_kcal) * multiplier),
          protein: Math.round(Number(best.base_protein) * multiplier * 10) / 10,
          carbs: Math.round(Number(best.base_carbs) * multiplier * 10) / 10,
          fat: Math.round(Number(best.base_fat) * multiplier * 10) / 10,
        };
        const totals = {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
        };

        const response: AnalysisResponse = {
          items: [item],
          totals,
          source: 'cache',
          matched_dictionary_id: best.id,
        };
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Step 4: cache miss → call Gemini
    const aiResult = await callGemini(foodText, LOVABLE_API_KEY);
    if (!aiResult.ok) {
      const msg = aiResult.code === 'CREDITS_EXHAUSTED'
        ? 'Food AI is temporarily out of credits. Please try again in a few hours, or log manually below.'
        : aiResult.code === 'RATE_LIMITED'
        ? 'Food AI is busy right now. Please try again in a moment, or log manually below.'
        : 'Unable to analyze food. Please try again, or log manually below.';
      return new Response(JSON.stringify({ error: msg, code: aiResult.code }), {
        status: aiResult.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 5: write each AI item back to dictionary (Choice A: save every result)
    if (embedding) {
      // Use the user's parsed qty/unit as the base entry's metadata for the first item.
      // For multi-item responses, embed each item name separately.
      for (const item of aiResult.items) {
        try {
          const itemEmbedding = await getEmbedding(item.name, LOVABLE_API_KEY);
          if (!itemEmbedding) continue;
          await adminClient.from('food_dictionary').insert({
            food_name: item.name,
            quantity_unit: unit,
            base_quantity: qty,
            base_kcal: item.calories,
            base_protein: item.protein,
            base_carbs: item.carbs,
            base_fat: item.fat,
            embedding: itemEmbedding as any,
            original_raw_text: foodText,
            usage_count: 1,
          });
        } catch (e) {
          console.error('Dictionary write failed:', e);
          // Non-fatal: continue
        }
      }
    }

    const totals = aiResult.items.reduce(
      (acc, it) => ({
        calories: acc.calories + it.calories,
        protein: acc.protein + it.protein,
        carbs: acc.carbs + it.carbs,
        fat: acc.fat + it.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const response: AnalysisResponse = {
      items: aiResult.items,
      totals: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10,
      },
      source: 'ai',
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('lookup-or-analyze-food error:', e);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
