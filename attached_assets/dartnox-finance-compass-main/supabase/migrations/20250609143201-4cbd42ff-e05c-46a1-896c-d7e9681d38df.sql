
-- Create default expense categories for employee expenses
INSERT INTO public.categories (name, type, parent_id) VALUES 
  ('Employee Expenses', 'expense'::payment_type, NULL),
  ('Business Operations', 'expense'::payment_type, NULL),
  ('Office Supplies', 'expense'::payment_type, NULL);

-- Get the parent category IDs for child categories
WITH parent_cats AS (
  SELECT id, name FROM public.categories WHERE parent_id IS NULL AND type = 'expense'::payment_type
)
INSERT INTO public.categories (name, type, parent_id) 
SELECT 'Salary', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Employee Expenses'
UNION ALL
SELECT 'Bonus', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Employee Expenses'
UNION ALL
SELECT 'Benefits', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Employee Expenses'
UNION ALL
SELECT 'Training', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Employee Expenses'
UNION ALL
SELECT 'Equipment', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Business Operations'
UNION ALL
SELECT 'Software', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Business Operations'
UNION ALL
SELECT 'Utilities', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Business Operations'
UNION ALL
SELECT 'Stationery', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Office Supplies'
UNION ALL
SELECT 'Furniture', 'expense'::payment_type, id FROM parent_cats WHERE name = 'Office Supplies';
