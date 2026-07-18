-- ============================================================================
-- Medicare-AI Database Schema Update: Patient Document Management System
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- Create the patient_documents table
CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Medical Reports', 'Prescriptions', 'X-Rays', 'MRI/CT Scans', 'Insurance Documents', 'Other')),
  file_size BIGINT NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Create Policies for patient_documents
CREATE POLICY "Patients can view their own documents"
  ON public.patient_documents FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own documents"
  ON public.patient_documents FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own documents"
  ON public.patient_documents FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own documents"
  ON public.patient_documents FOR DELETE
  USING (auth.uid() = patient_id);

-- Enforce strict folder RLS on the storage documents bucket if desired.
-- In 002_storage_and_notifications.sql, general authenticated access was defined.
-- Below we can create additional explicit policies or update them.
-- Note: Supabase policy checking is OR-based, so if a less-restrictive policy exists
-- it might still match. But we write these for proper reference or isolated setup.

CREATE POLICY "Patients can upload documents in their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Patients can view documents in their own folder"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Patients can delete documents in their own folder"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
