
-- Check what categories currently exist
SELECT COUNT(*) as total_categories FROM categories;

-- Delete existing categories safely (this will only work if no spending records reference them)
-- If there are spending records, we'll need to handle this differently
DELETE FROM categories;

-- Insert the hierarchical categories data with explicit type casting
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
-- Expense parent categories
('11111111-1111-1111-1111-111111111111'::uuid, 'Business Operations', 'expense'::payment_type, NULL, NULL),
('22222222-2222-2222-2222-222222222222'::uuid, 'Employee Expenses', 'expense'::payment_type, NULL, NULL),
('33333333-3333-3333-3333-333333333333'::uuid, 'Technology & Software', 'expense'::payment_type, NULL, NULL),
('44444444-4444-4444-4444-444444444444'::uuid, 'Marketing & Sales', 'expense'::payment_type, NULL, NULL),
('55555555-5555-5555-5555-555555555555'::uuid, 'Professional Services', 'expense'::payment_type, NULL, NULL),
('66666666-6666-6666-6666-666666666666'::uuid, 'Office & Equipment', 'expense'::payment_type, NULL, NULL),
-- Income parent categories
('77777777-7777-7777-7777-777777777777'::uuid, 'Client Revenue', 'income'::payment_type, NULL, NULL),
('88888888-8888-8888-8888-888888888888'::uuid, 'Other Income', 'income'::payment_type, NULL, NULL);

-- Insert child categories for Business Operations
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('11111111-1111-1111-1111-111111111112'::uuid, 'Bank Fees', 'expense'::payment_type, '11111111-1111-1111-1111-111111111111'::uuid, NULL),
('11111111-1111-1111-1111-111111111113'::uuid, 'Legal & Compliance', 'expense'::payment_type, '11111111-1111-1111-1111-111111111111'::uuid, NULL),
('11111111-1111-1111-1111-111111111114'::uuid, 'Insurance', 'expense'::payment_type, '11111111-1111-1111-1111-111111111111'::uuid, NULL),
('11111111-1111-1111-1111-111111111115'::uuid, 'Taxes', 'expense'::payment_type, '11111111-1111-1111-1111-111111111111'::uuid, NULL),
('11111111-1111-1111-1111-111111111116'::uuid, 'Travel & Transportation', 'expense'::payment_type, '11111111-1111-1111-1111-111111111111'::uuid, NULL);

-- Insert child categories for Employee Expenses  
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('22222222-2222-2222-2222-222222222223'::uuid, 'Salaries', 'expense'::payment_type, '22222222-2222-2222-2222-222222222222'::uuid, NULL),
('22222222-2222-2222-2222-222222222224'::uuid, 'Bonuses', 'expense'::payment_type, '22222222-2222-2222-2222-222222222222'::uuid, NULL),
('22222222-2222-2222-2222-222222222225'::uuid, 'Benefits & Health Insurance', 'expense'::payment_type, '22222222-2222-2222-2222-222222222222'::uuid, NULL),
('22222222-2222-2222-2222-222222222226'::uuid, 'Training & Development', 'expense'::payment_type, '22222222-2222-2222-2222-222222222222'::uuid, NULL),
('22222222-2222-2222-2222-222222222227'::uuid, 'Recruitment', 'expense'::payment_type, '22222222-2222-2222-2222-222222222222'::uuid, NULL);

-- Insert child categories for Technology & Software
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('33333333-3333-3333-3333-333333333334'::uuid, 'Software Subscriptions', 'expense'::payment_type, '33333333-3333-3333-3333-333333333333'::uuid, NULL),
('33333333-3333-3333-3333-333333333335'::uuid, 'Hardware & Equipment', 'expense'::payment_type, '33333333-3333-3333-3333-333333333333'::uuid, NULL),
('33333333-3333-3333-3333-333333333336'::uuid, 'Cloud Services', 'expense'::payment_type, '33333333-3333-3333-3333-333333333333'::uuid, NULL),
('33333333-3333-3333-3333-333333333337'::uuid, 'Development Tools', 'expense'::payment_type, '33333333-3333-3333-3333-333333333333'::uuid, NULL),
('33333333-3333-3333-3333-333333333338'::uuid, 'IT Support & Maintenance', 'expense'::payment_type, '33333333-3333-3333-3333-333333333333'::uuid, NULL);

