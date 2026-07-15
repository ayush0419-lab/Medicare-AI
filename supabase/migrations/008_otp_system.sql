-- ============================================================================
-- Medicare-AI: Custom OTP System Table
-- Run in Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,  -- email or phone number
  code        TEXT NOT NULL,  -- hashed 6-digit OTP
  type        TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'sms')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  used        BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS otp_codes_identifier_idx ON public.otp_codes(identifier);

-- Auto-cleanup: delete expired / used OTPs older than 1 day
CREATE OR REPLACE FUNCTION cleanup_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - interval '1 day' OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Only service role can read/write (edge functions use service role key)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- No public access — all access via SECURITY DEFINER functions
CREATE POLICY "No direct access to OTP codes"
  ON public.otp_codes
  USING (false);
