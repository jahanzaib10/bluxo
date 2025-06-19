
-- Enable Row Level Security on the categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to read categories
-- This makes sense because categories are typically shared across all users in a business app
CREATE POLICY "Allow authenticated users to read categories" 
  ON public.categories 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert categories (for admin/management functions)
CREATE POLICY "Allow authenticated users to insert categories" 
  ON public.categories 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update categories
CREATE POLICY "Allow authenticated users to update categories" 
  ON public.categories 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete categories
CREATE POLICY "Allow authenticated users to delete categories" 
  ON public.categories 
  FOR DELETE 
  USING (auth.role() = 'authenticated');
