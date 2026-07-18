CREATE TABLE IF NOT EXISTS public.consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  treatment_notes TEXT,
  prescribed_medicines JSONB DEFAULT '[]'::jsonb, -- Array of medicines
  recommended_tests TEXT,
  follow_up_instructions TEXT,
  next_visit_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;

-- Select policy: patient or doctor or admin can view
CREATE POLICY "Consultation notes read access"
  ON public.consultation_notes FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert policy: doctor or admin can write
CREATE POLICY "Consultation notes insert access"
  ON public.consultation_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update policy: doctor or admin can update
CREATE POLICY "Consultation notes update access"
  ON public.consultation_notes FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Delete policy: admin can delete
CREATE POLICY "Consultation notes delete access"
  ON public.consultation_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_notes TO authenticated;
