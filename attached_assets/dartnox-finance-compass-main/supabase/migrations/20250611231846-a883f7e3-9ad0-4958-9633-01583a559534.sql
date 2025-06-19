
-- First, let's check what policies currently exist on categories table
-- and ensure super admin access is properly configured

-- Drop any conflicting policies that might be preventing super admin access
DROP POLICY IF EXISTS "Users can view categories in their account" ON public.categories;
DROP POLICY IF EXISTS "Users can create categories in their account" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories in their account" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories in their account" ON public.categories;

-- Recreate the account-based policies with proper logic
CREATE POLICY "Users can view categories in their account"
  ON public.categories
  FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'super_admin' OR
    created_by IN (
      SELECT user_id FROM public.user_profiles 
      WHERE account_id = public.get_user_account_id(auth.uid())
    )
  );

CREATE POLICY "Users can create categories in their account"
  ON public.categories
  FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin' OR
    auth.uid() = created_by
  );

CREATE POLICY "Users can update categories in their account"
  ON public.categories
  FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin' OR
    created_by IN (
      SELECT user_id FROM public.user_profiles 
      WHERE account_id = public.get_user_account_id(auth.uid())
    )
  );

CREATE POLICY "Users can delete categories in their account"
  ON public.categories
  FOR DELETE
  USING (
    public.get_user_role(auth.uid()) = 'super_admin' OR
    created_by IN (
      SELECT user_id FROM public.user_profiles 
      WHERE account_id = public.get_user_account_id(auth.uid())
    )
  );
