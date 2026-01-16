import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { foodText, imageBase64 } = await req.json();

    if (!foodText && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Either foodText or imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    console.log('Sending request to Lovable AI Gateway...');

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
    console.log('AI Response received');

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
