
-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Allow updating invitations to mark as accepted" ON public.user_invitations;

-- Create a more permissive policy that allows updating invitations to mark as accepted
-- This allows any authenticated user to mark an invitation as accepted if it's currently pending
CREATE POLICY "Allow marking invitations as accepted" 
  ON public.user_invitations 
  FOR UPDATE 
  TO authenticated
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);

-- Also allow anonymous users to mark invitations as accepted (for the invitation flow)
CREATE POLICY "Allow anonymous to mark invitations as accepted" 
  ON public.user_invitations 
  FOR UPDATE 
  TO anon
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);
