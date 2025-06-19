
-- Allow users to mark invitations as accepted if they match the invitation email
-- This is needed for the invitation acceptance flow
DROP POLICY IF EXISTS "Allow marking invitations as accepted by email" ON public.user_invitations;

CREATE POLICY "Allow marking invitations as accepted by email" 
  ON public.user_invitations 
  FOR UPDATE 
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND
    accepted_at IS NULL
  )
  WITH CHECK (accepted_at IS NOT NULL);
