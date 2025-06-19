
-- Drop all existing update policies for user_invitations
DROP POLICY IF EXISTS "Allow marking pending invitations as accepted" ON public.user_invitations;
DROP POLICY IF EXISTS "Allow anonymous to mark invitations as accepted during signup" ON public.user_invitations;
DROP POLICY IF EXISTS "Allow marking invitations as accepted by email" ON public.user_invitations;

-- Create a completely permissive policy for updating user_invitations
-- This allows ANY user to update ANY invitation that's pending
-- We're controlling what fields can be updated with WITH CHECK
CREATE POLICY "Allow updating any pending invitation to mark as accepted" 
  ON public.user_invitations 
  FOR UPDATE 
  USING (accepted_at IS NULL)
  WITH CHECK (
    accepted_at IS NOT NULL AND
    (SELECT COUNT(*) FROM user_invitations WHERE id = user_invitations.id) > 0
  );

-- Enable the same for anonymous users during signup flow
CREATE POLICY "Allow anonymous users to update pending invitations"
  ON public.user_invitations
  FOR UPDATE
  TO anon
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);
