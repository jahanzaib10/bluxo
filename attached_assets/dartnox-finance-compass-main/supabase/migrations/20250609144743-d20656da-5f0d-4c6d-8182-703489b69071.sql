
-- First, delete all existing categories to start fresh
DELETE FROM public.categories;

-- Insert Parent Categories
INSERT INTO public.categories (name, type, parent_id) VALUES 
  ('Employee Expenses', 'expense'::payment_type, NULL),
  ('Tax Expenses', 'expense'::payment_type, NULL),
  ('Operational Expenses', 'expense'::payment_type, NULL),
  ('Technology & Software', 'expense'::payment_type, NULL),
  ('Marketing & Advertising', 'expense'::payment_type, NULL),
  ('Professional Services', 'expense'::payment_type, NULL),
  ('Vendor & Supplier Costs', 'expense'::payment_type, NULL),
  ('Business Development', 'expense'::payment_type, NULL);

-- Insert Child Categories for Employee Expenses
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Employee Expenses' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Salary', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Benefits', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Bonuses & Incentives', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Training & Development', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Travel & Accommodation', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Equipment & Supplies', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Overtime Pay', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Commission', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Tax Expenses
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Tax Expenses' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Government Tax', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'State Tax', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'VAT/Sales Tax', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Property Tax', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Payroll Tax', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Local Municipality Tax', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Social Security Tax', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Operational Expenses
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Operational Expenses' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Office Rent', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Utilities', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Office Supplies', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Equipment Maintenance', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Insurance', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Communication', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Cleaning Services', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Technology & Software
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Technology & Software' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Software Subscriptions', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Hardware & Equipment', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Hosting & Cloud Services', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Software Licenses', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'IT Support & Maintenance', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Domain & Website Costs', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Marketing & Advertising
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Marketing & Advertising' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Digital Marketing', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Content Creation', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Print Advertising', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Events & Conferences', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Promotional Materials', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Website Development', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'SEO Services', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Professional Services
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Professional Services' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Legal Services', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Accounting & Bookkeeping', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Consulting', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Audit & Compliance', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Banking Fees', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Financial Advisory', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Vendor & Supplier Costs
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Vendor & Supplier Costs' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Raw Materials', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Manufacturing Costs', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Shipping & Logistics', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Third-party Services', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Contractor Payments', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Freelancer Fees', 'expense'::payment_type, id FROM parent_cat;

-- Insert Child Categories for Business Development
WITH parent_cat AS (SELECT id FROM public.categories WHERE name = 'Business Development' AND parent_id IS NULL)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Client Entertainment', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Business Travel', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Networking Events', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Partnership Costs', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Market Research', 'expense'::payment_type, id FROM parent_cat
UNION ALL SELECT 'Business Licenses', 'expense'::payment_type, id FROM parent_cat;
