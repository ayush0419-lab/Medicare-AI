-- ============================================================================
-- Medicare-AI: Combined Complete Database Schema Setup
-- Run this entire script in the Supabase SQL Editor (New Query)
-- ============================================================================

-- ── 1. Create Tables ────────────────────────────────────────────────────────

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Patients (medical context)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_doctor_id UUID REFERENCES public.profiles(id),
  conditions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'critical')),
  last_visit TIMESTAMPTZ,
  notes TEXT,
  full_name TEXT,
  condition TEXT,
  risk_level TEXT DEFAULT 'Low',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  type TEXT DEFAULT 'in-person' CHECK (type IN ('in-person', 'virtual')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Medical Records
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id),
  diagnosis TEXT NOT NULL,
  prescription TEXT,
  notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Report Analyses (AI-powered report analyzer)
CREATE TABLE IF NOT EXISTS public.report_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('blood_test', 'xray', 'mri', 'ct_scan', 'ecg', 'ultrasound', 'pathology', 'other')),
  file_url TEXT,
  file_name TEXT,
  original_text TEXT,
  ai_summary TEXT,
  ai_findings JSONB DEFAULT '[]',
  ai_risk_level TEXT CHECK (ai_risk_level IN ('low', 'moderate', 'high', 'critical')),
  ai_recommendations TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reviewed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  doctor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Custom OTP codes table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier  TEXT NOT NULL,
  code        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'sms')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  used        BOOLEAN NOT NULL DEFAULT false,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_codes_identifier_idx ON public.otp_codes(identifier);

-- ── 2. Functions & Triggers ──────────────────────────────────────────────────

-- Auto-create profile on signup trigger
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-delete auth user on profile deletion
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_profile();

-- Notify new appointment trigger
CREATE OR REPLACE FUNCTION notify_new_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_doctor_name TEXT;
BEGIN
  SELECT full_name INTO v_patient_name FROM public.profiles WHERE id = NEW.patient_id;
  SELECT full_name INTO v_doctor_name FROM public.profiles WHERE id = NEW.doctor_id;

  IF NEW.doctor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.doctor_id,
      'New Appointment Scheduled',
      'You have a new ' || NEW.type || ' appointment scheduled with ' || COALESCE(v_patient_name, 'a patient') || ' on ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH12:MI AM'),
      'info'
    );
  END IF;

  IF NEW.patient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.patient_id,
      'Appointment Confirmed',
      'Your ' || NEW.type || ' appointment with ' || COALESCE(v_doctor_name, 'a doctor') || ' is scheduled for ' || to_char(NEW.scheduled_at, 'Mon DD, YYYY at HH12:MI AM'),
      'success'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_appointment_created ON public.appointments;
CREATE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_appointment();

-- Notify report status trigger
CREATE OR REPLACE FUNCTION notify_report_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.patient_id,
      'Medical Report Analyzed',
      'Your AI analysis for the recent ' || NEW.report_type || ' report is complete and ready for review.',
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_report_status_changed ON public.report_analyses;
CREATE TRIGGER on_report_status_changed
  AFTER UPDATE ON public.report_analyses
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_status();

-- Auto-cleanup expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - interval '1 day' OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Row Level Security & Access Configuration ──────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- 🔒 Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 🔒 Patients Policies
CREATE POLICY "Patients view own record"
  ON public.patients FOR SELECT USING (
    profile_id = auth.uid()
    OR assigned_doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors and admins can insert patients"
  ON public.patients FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors and admins can update patients"
  ON public.patients FOR UPDATE USING (
    assigned_doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete patients"
  ON public.patients FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 🔒 Appointments Policies
CREATE POLICY "Appointments read access"
  ON public.appointments FOR SELECT USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Appointments insert access"
  ON public.appointments FOR INSERT WITH CHECK (
    patient_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors and admins can update appointments"
  ON public.appointments FOR UPDATE USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 🔒 Medical Records Policies
CREATE POLICY "View own medical records"
  ON public.medical_records FOR SELECT USING (
    patient_id = auth.uid()
    OR doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors can create medical records"
  ON public.medical_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors can update medical records"
  ON public.medical_records FOR UPDATE USING (
    doctor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 🔒 Report Analyses Policies
CREATE POLICY "View own report analyses"
  ON public.report_analyses FOR SELECT USING (
    patient_id = auth.uid()
    OR uploaded_by = auth.uid()
    OR reviewed_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Users can upload reports"
  ON public.report_analyses FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Doctors and admins can update report analyses"
  ON public.report_analyses FOR UPDATE USING (
    uploaded_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Admins can delete report analyses"
  ON public.report_analyses FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 🔒 Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors/Admins can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
    OR auth.uid() = user_id
  );

-- 🔒 OTP Codes Policies (No direct access)
CREATE POLICY "No direct access to OTP codes"
  ON public.otp_codes USING (false);

-- ── 4. Storage Security Hardening ─────────────────────────────────────────────

-- Storage: authenticated users can upload, but restricted read/update/delete
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view strictly their own medical documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND 
    auth.role() = 'authenticated' AND
    (auth.uid() = owner OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'doctor')))
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

-- ── 5. DB Functions & Realtime ────────────────────────────────────────────────

-- Dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_role TEXT, user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  IF user_role = 'admin' THEN
    SELECT json_build_object(
      'total_patients', (SELECT COUNT(*) FROM public.patients),
      'total_appointments_today', (SELECT COUNT(*) FROM public.appointments WHERE scheduled_at::date = CURRENT_DATE),
      'total_doctors', (SELECT COUNT(*) FROM public.profiles WHERE role = 'doctor'),
      'total_records', (SELECT COUNT(*) FROM public.medical_records)
    ) INTO result;
  ELSIF user_role = 'doctor' THEN
    SELECT json_build_object(
      'total_patients', (SELECT COUNT(*) FROM public.patients WHERE assigned_doctor_id = user_id),
      'total_appointments_today', (SELECT COUNT(*) FROM public.appointments WHERE doctor_id = user_id AND scheduled_at::date = CURRENT_DATE),
      'completed_today', (SELECT COUNT(*) FROM public.appointments WHERE doctor_id = user_id AND scheduled_at::date = CURRENT_DATE AND status = 'completed'),
      'total_records', (SELECT COUNT(*) FROM public.medical_records WHERE doctor_id = user_id)
    ) INTO result;
  ELSE
    SELECT json_build_object(
      'total_appointments', (SELECT COUNT(*) FROM public.appointments WHERE patient_id = user_id),
      'upcoming_appointments', (SELECT COUNT(*) FROM public.appointments WHERE patient_id = user_id AND scheduled_at > now() AND status IN ('scheduled', 'confirmed')),
      'total_records', (SELECT COUNT(*) FROM public.medical_records WHERE patient_id = user_id)
    ) INTO result;
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;

-- ── 6. Block direct DB modification by anon keys entirely ──────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
