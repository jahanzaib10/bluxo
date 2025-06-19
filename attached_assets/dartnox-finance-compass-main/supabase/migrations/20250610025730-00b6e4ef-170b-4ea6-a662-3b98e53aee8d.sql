
-- First, let's ensure RLS policies exist for the accounts table
DROP POLICY IF EXISTS "Users can view their account" ON public.accounts;
DROP POLICY IF EXISTS "Admins can update their account" ON public.accounts;
DROP POLICY IF EXISTS "Super admins can create accounts" ON public.accounts;

-- Create proper RLS policies for accounts
CREATE POLICY "Users can view their account"
  ON public.accounts
  FOR SELECT
  USING (id = public.get_user_account_id(auth.uid()));

CREATE POLICY "Admins can update their account"
  ON public.accounts
  FOR UPDATE
  USING (
    id = public.get_user_account_id(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

CREATE POLICY "Super admins can create accounts"
  ON public.accounts
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Ensure RLS policies exist for user_profiles table
DROP POLICY IF EXISTS "Users can view profiles in their account" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their account" ON public.user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.user_profiles;

-- Create proper RLS policies for user_profiles
CREATE POLICY "Users can view profiles in their account"
  ON public.user_profiles
  FOR SELECT
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their account"
  ON public.user_profiles
  FOR UPDATE
  USING (
    account_id = public.get_user_account_id(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

CREATE POLICY "System can create profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Now let's make sure your account and profile exist by inserting them if they don't
INSERT INTO public.accounts (id, company_name, company_url, currency, created_by, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Dartnox LLC',
  'https://dartnox.com',
  'USD',
  auth_user.id,
  now(),
  now()
FROM auth.users auth_user
WHERE auth_user.email = 'jahanzebq66@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE created_by = auth_user.id
  );

-- Insert user profile if it doesn't exist
INSERT INTO public.user_profiles (id, user_id, account_id, first_name, last_name, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  auth_user.id,
  acc.id,
  COALESCE(auth_user.raw_user_meta_data ->> 'first_name', 'User'),
  COALESCE(auth_user.raw_user_meta_data ->> 'last_name', ''),
  'super_admin',
  now(),
  now()
FROM auth.users auth_user
JOIN public.accounts acc ON acc.created_by = auth_user.id
WHERE auth_user.email = 'jahanzebq66@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth_user.id
  );
