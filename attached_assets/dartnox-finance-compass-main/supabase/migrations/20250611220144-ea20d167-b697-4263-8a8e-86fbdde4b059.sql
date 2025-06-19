
-- First, let's identify the super admin user
DO $$
DECLARE
    admin_user_id UUID;
    admin_account_id UUID;
BEGIN
    -- Get the super admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'jahanzebq66@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Super admin user jahanzebq66@gmail.com not found';
    END IF;
    
    -- Get the admin's account ID
    SELECT account_id INTO admin_account_id 
    FROM public.user_profiles 
    WHERE user_id = admin_user_id;
    
    -- Delete all pending invitations (except those created by the super admin if you want to keep them)
    DELETE FROM public.user_invitations 
    WHERE account_id = admin_account_id;
    
    -- Delete all user profiles except the super admin
    DELETE FROM public.user_profiles 
    WHERE user_id != admin_user_id 
    AND account_id = admin_account_id;
    
    -- Delete auth users except the super admin
    -- Note: This will cascade and clean up related data
    DELETE FROM auth.users 
    WHERE id != admin_user_id 
    AND id IN (
        SELECT DISTINCT user_id 
        FROM public.user_profiles 
        WHERE account_id = admin_account_id
        UNION
        SELECT DISTINCT invited_by 
        FROM public.user_invitations 
        WHERE account_id = admin_account_id
    );
    
    RAISE NOTICE 'Successfully cleaned up users. Super admin % preserved.', 'jahanzebq66@gmail.com';
END $$;
