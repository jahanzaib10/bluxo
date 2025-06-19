
-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_url TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'manager', 'user', 'viewer');

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user invitations table
CREATE TABLE public.user_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE user_profiles.user_id = $1;
$$;

-- Create security definer function to get user's account
CREATE OR REPLACE FUNCTION public.get_user_account_id(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT account_id FROM public.user_profiles WHERE user_profiles.user_id = $1;
$$;

-- RLS Policies for accounts
CREATE POLICY "Users can view their account"
  ON public.accounts
  FOR SELECT
  USING (id = public.get_user_account_id(auth.uid()));

CREATE POLICY "Admins can update their account"
  ON public.accounts
  FOR UPDATE
  USING (
    id = public.get_user_account_id(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

CREATE POLICY "Super admins can create accounts"
  ON public.accounts
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view profiles in their account"
  ON public.user_profiles
  FOR SELECT
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their account"
  ON public.user_profiles
  FOR UPDATE
  USING (
    account_id = public.get_user_account_id(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

CREATE POLICY "System can create profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_invitations
CREATE POLICY "Users can view invitations for their account"
  ON public.user_invitations
  FOR SELECT
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "Admins can create invitations"
  ON public.user_invitations
  FOR INSERT
  WITH CHECK (
    account_id = public.get_user_account_id(auth.uid()) AND
    public.get_user_role(auth.uid()) IN ('super_admin', 'admin')
  );

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_id_var UUID;
BEGIN
  -- Create account for the first user (if they don't have one)
  INSERT INTO public.accounts (company_name, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'My Company'),
    NEW.id
  )
  RETURNING id INTO account_id_var;

  -- Create user profile
  INSERT INTO public.user_profiles (
    user_id,
    account_id,
    first_name,
    last_name,
    role
  )
  VALUES (
    NEW.id,
    account_id_var,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    'super_admin'
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
