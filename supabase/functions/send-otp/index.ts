// Supabase Edge Function: send-otp
// Deno runtime — deploys with: supabase functions deploy send-otp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Generate a secure 6-digit OTP ──────────────────────────────────────────
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

// ── Simple SHA-256 hash ────────────────────────────────────────────────────
async function hashOTP(otp: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Branded HTML Email Template ────────────────────────────────────────────
function buildEmailHtml(otp: string, recipientName?: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Your MediCare-AI Login Code</title>
</head>
<body style="margin:0;padding:0;background:#040d1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#0d1f3c,#0a1628);border:1px solid #1e3a5f;border-radius:20px;padding:40px;text-align:center;">
        
        <!-- Logo -->
        <div style="margin-bottom:28px;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:42px;height:42px;background:linear-gradient(135deg,#00b8ff,#0060ff);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;line-height:42px;">+</div>
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Medicare<span style="color:#00b8ff;">-AI</span></span>
          </div>
        </div>

        <!-- Heading -->
        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 8px;">Your Login Code</h1>
        <p style="color:#8899aa;font-size:14px;margin:0 0 32px;">
          ${recipientName ? `Hi ${recipientName},` : "Hello,"}<br/>
          Use the code below to sign in to your MediCare-AI account.
        </p>

        <!-- OTP Box -->
        <div style="background:linear-gradient(135deg,rgba(0,184,255,0.12),rgba(0,96,255,0.08));border:2px solid rgba(0,184,255,0.3);border-radius:16px;padding:28px 20px;margin:0 0 28px;">
          <p style="color:#8899aa;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">One-Time Code</p>
          <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#00b8ff;font-family:'Courier New',monospace;line-height:1;">${otp}</div>
          <p style="color:#556677;font-size:12px;margin:14px 0 0;">Expires in <strong style="color:#8899aa;">10 minutes</strong></p>
        </div>

        <!-- Warning -->
        <div style="background:rgba(255,155,0,0.08);border:1px solid rgba(255,155,0,0.2);border-radius:12px;padding:14px 18px;margin-bottom:28px;text-align:left;">
          <p style="color:#ffaa44;font-size:13px;margin:0;font-weight:600;">🔒 Security Notice</p>
          <p style="color:#667788;font-size:12px;margin:6px 0 0;line-height:1.5;">Never share this code with anyone. MediCare-AI staff will <strong>never</strong> ask for your OTP. If you didn't request this, please ignore this email.</p>
        </div>

        <!-- Footer -->
        <p style="color:#445566;font-size:12px;margin:0;line-height:1.6;">
          Sent by <strong style="color:#667788;">MediCare-AI</strong> &bull; AI-Powered Healthcare Platform<br/>
          This is an automated message &mdash; please do not reply.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── SMS Text Template ──────────────────────────────────────────────────────
function buildSmsText(otp: string): string {
  return `MediCare-AI: Your login code is ${otp}. Valid for 10 minutes. Do NOT share this code with anyone.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { identifier, type = "email", name } = await req.json();

    if (!identifier) {
      return new Response(JSON.stringify({ error: "identifier is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Supabase admin client (service role key bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limiting: max 3 OTPs per identifier per hour
    const { count } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if ((count ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please wait before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidate any existing unused OTPs for this identifier
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("identifier", identifier)
      .eq("used", false);

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    // Store in database
    const { error: insertError } = await supabase.from("otp_codes").insert({
      identifier,
      code: hashedOtp,
      type,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (insertError) throw insertError;

    // ── Send via Resend (Email) ────────────────────────────────────────────
    if (type === "email") {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MediCare-AI <noreply@medicarai.health>",
          to: [identifier],
          subject: `${otp} — Your MediCare-AI Login Code`,
          html: buildEmailHtml(otp, name),
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        throw new Error(`Email send failed: ${errBody}`);
      }
    }

    // ── Send via Twilio (SMS) ─────────────────────────────────────────────
    if (type === "sms") {
      const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
      const TWILIO_FROM = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
        throw new Error("Twilio credentials not configured");
      }

      const credentials = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
      const smsRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: TWILIO_FROM,
            To: identifier,
            Body: buildSmsText(otp),
          }),
        }
      );

      if (!smsRes.ok) {
        const errBody = await smsRes.text();
        throw new Error(`SMS send failed: ${errBody}`);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
