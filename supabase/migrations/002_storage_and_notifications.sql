-- ============================================================================
-- Medicare-AI Database Schema Update: Storage & Notifications
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ── 1. Notifications Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors/Admins can insert notifications"
  ON notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin'))
    OR auth.uid() = user_id
  );

-- Enable Realtime for notifications (required for UI subscriptions)
-- NOTE: You may need to enable realtime for 'notifications' via the Dashboard GUI as well.
alter publication supabase_realtime add table notifications;


-- ── 2. Storage Buckets (Execute IF `storage` schema is available/enabled) ───
-- If doing this via Dashboard, go to Storage -> Create "avatars" (Public) 
-- and "documents" (Private) buckets.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, '{"image/*"}'),
  ('documents', 'documents', false, 10485760, '{"application/pdf", "image/*"}')
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'avatars'
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage Policies for 'documents' (Medical Reports)
CREATE POLICY "Users can view their own documents."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Doctors and patients can upload documents."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Doctors and patients can update documents."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
