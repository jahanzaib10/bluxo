
-- Check current RLS policies for user_invitations table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_invitations';

-- If there are no delete policies, create one
-- This policy allows users to delete invitations from their account
DO $$
BEGIN
    -- Check if delete policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_invitations' 
        AND cmd = 'DELETE'
    ) THEN
        -- Create delete policy for invitations
        EXECUTE 'CREATE POLICY "Users can delete invitations from their account" 
                ON public.user_invitations 
                FOR DELETE 
                USING (
                    account_id IN (
                        SELECT account_id 
                        FROM public.user_profiles 
                        WHERE user_id = auth.uid()
                    )
                )';
    END IF;
END
$$;
