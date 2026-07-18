-- ============================================================================
-- Medicare-AI Database Schema Update: Fix Row Level Security (RLS)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ── 1. Fix public.patient_documents policies ───────────────────────────────
DROP POLICY IF EXISTS "Patients can view their own documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Patients can insert their own documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Patients can update their own documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Patients can delete their own documents" ON public.patient_documents;

CREATE POLICY "Allow patients select own records"
  ON public.patient_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Allow patients insert own records"
  ON public.patient_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Allow patients update own records"
  ON public.patient_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Allow patients delete own records"
  ON public.patient_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);


-- ── 2. Fix storage.objects (documents bucket) policies ──────────────────────
-- Drop old permissive policies and the folder-name parsed policies
DROP POLICY IF EXISTS "Patients can upload documents in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Patients can view documents in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Patients can delete documents in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Doctors and patients can upload documents." ON storage.objects;
DROP POLICY IF EXISTS "Doctors and patients can update documents." ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents." ON storage.objects;

-- Create robust path prefix-based (LIKE) storage rules
CREATE POLICY "Allow authenticated upload into own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND name LIKE (auth.uid()::text || '/%'));

CREATE POLICY "Allow authenticated read from own folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND name LIKE (auth.uid()::text || '/%'));

CREATE POLICY "Allow authenticated update in own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND name LIKE (auth.uid()::text || '/%'));

CREATE POLICY "Allow authenticated delete from own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND name LIKE (auth.uid()::text || '/%'));
