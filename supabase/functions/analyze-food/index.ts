import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodAnalysisResponse {
  items: {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT is now verified at the platform level via verify_jwt = true in config.toml
    // Get auth header to pass to Supabase client for user context
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    // Get user ID from the authenticated request
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
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
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received for user:', userId);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    let analysisResult: FoodAnalysisResponse;
    try {
      // Remove any markdown code blocks if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse nutrition data');
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-food function:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze food';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
