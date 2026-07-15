// Supabase Edge Function: verify-otp
// Deno runtime — deploys with: supabase functions deploy verify-otp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashOTP(otp: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { identifier, code, type = "email" } = await req.json();

    if (!identifier || !code) {
      return new Response(
        JSON.stringify({ error: "identifier and code are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client (service role bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find the latest unused, non-expired OTP for this identifier
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("identifier", identifier)
      .eq("type", type)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "No active OTP found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment attempts and check max (5 attempts)
    const { error: updateError } = await supabase
      .from("otp_codes")
      .update({ attempts: otpRecord.attempts + 1 })
      .eq("id", otpRecord.id);
    if (updateError) throw updateError;

    if (otpRecord.attempts >= 5) {
      // Mark as used to prevent brute force
      await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      return new Response(
        JSON.stringify({ error: "Too many incorrect attempts. Please request a new OTP." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify hash
    const hashedInput = await hashOTP(code.trim());
    if (hashedInput !== otpRecord.code) {
      const remaining = 5 - (otpRecord.attempts + 1);
      return new Response(
        JSON.stringify({ error: `Incorrect code. ${remaining} attempt(s) remaining.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ OTP Verified — mark as used
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    // Generate a Supabase magic link session for the user
    // This creates a proper Supabase auth session without needing a password
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: type === "email" ? identifier : undefined,
      options: {
        redirectTo: `${Deno.env.get("SITE_URL") ?? "http://localhost:5173"}/dashboard`,
      },
    });

    if (linkError) {
      // User might not exist — return verified but no session (they need to sign up)
      if (linkError.message.includes("not found") || linkError.message.includes("no user")) {
        return new Response(
          JSON.stringify({ error: "No account found with this email. Please sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw linkError;
    }

    // Extract the access token and refresh token from the magic link URL
    const url = new URL(linkData.properties.hashed_token
      ? `http://x?hashed_token=${linkData.properties.hashed_token}`
      : linkData.properties.action_link
    );

    return new Response(
      JSON.stringify({
        success: true,
        action_link: linkData.properties.action_link,
        // Also return user info
        user: linkData.user,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
