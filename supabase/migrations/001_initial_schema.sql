-- ============================================================================
-- Medicare-AI Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ── 1. Profiles table (extends auth.users) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  specialty TEXT,
  license_number TEXT,
  organization TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Patients table (medical context) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_doctor_id UUID REFERENCES profiles(id),
  conditions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'critical')),
  last_visit TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. Appointments table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  type TEXT DEFAULT 'in-person' CHECK (type IN ('in-person', 'virtual')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. Medical Records ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id),
  diagnosis TEXT NOT NULL,
  prescription TEXT,
  notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Report Analyses (AI-powered report analyzer) ─────────────────────────
CREATE TABLE IF NOT EXISTS report_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('blood_test', 'xray', 'mri', 'ct_scan', 'ecg', 'ultrasound', 'pathology', 'other')),
  file_url TEXT,
  file_name TEXT,
  original_text TEXT,
  ai_summary TEXT,
  ai_findings JSONB DEFAULT '[]',
  ai_risk_level TEXT CHECK (ai_risk_level IN ('low', 'moderate', 'high', 'critical')),
  ai_recommendations TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reviewed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  doctor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. Auto-create profile on signup (trigger) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Row Level Security ───────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_analyses ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Patients: doctors/admins can manage, patients can view own
CREATE POLICY "Patients view own record"
  ON patients FOR SELECT USING (
    profile_id = auth.uid()
    OR assigned_doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors and admins can insert patients"
  ON patients FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors and admins can update patients"
  ON patients FOR UPDATE USING (
    assigned_doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete patients"
  ON patients FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Appointments: involved parties can view, doctors/admins can manage
CREATE POLICY "View own appointments"
  ON appointments FOR SELECT USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors and admins can create appointments"
  ON appointments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors and admins can update appointments"
  ON appointments FOR UPDATE USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete appointments"
  ON appointments FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Medical Records
CREATE POLICY "View own medical records"
  ON medical_records FOR SELECT USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors can create medical records"
  ON medical_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors can update medical records"
  ON medical_records FOR UPDATE USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Report Analyses: patient/doctor who uploaded can view, doctors/admins can manage
CREATE POLICY "View own report analyses"
  ON report_analyses FOR SELECT USING (
    patient_id = auth.uid()
    OR uploaded_by = auth.uid()
    OR reviewed_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Users can upload reports"
  ON report_analyses FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Doctors and admins can update report analyses"
  ON report_analyses FOR UPDATE USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Admins can delete report analyses"
  ON report_analyses FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 7. Dashboard stats function ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_role TEXT, user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF user_role = 'admin' THEN
    SELECT json_build_object(
      'total_patients', (SELECT COUNT(*) FROM patients),
      'total_appointments_today', (SELECT COUNT(*) FROM appointments WHERE scheduled_at::date = CURRENT_DATE),
      'total_doctors', (SELECT COUNT(*) FROM profiles WHERE role = 'doctor'),
      'total_records', (SELECT COUNT(*) FROM medical_records)
    ) INTO result;
  ELSIF user_role = 'doctor' THEN
    SELECT json_build_object(
      'total_patients', (SELECT COUNT(*) FROM patients WHERE assigned_doctor_id = user_id),
      'total_appointments_today', (SELECT COUNT(*) FROM appointments WHERE doctor_id = user_id AND scheduled_at::date = CURRENT_DATE),
      'completed_today', (SELECT COUNT(*) FROM appointments WHERE doctor_id = user_id AND scheduled_at::date = CURRENT_DATE AND status = 'completed'),
      'total_records', (SELECT COUNT(*) FROM medical_records WHERE doctor_id = user_id)
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'total_appointments', (SELECT COUNT(*) FROM appointments WHERE patient_id = user_id),
      'upcoming_appointments', (SELECT COUNT(*) FROM appointments WHERE patient_id = user_id AND scheduled_at > now() AND status IN ('scheduled', 'confirmed')),
      'total_records', (SELECT COUNT(*) FROM medical_records WHERE patient_id = user_id)
    ) INTO result;
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
