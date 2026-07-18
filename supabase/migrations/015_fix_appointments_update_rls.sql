-- ============================================================================
-- Medicare-AI Database Schema Update: Fix Appointments Update RLS
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- Drop the old restricted update policy
DROP POLICY IF EXISTS "Doctors and admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Appointments update access" ON public.appointments;

-- Create a comprehensive update policy that permits patients to cancel/update their own appointments
CREATE POLICY "Appointments update access"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
