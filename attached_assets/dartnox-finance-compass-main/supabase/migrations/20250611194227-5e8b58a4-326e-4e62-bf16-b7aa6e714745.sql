
-- Add user status and activity tracking to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'inactive')),
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Create user activity logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user permissions table (for custom permissions per user)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  granted boolean DEFAULT true,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- Create role permissions table (permissions that come with roles)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Add additional fields to user_invitations
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS message text,
ADD COLUMN IF NOT EXISTS resent_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resent_at timestamp with time zone;

-- Enable RLS on new tables
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_logs
CREATE POLICY "Users can view activity logs in their account"
  ON public.user_activity_logs
  FOR SELECT
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "Admins can insert activity logs"
  ON public.user_activity_logs
  FOR INSERT
  WITH CHECK (
    account_id = public.get_user_account_id(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin', 'manager')
  );

-- RLS Policies for permissions
CREATE POLICY "Users can view permissions"
  ON public.permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage permissions"
  ON public.permissions
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'super_admin');

-- RLS Policies for user_permissions
CREATE POLICY "Users can view permissions in their account"
  ON public.user_permissions
  FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM public.user_profiles 
      WHERE account_id = public.get_user_account_id(auth.uid())
    )
  );

CREATE POLICY "Admins can manage user permissions"
  ON public.user_permissions
  FOR ALL
  USING (
    user_id IN (
      SELECT user_id FROM public.user_profiles 
      WHERE account_id = public.get_user_account_id(auth.uid())
    ) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- RLS Policies for role_permissions
CREATE POLICY "Users can view role permissions"
  ON public.role_permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage role permissions"
  ON public.role_permissions
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'super_admin');

-- Insert default permissions
INSERT INTO public.permissions (name, description, category) VALUES
('view_dashboard', 'View dashboard and analytics', 'dashboard'),
('manage_expenses', 'Create, edit, and delete expenses', 'expenses'),
('manage_income', 'Create, edit, and delete income', 'income'),
('manage_employees', 'Create, edit, and delete employees', 'employees'),
('manage_clients', 'Create, edit, and delete clients', 'clients'),
('manage_categories', 'Create, edit, and delete categories', 'settings'),
('manage_payment_sources', 'Create, edit, and delete payment sources', 'settings'),
('manage_users', 'Invite, edit, and manage users', 'users'),
('view_reports', 'View and export reports', 'reports'),
('manage_settings', 'Modify application settings', 'settings')
ON CONFLICT (name) DO NOTHING;

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'super_admin', id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'admin', id FROM public.permissions WHERE category != 'users'
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'manager', id FROM public.permissions WHERE name IN ('view_dashboard', 'manage_expenses', 'manage_income', 'manage_employees', 'view_reports')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'user', id FROM public.permissions WHERE name IN ('view_dashboard', 'manage_expenses', 'manage_income')
ON CONFLICT (role, permission_id) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'viewer', id FROM public.permissions WHERE name IN ('view_dashboard', 'view_reports')
ON CONFLICT (role, permission_id) DO NOTHING;

-- Create function to log user activities
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
  user_account_id uuid;
BEGIN
  -- Get user's account_id
  SELECT account_id INTO user_account_id
  FROM public.user_profiles
  WHERE user_id = p_user_id;

  -- Insert activity log
  INSERT INTO public.user_activity_logs (
    user_id,
    account_id,
    action,
    details,
    ip_address,
    user_agent,
    created_by
  ) VALUES (
    p_user_id,
    user_account_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent,
    auth.uid()
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE(permission_name text, granted boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  WITH role_perms AS (
    SELECT p.name as permission_name, true as granted
    FROM public.user_profiles up
    JOIN public.role_permissions rp ON rp.role = up.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE up.user_id = p_user_id
  ),
  user_perms AS (
    SELECT p.name as permission_name, up.granted
    FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
  )
  SELECT 
    COALESCE(up.permission_name, rp.permission_name) as permission_name,
    COALESCE(up.granted, rp.granted) as granted
  FROM role_perms rp
  FULL OUTER JOIN user_perms up ON up.permission_name = rp.permission_name;
$$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_user_activity_logs_updated_at 
  BEFORE UPDATE ON public.user_activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
