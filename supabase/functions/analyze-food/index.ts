import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodAnalysisResponse {
  items: FoodItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Validation constants
const MAX_CALORIES = 10000;
const MAX_MACROS = 1000; // grams
const MAX_STRING_LENGTH = 200;
const MAX_ITEMS = 50;

// Sanitize string to prevent XSS - removes HTML tags and limits length
function sanitizeString(str: unknown, maxLength: number = MAX_STRING_LENGTH): string {
  if (typeof str !== 'string') return '';
  // Remove HTML tags, trim, and limit length
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}

// Clamp number to valid range
function clampNumber(value: unknown, min: number, max: number): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num) || num < min) return min;
  if (num > max) return max;
  return Math.round(num * 100) / 100; // Round to 2 decimal places
}

// Validate and sanitize a food item
function validateFoodItem(item: unknown): FoodItem | null {
  if (!item || typeof item !== 'object') return null;
  
  const obj = item as Record<string, unknown>;
  
  const name = sanitizeString(obj.name);
  if (!name) return null; // Name is required
  
  return {
    name,
    quantity: sanitizeString(obj.quantity) || '1 serving',
    calories: clampNumber(obj.calories, 0, MAX_CALORIES),
    protein: clampNumber(obj.protein, 0, MAX_MACROS),
    carbs: clampNumber(obj.carbs, 0, MAX_MACROS),
    fat: clampNumber(obj.fat, 0, MAX_MACROS),
  };
}

// Validate and sanitize the entire AI response
function validateAIResponse(data: unknown): FoodAnalysisResponse | null {
  if (!data || typeof data !== 'object') {
    console.log('AI response validation failed: not an object');
    return null;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate items array
  if (!Array.isArray(obj.items)) {
    console.log('AI response validation failed: items is not an array');
    return null;
  }
  
  // Limit number of items and validate each
  const validItems: FoodItem[] = [];
  for (const item of obj.items.slice(0, MAX_ITEMS)) {
    const validItem = validateFoodItem(item);
    if (validItem) {
      validItems.push(validItem);
    }
  }
  
  if (validItems.length === 0) {
    console.log('AI response validation failed: no valid food items');
    return null;
  }
  
  // Calculate totals from validated items (don't trust AI-provided totals)
  const totals = validItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  // Round totals
  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  
  console.log(`Validated ${validItems.length} food items, totals: ${JSON.stringify(totals)}`);
  
  return {
    items: validItems,
    totals,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Manual JWT validation (required since verify_jwt = false for Lovable Cloud compatibility)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT using getClaims for fast, reliable validation
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Authenticated user:', userId);

    const { foodText, imageBase64 } = await req.json();

    // Input validation
    if (!foodText && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Either foodText or imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate text length (max 1000 characters)
    if (foodText && typeof foodText === 'string' && foodText.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Food text too long. Maximum 1000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image size (max 5MB when decoded)
    if (imageBase64) {
      if (typeof imageBase64 !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid image format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(imageBase64)) {
        return new Response(
          JSON.stringify({ error: 'Invalid base64 image format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Estimate decoded size (base64 is ~4/3 larger than binary)
      const estimatedSizeBytes = (imageBase64.length * 3) / 4;
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      if (estimatedSizeBytes > maxSizeBytes) {
        return new Response(
          JSON.stringify({ error: 'Image too large. Maximum 5MB.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const messages: any[] = [
      {
        role: 'system',
        content: `You are a nutrition analysis expert. Analyze the food described or shown and return a JSON response with the following structure:
{
  "items": [
    {
      "name": "Food item name",
      "quantity": "Amount (e.g., '1 cup', '200g', '1 piece')",
      "calories": number,
      "protein": number (in grams),
      "carbs": number (in grams),
      "fat": number (in grams)
    }
  ],
  "totals": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

Be accurate with portion sizes. If unsure, provide reasonable estimates for typical serving sizes.
Return ONLY the JSON object, no additional text.`
      }
    ];

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          },
          {
            type: 'text',
            text: foodText || 'Analyze this food image and provide nutritional information.'
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Analyze this food and provide nutritional information: ${foodText}`
      });
    }

    console.log('Sending request to Lovable AI Gateway for user:', userId);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      // Return generic error to client, keep details in server logs
      return new Response(
        JSON.stringify({ error: 'Unable to analyze food. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI Response received for user:', userId);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Unable to analyze food. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate the JSON from the response
    let analysisResult: FoodAnalysisResponse;
    try {
      // Remove any markdown code blocks if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const rawData = JSON.parse(jsonStr);
      
      // Validate and sanitize the AI response
      const validatedResult = validateAIResponse(rawData);
      if (!validatedResult) {
        console.error('AI response failed validation:', JSON.stringify(rawData).slice(0, 500));
        return new Response(
          JSON.stringify({ error: 'Unable to process the analysis. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      analysisResult = validatedResult;
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Unable to process the analysis. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-food function:', error);
    // Return generic error message to client, keep details in server logs
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