-- Insert child categories for Marketing & Sales
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('44444444-4444-4444-4444-444444444445'::uuid, 'Advertising', 'expense'::payment_type, '44444444-4444-4444-4444-444444444444'::uuid, NULL),
('44444444-4444-4444-4444-444444444446'::uuid, 'Content Creation', 'expense'::payment_type, '44444444-4444-4444-4444-444444444444'::uuid, NULL),
('44444444-4444-4444-4444-444444444447'::uuid, 'Events & Conferences', 'expense'::payment_type, '44444444-4444-4444-4444-444444444444'::uuid, NULL),
('44444444-4444-4444-4444-444444444448'::uuid, 'Sales Tools', 'expense'::payment_type, '44444444-4444-4444-4444-444444444444'::uuid, NULL),
('44444444-4444-4444-4444-444444444449'::uuid, 'Public Relations', 'expense'::payment_type, '44444444-4444-4444-4444-444444444444'::uuid, NULL);

-- Insert child categories for Professional Services
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('55555555-5555-5555-5555-555555555556'::uuid, 'Accounting & Bookkeeping', 'expense'::payment_type, '55555555-5555-5555-5555-555555555555'::uuid, NULL),
('55555555-5555-5555-5555-555555555557'::uuid, 'Legal Services', 'expense'::payment_type, '55555555-5555-5555-5555-555555555555'::uuid, NULL),
('55555555-5555-5555-5555-555555555558'::uuid, 'Consulting', 'expense'::payment_type, '55555555-5555-5555-5555-555555555555'::uuid, NULL),
('55555555-5555-5555-5555-555555555559'::uuid, 'Freelancers & Contractors', 'expense'::payment_type, '55555555-5555-5555-5555-555555555555'::uuid, NULL),
('55555555-5555-5555-5555-55555555555a'::uuid, 'Business Services', 'expense'::payment_type, '55555555-5555-5555-5555-555555555555'::uuid, NULL);

-- Insert child categories for Office & Equipment
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('66666666-6666-6666-6666-666666666667'::uuid, 'Office Rent', 'expense'::payment_type, '66666666-6666-6666-6666-666666666666'::uuid, NULL),
('66666666-6666-6666-6666-666666666668'::uuid, 'Office Supplies', 'expense'::payment_type, '66666666-6666-6666-6666-666666666666'::uuid, NULL),
('66666666-6666-6666-6666-666666666669'::uuid, 'Utilities', 'expense'::payment_type, '66666666-6666-6666-6666-666666666666'::uuid, NULL),
('66666666-6666-6666-6666-66666666666a'::uuid, 'Furniture', 'expense'::payment_type, '66666666-6666-6666-6666-666666666666'::uuid, NULL),
('66666666-6666-6666-6666-66666666666b'::uuid, 'Maintenance & Repairs', 'expense'::payment_type, '66666666-6666-6666-6666-666666666666'::uuid, NULL);

-- Insert child categories for Client Revenue
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('77777777-7777-7777-7777-777777777778'::uuid, 'Development Services', 'income'::payment_type, '77777777-7777-7777-7777-777777777777'::uuid, NULL),
('77777777-7777-7777-7777-777777777779'::uuid, 'Consulting Services', 'income'::payment_type, '77777777-7777-7777-7777-777777777777'::uuid, NULL),
('77777777-7777-7777-7777-77777777777a'::uuid, 'Maintenance & Support', 'income'::payment_type, '77777777-7777-7777-7777-777777777777'::uuid, NULL),
('77777777-7777-7777-7777-77777777777b'::uuid, 'Project Management', 'income'::payment_type, '77777777-7777-7777-7777-777777777777'::uuid, NULL),
('77777777-7777-7777-7777-77777777777c'::uuid, 'Training Services', 'income'::payment_type, '77777777-7777-7777-7777-777777777777'::uuid, NULL);

-- Insert child categories for Other Income
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('88888888-8888-8888-8888-888888888889'::uuid, 'Investment Returns', 'income'::payment_type, '88888888-8888-8888-8888-888888888888'::uuid, NULL),
('88888888-8888-8888-8888-88888888888a'::uuid, 'Interest Income', 'income'::payment_type, '88888888-8888-8888-8888-888888888888'::uuid, NULL),
('88888888-8888-8888-8888-88888888888b'::uuid, 'Grants & Subsidies', 'income'::payment_type, '88888888-8888-8888-8888-888888888888'::uuid, NULL),
('88888888-8888-8888-8888-88888888888c'::uuid, 'Refunds', 'income'::payment_type, '88888888-8888-8888-8888-888888888888'::uuid, NULL),
('88888888-8888-8888-8888-88888888888d'::uuid, 'Miscellaneous Income', 'income'::payment_type, '88888888-8888-8888-8888-888888888888'::uuid, NULL);

-- Verify the data was inserted correctly
SELECT COUNT(*) as total_categories FROM categories;
SELECT name, type, parent_id FROM categories WHERE type = 'expense' ORDER BY parent_id NULLS FIRST, name LIMIT 20;
