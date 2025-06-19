
-- Give super admins unrestricted access to all data

-- Categories table - add super admin policies
CREATE POLICY "Super admins can view all categories"
  ON public.categories
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can insert any category"
  ON public.categories
  FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can update any category"
  ON public.categories
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can delete any category"
  ON public.categories
  FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'super_admin');

-- Subscriptions table - add super admin policies
CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can insert any subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can update any subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can delete any subscription"
  ON public.subscriptions
  FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'super_admin');

-- Add super admin policies for all other tables too
CREATE POLICY "Super admins can view all clients"
  ON public.clients
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can view all spending"
  ON public.spending
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can view all income"
  ON public.income
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can view all employees"
  ON public.employees
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can view all payment_sources"
  ON public.payment_sources
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can view all vendors"
  ON public.vendors
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "Super admins can view all developers"
  ON public.developers
  FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'super_admin');
