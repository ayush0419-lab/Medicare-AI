-- ============================================================================
-- Medicare-AI Database Schema Update: Admin Profile Management Policies
-- ============================================================================

-- Allow admins to update any user profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete any user profile
CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
