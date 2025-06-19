
-- Update the handle_new_user function to properly check for skip_profile_creation flag
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_id_var UUID;
BEGIN
  -- Check if profile creation should be skipped (for invitation flow)
  -- Check both the flag and ensure it's exactly 'true' as a string
  IF NEW.raw_user_meta_data ->> 'skip_profile_creation' = 'true' THEN
    RAISE LOG 'Skipping profile creation for user % due to skip_profile_creation flag', NEW.id;
    RETURN NEW;
  END IF;

  RAISE LOG 'Creating profile for user % (no skip flag found)', NEW.id;

  -- Create account for the first user (if they don't have one)
  INSERT INTO public.accounts (company_name, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'My Company'),
    NEW.id
  )
  RETURNING id INTO account_id_var;

  -- Create user profile
  INSERT INTO public.user_profiles (
    user_id,
    account_id,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    account_id_var,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    'super_admin'
  );

  RETURN NEW;
END;
$$;
