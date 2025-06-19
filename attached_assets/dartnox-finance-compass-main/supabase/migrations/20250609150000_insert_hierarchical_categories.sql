
-- Insert the hierarchical categories data
-- First, insert root categories (parent categories)
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
-- Expense categories
('11111111-1111-1111-1111-111111111111', 'Business Operations', 'expense', NULL, NULL),
('22222222-2222-2222-2222-222222222222', 'Employee Expenses', 'expense', NULL, NULL),
('33333333-3333-3333-3333-333333333333', 'Technology & Software', 'expense', NULL, NULL),
('44444444-4444-4444-4444-444444444444', 'Marketing & Sales', 'expense', NULL, NULL),
('55555555-5555-5555-5555-555555555555', 'Professional Services', 'expense', NULL, NULL),
('66666666-6666-6666-6666-666666666666', 'Office & Equipment', 'expense', NULL, NULL),
-- Income categories
('77777777-7777-7777-7777-777777777777', 'Client Revenue', 'income', NULL, NULL),
('88888888-8888-8888-8888-888888888888', 'Other Income', 'income', NULL, NULL);

-- Insert child categories under Business Operations
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('a1111111-1111-1111-1111-111111111111', 'Bank Fees', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('a1111111-1111-1111-1111-111111111112', 'Legal & Compliance', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('a1111111-1111-1111-1111-111111111113', 'Insurance', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('a1111111-1111-1111-1111-111111111114', 'Taxes', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('a1111111-1111-1111-1111-111111111115', 'Travel & Transportation', 'expense', '11111111-1111-1111-1111-111111111111', NULL);

-- Insert child categories under Employee Expenses
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('b2222222-2222-2222-2222-222222222221', 'Salaries', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('b2222222-2222-2222-2222-222222222222', 'Bonuses', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('b2222222-2222-2222-2222-222222222223', 'Benefits & Health Insurance', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('b2222222-2222-2222-2222-222222222224', 'Training & Development', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('b2222222-2222-2222-2222-222222222225', 'Recruitment', 'expense', '22222222-2222-2222-2222-222222222222', NULL);

-- Insert child categories under Technology & Software
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('c3333333-3333-3333-3333-333333333331', 'Software Subscriptions', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('c3333333-3333-3333-3333-333333333332', 'Hardware & Equipment', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('c3333333-3333-3333-3333-333333333333', 'Cloud Services', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('c3333333-3333-3333-3333-333333333334', 'Development Tools', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('c3333333-3333-3333-3333-333333333335', 'IT Support & Maintenance', 'expense', '33333333-3333-3333-3333-333333333333', NULL);

-- Insert child categories under Marketing & Sales
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('d4444444-4444-4444-4444-444444444441', 'Advertising', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('d4444444-4444-4444-4444-444444444442', 'Content Creation', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('d4444444-4444-4444-4444-444444444443', 'Events & Conferences', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('d4444444-4444-4444-4444-444444444444', 'Sales Tools', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('d4444444-4444-4444-4444-444444444445', 'Public Relations', 'expense', '44444444-4444-4444-4444-444444444444', NULL);

-- Insert child categories under Professional Services
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('e5555555-5555-5555-5555-555555555551', 'Accounting & Bookkeeping', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('e5555555-5555-5555-5555-555555555552', 'Legal Services', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('e5555555-5555-5555-5555-555555555553', 'Consulting', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('e5555555-5555-5555-5555-555555555554', 'Freelancers & Contractors', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('e5555555-5555-5555-5555-555555555555', 'Business Services', 'expense', '55555555-5555-5555-5555-555555555555', NULL);

-- Insert child categories under Office & Equipment
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('f6666666-6666-6666-6666-666666666661', 'Office Rent', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('f6666666-6666-6666-6666-666666666662', 'Office Supplies', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('f6666666-6666-6666-6666-666666666663', 'Utilities', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('f6666666-6666-6666-6666-666666666664', 'Furniture', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('f6666666-6666-6666-6666-666666666665', 'Maintenance & Repairs', 'expense', '66666666-6666-6666-6666-666666666666', NULL);

-- Insert child categories under Client Revenue
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('g7777777-7777-7777-7777-777777777771', 'Development Services', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('g7777777-7777-7777-7777-777777777772', 'Consulting Services', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('g7777777-7777-7777-7777-777777777773', 'Maintenance & Support', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('g7777777-7777-7777-7777-777777777774', 'Project Management', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('g7777777-7777-7777-7777-777777777775', 'Training Services', 'income', '77777777-7777-7777-7777-777777777777', NULL);

-- Insert child categories under Other Income
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('h8888888-8888-8888-8888-888888888881', 'Investment Returns', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('h8888888-8888-8888-8888-888888888882', 'Interest Income', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('h8888888-8888-8888-8888-888888888883', 'Grants & Subsidies', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('h8888888-8888-8888-8888-888888888884', 'Refunds', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('h8888888-8888-8888-8888-888888888885', 'Miscellaneous Income', 'income', '88888888-8888-8888-8888-888888888888', NULL);
