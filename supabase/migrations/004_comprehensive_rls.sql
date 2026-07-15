-- ============================================================================
-- Medicare-AI Database Schema Update: Comprehensive Row-Level Security (RLS)
-- Run this in the Supabase SQL Editor to enforce strict security policies.
-- ============================================================================

-- 1. Ensure RLS is enabled on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing overlapping public policies (if any)
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 3. Strict PROFILES Policies
-- Only authenticated users can see profiles. Users can only update their own profile.
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Storage Security Hardening
-- Ensures strict scoping for medical documents
DROP POLICY IF EXISTS "Users can view their own documents." ON storage.objects;
DROP POLICY IF EXISTS "Doctors and patients can upload documents." ON storage.objects;
DROP POLICY IF EXISTS "Doctors and patients can update documents." ON storage.objects;

-- Storage: Only authenticated users can upload to 'documents', but we scope read access
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view strictly their own medical documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    (auth.uid() = owner OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor')))
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid() = owner
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    auth.uid() = owner
  );

-- 5. Strict Appointments Policies
-- Drop existing potential weak policies
DROP POLICY IF EXISTS "View own appointments" ON appointments;
DROP POLICY IF EXISTS "Doctors and admins can create appointments" ON appointments;

CREATE POLICY "Appointments read access"
  ON appointments FOR SELECT USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Appointments insert access"
  ON appointments FOR INSERT WITH CHECK (
    patient_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

-- 6. Block direct DB modification by anon keys entirely
-- This acts as a global safety net
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
