// Supabase Edge Function: analyze-report
// Deno runtime — deploys with: supabase functions deploy analyze-report

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fileBase64 = null, fileMime = null, textContent = "", reportType = "blood_test" } = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API Key is missing on your Supabase backend. Please set the OPENAI_API_KEY secret in your Supabase project." 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Clinical System Instructions
    const systemPrompt = `You are a clinical AI diagnostic specialist with a 90%+ diagnostic accuracy rate. 
Analyze the provided medical report and return a precise, structured, and clinically sound summary.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "summary": ["Detailed bullet point 1 explaining general status", "Detailed bullet point 2 explaining specific concerns", "Detailed bullet point 3"],
  "risk_level": "low" | "moderate" | "high" | "critical",
  "findings": [
    { "name": "Marker/Test Name", "value": "Observed Value", "range": "Normal Reference Range", "status": "Normal" | "Borderline" | "Abnormal" }
  ],
  "recommendations": "Provide 2-3 clear, actionable clinical recommendations for the patient.",
  "suggested_tests": ["Test Name 1", "Test Name 2"]
}

Ensure all JSON keys and values are valid and do not contain extra conversational text before or after the JSON block.`;

    // 2. Prepare user prompt content
    let userContent;

    if (fileBase64 && fileMime && fileMime.startsWith("image/")) {
      // Multimodal payload for images (X-rays, scans)
      userContent = [
        { 
          type: "text", 
          text: `Please analyze this medical report of type: ${reportType}. Additional text details (if any): ${textContent}` 
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${fileMime};base64,${fileBase64}`
          }
        }
      ];
    } else {
      // Standard text details analysis
      userContent = `Please analyze the following medical report details:\nReport Type: ${reportType}\n\nContent:\n${textContent || "File attached (Raw PDF text extraction placeholder)"}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ];

    // 3. Query OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.2, // Low temperature for high precision & consistency
        max_tokens: 1500,
        response_format: { type: "json_object" } // Enforce JSON response
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || "{}";

    return new Response(
      JSON.stringify({ result: JSON.parse(replyText) }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("analyze-report Edge Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
