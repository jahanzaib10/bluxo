
-- Update the existing account for the current user
UPDATE public.accounts 
SET 
  company_name = 'Dartnox LLC',
  company_url = 'https://dartnox.com',
  currency = 'USD',
  updated_at = now()
WHERE created_by = (
  SELECT id FROM auth.users WHERE email = 'jahanzebq66@gmail.com'
);

-- Ensure the user profile has the correct role and details
UPDATE public.user_profiles 
SET 
  role = 'super_admin',
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'jahanzebq66@gmail.com'
);
