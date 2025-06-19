
-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Allow marking invitations as accepted by email" ON public.user_invitations;

-- Create a more permissive policy that allows any authenticated user to mark invitations as accepted
-- if the invitation is currently pending (accepted_at IS NULL)
CREATE POLICY "Allow marking pending invitations as accepted" 
  ON public.user_invitations 
  FOR UPDATE 
  TO authenticated
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);

-- Also ensure anonymous users can update invitations during the signup flow
DROP POLICY IF EXISTS "Allow anonymous to mark invitations as accepted" ON public.user_invitations;
CREATE POLICY "Allow anonymous to mark invitations as accepted during signup" 
  ON public.user_invitations 
  FOR UPDATE 
  TO anon
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);
