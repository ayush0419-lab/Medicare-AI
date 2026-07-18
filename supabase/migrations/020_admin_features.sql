-- ── 1. Hospitals Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  contact TEXT,
  specialties TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for hospitals
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to hospitals"
  ON public.hospitals FOR SELECT
  USING (true);

CREATE POLICY "Allow admin write access to hospitals"
  ON public.hospitals FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 2. Audit Logs Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin select to audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Allow authenticated insert to audit_logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── 3. Feedback & Reviews Table ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for feedback_reviews
ALTER TABLE public.feedback_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select to feedback_reviews"
  ON public.feedback_reviews FOR SELECT
  USING (true);

CREATE POLICY "Allow patients to insert feedback"
  ON public.feedback_reviews FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Allow admin all access to feedback_reviews"
  ON public.feedback_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. Emergency SOS Monitoring Table ───────────────────────
CREATE TABLE IF NOT EXISTS public.emergency_sos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  location_lat NUMERIC,
  location_long NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for emergency_sos
ALTER TABLE public.emergency_sos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow patients to read/write own SOS"
  ON public.emergency_sos FOR ALL
  TO authenticated
  USING (patient_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin')));

-- Grant access
GRANT ALL ON public.hospitals TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.feedback_reviews TO authenticated;
GRANT ALL ON public.emergency_sos TO authenticated;
