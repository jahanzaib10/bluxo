
-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Allow updating any pending invitation to mark as accepted" ON public.user_invitations;
DROP POLICY IF EXISTS "Allow anonymous users to update pending invitations" ON public.user_invitations;

-- Create a simple, non-recursive policy for updating invitations
-- This allows ANY authenticated or anonymous user to update pending invitations
CREATE POLICY "Allow updating pending invitations" 
  ON public.user_invitations 
  FOR UPDATE 
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);

-- Create a separate policy for anonymous users (needed for signup flow)
CREATE POLICY "Allow anonymous updating of pending invitations"
  ON public.user_invitations
  FOR UPDATE
  TO anon
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);
