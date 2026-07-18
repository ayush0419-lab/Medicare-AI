-- ============================================================================
-- Medicare-AI Database Schema Update: Prescriptions Table & RLS
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  recommended_tests TEXT,
  follow_up_date DATE,
  medicines JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: { name, dosage, frequency, duration, instructions }
  pdf_url TEXT, -- Path to generated PDF file in documents bucket
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Prescriptions read access" ON public.prescriptions;
DROP POLICY IF EXISTS "Prescriptions insert access" ON public.prescriptions;
DROP POLICY IF EXISTS "Prescriptions update access" ON public.prescriptions;
DROP POLICY IF EXISTS "Prescriptions delete access" ON public.prescriptions;

-- Create Policies
CREATE POLICY "Prescriptions read access"
  ON public.prescriptions FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Prescriptions insert access"
  ON public.prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Prescriptions update access"
  ON public.prescriptions FOR UPDATE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Prescriptions delete access"
  ON public.prescriptions FOR DELETE
  TO authenticated
  USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant Access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
