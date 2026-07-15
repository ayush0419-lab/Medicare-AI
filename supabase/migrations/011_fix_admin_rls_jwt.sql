-- ============================================================================
-- Medicare-AI Database Schema Update: Fix Admin RLS using JWT Metadata
-- ============================================================================

-- Drop old policies that query profiles table
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- Create updated policies using JWT claims (bypasses table query circular loops)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

CREATE POLICY "Admins can delete any profile"
  ON public.profiles FOR DELETE USING (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );
