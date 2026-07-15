-- ============================================================================
-- Medicare-AI Database Schema Update: Fix Doctor Profile Deletion & RLS
-- ============================================================================

-- 1. Drop old policies to replace them
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- 2. Create updated policies checking both JWT metadata and profiles table role
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

-- 3. Trigger to delete the auth.users record when a public.profiles record is deleted
-- This ensures that deleting a profile also completely deletes the authentication account.
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_profile();
