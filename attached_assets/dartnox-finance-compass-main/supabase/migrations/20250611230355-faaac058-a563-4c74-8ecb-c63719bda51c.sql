
-- Update RLS policies to allow account-based access instead of user-based access

-- Drop existing restrictive policies and create account-based ones

-- Categories table
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categories;

CREATE POLICY "Users can view categories in their account"
  ON public.categories
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create categories in their account"
  ON public.categories
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update categories in their account"
  ON public.categories
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete categories in their account"
  ON public.categories
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clients in their account"
  ON public.clients
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create clients in their account"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update clients in their account"
  ON public.clients
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete clients in their account"
  ON public.clients
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Spending table
ALTER TABLE public.spending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view spending in their account"
  ON public.spending
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create spending in their account"
  ON public.spending
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update spending in their account"
  ON public.spending
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete spending in their account"
  ON public.spending
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Income table
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view income in their account"
  ON public.income
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create income in their account"
  ON public.income
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update income in their account"
  ON public.income
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete income in their account"
  ON public.income
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view employees in their account"
  ON public.employees
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create employees in their account"
  ON public.employees
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update employees in their account"
  ON public.employees
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete employees in their account"
  ON public.employees
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subscriptions in their account"
  ON public.subscriptions
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create subscriptions in their account"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update subscriptions in their account"
  ON public.subscriptions
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete subscriptions in their account"
  ON public.subscriptions
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Payment sources table
ALTER TABLE public.payment_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment sources in their account"
  ON public.payment_sources
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create payment sources in their account"
  ON public.payment_sources
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update payment sources in their account"
  ON public.payment_sources
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete payment sources in their account"
  ON public.payment_sources
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Vendors table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vendors in their account"
  ON public.vendors
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create vendors in their account"
  ON public.vendors
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update vendors in their account"
  ON public.vendors
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete vendors in their account"
  ON public.vendors
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

-- Developers table
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view developers in their account"
  ON public.developers
  FOR SELECT
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can create developers in their account"
  ON public.developers
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update developers in their account"
  ON public.developers
  FOR UPDATE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));

CREATE POLICY "Users can delete developers in their account"
  ON public.developers
  FOR DELETE
  USING (created_by IN (
    SELECT user_id FROM public.user_profiles 
    WHERE account_id = public.get_user_account_id(auth.uid())
  ));
