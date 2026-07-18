// Supabase Edge Function: doctor-chat
// Deno runtime — deploys with: supabase functions deploy doctor-chat

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
    const { history = [], prompt = "", fileBase64 = null, fileMime = null } = await req.json();

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

    // 1. Unrestricted clinical and general helper instructions for doctors
    const systemPrompt = `You are DocAssistant, a professional clinical co-pilot and general-purpose AI assistant for doctors and medical staff.
You provide expert-level clinical reasoning, explain medical records, draft medical correspondence (referrals, follow-up letters), outline communication, and answer questions.
Because your user is a trained medical professional, you DO NOT need to restrict your answers or add standard patient warnings/disclaimers. 
You are fully permitted and expected to answer general-purpose questions out of the medical field (e.g., coding, writing, research, general knowledge, lifestyle, scheduling, formatting, writing scripts) accurately, professionally, and directly.
Maintain a highly capable, efficient, and precise tone.`;

    // 2. Format history for OpenAI chat completions format
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Map history
    for (const msg of history) {
      const openAiRole = msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role: openAiRole, content: msg.text || msg.content });
    }

    // 3. Prepare current user prompt
    let userContent;

    if (fileBase64 && fileMime && fileMime.startsWith("image/")) {
      // Multimodal image support
      userContent = [
        { type: "text", text: prompt || "Analyze this attached image file." },
        {
          type: "image_url",
          image_url: {
            url: `data:${fileMime};base64,${fileBase64}`
          }
        }
      ];
    } else if (fileBase64 && fileMime) {
      // PDF or other attachment indicator
      userContent = `[Doctor attached a clinical file (Format: ${fileMime})]\n\n${prompt}`;
    } else {
      userContent = prompt;
    }

    messages.push({ role: "user", content: userContent });

    // 4. Send request to OpenAI Chat Completions API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ response: reply }), 
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("doctor-chat Edge Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
