-- ============================================================================
-- Medicare-AI Database Schema Update: Add Missing Columns to Patients Table
-- ============================================================================

-- Add columns to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS condition TEXT,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'Low';
