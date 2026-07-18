// Supabase Edge Function: medical-chat
// Deno runtime — deploys with: supabase functions deploy medical-chat

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
          error: "OpenAI API Key is missing on your Supabase backend. Please set the OPENAI_API_KEY secret in your Supabase project (Dashboard -> Settings -> API -> Secrets)." 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Prepare system instruction message
    const systemPrompt = "You are MediChat, an advanced clinical AI assistant. Provide helpful, accurate, and easy-to-understand medical insights. Always include a disclaimer at the end of each response stating that you are an AI assistant and the user should consult a physician for official medical guidance.";

    // 2. Format history for OpenAI chat completions format
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    // Map history: user messages and assistant messages
    for (const msg of history) {
      // Map roles correctly: 'ai' -> 'assistant', 'user' -> 'user'
      const openAiRole = msg.role === 'ai' ? 'assistant' : 'user';
      messages.push({ role: openAiRole, content: msg.text });
    }

    // 3. Prepare current user prompt
    let userContent;

    if (fileBase64 && fileMime && fileMime.startsWith("image/")) {
      // Multimodal payload for images
      userContent = [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${fileMime};base64,${fileBase64}`
          }
        }
      ];
    } else if (fileBase64 && fileMime) {
      // Non-image file (e.g. PDF) - we let the model know a file was attached
      userContent = `[User attached a clinical document (Format: ${fileMime})]\n\n${prompt}`;
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
        model: "gpt-4o-mini", // GPT-4o-mini is OpenAI's state-of-the-art fast/affordable model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
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
    console.error("medical-chat Edge Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
