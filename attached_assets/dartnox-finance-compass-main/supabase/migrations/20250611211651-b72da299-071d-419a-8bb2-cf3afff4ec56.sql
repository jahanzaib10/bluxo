
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous users to read pending invitations by token" ON public.user_invitations;
DROP POLICY IF EXISTS "Users can read invitations for their account" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Allow updating invitations to mark as accepted" ON public.user_invitations;

-- Enable RLS on user_invitations table if not already enabled
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read pending invitations by token
-- This is necessary for the invitation acceptance flow
CREATE POLICY "Allow anonymous users to read pending invitations by token" 
  ON public.user_invitations 
  FOR SELECT 
  TO anon
  USING (accepted_at IS NULL);

-- Allow authenticated users to read invitations for their account
CREATE POLICY "Users can read invitations for their account" 
  ON public.user_invitations 
  FOR SELECT 
  TO authenticated
  USING (
    account_id IN (
      SELECT account_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Allow users with admin role to insert invitations
CREATE POLICY "Admins can create invitations" 
  ON public.user_invitations 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND account_id = user_invitations.account_id
      AND role IN ('admin', 'super_admin')
    )
  );

-- Allow users to update invitations (mark as accepted)
CREATE POLICY "Allow updating invitations to mark as accepted" 
  ON public.user_invitations 
  FOR UPDATE 
  TO authenticated
  USING (accepted_at IS NULL)
  WITH CHECK (accepted_at IS NOT NULL);
