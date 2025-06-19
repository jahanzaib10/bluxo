
-- First, let's clear any existing data to avoid conflicts
DELETE FROM categories;

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
('11111111-1111-1111-1111-111111111112', 'Bank Fees', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('11111111-1111-1111-1111-111111111113', 'Legal & Compliance', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('11111111-1111-1111-1111-111111111114', 'Insurance', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('11111111-1111-1111-1111-111111111115', 'Taxes', 'expense', '11111111-1111-1111-1111-111111111111', NULL),
('11111111-1111-1111-1111-111111111116', 'Travel & Transportation', 'expense', '11111111-1111-1111-1111-111111111111', NULL);

-- Insert child categories under Employee Expenses
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('22222222-2222-2222-2222-222222222223', 'Salaries', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('22222222-2222-2222-2222-222222222224', 'Bonuses', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('22222222-2222-2222-2222-222222222225', 'Benefits & Health Insurance', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('22222222-2222-2222-2222-222222222226', 'Training & Development', 'expense', '22222222-2222-2222-2222-222222222222', NULL),
('22222222-2222-2222-2222-222222222227', 'Recruitment', 'expense', '22222222-2222-2222-2222-222222222222', NULL);

-- Insert child categories under Technology & Software
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('33333333-3333-3333-3333-333333333334', 'Software Subscriptions', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('33333333-3333-3333-3333-333333333335', 'Hardware & Equipment', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('33333333-3333-3333-3333-333333333336', 'Cloud Services', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('33333333-3333-3333-3333-333333333337', 'Development Tools', 'expense', '33333333-3333-3333-3333-333333333333', NULL),
('33333333-3333-3333-3333-333333333338', 'IT Support & Maintenance', 'expense', '33333333-3333-3333-3333-333333333333', NULL);

-- Insert child categories under Marketing & Sales
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('44444444-4444-4444-4444-444444444445', 'Advertising', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('44444444-4444-4444-4444-444444444446', 'Content Creation', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('44444444-4444-4444-4444-444444444447', 'Events & Conferences', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('44444444-4444-4444-4444-444444444448', 'Sales Tools', 'expense', '44444444-4444-4444-4444-444444444444', NULL),
('44444444-4444-4444-4444-444444444449', 'Public Relations', 'expense', '44444444-4444-4444-4444-444444444444', NULL);

-- Insert child categories under Professional Services
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('55555555-5555-5555-5555-555555555556', 'Accounting & Bookkeeping', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('55555555-5555-5555-5555-555555555557', 'Legal Services', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('55555555-5555-5555-5555-555555555558', 'Consulting', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('55555555-5555-5555-5555-555555555559', 'Freelancers & Contractors', 'expense', '55555555-5555-5555-5555-555555555555', NULL),
('55555555-5555-5555-5555-55555555555a', 'Business Services', 'expense', '55555555-5555-5555-5555-555555555555', NULL);

-- Insert child categories under Office & Equipment
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('66666666-6666-6666-6666-666666666667', 'Office Rent', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('66666666-6666-6666-6666-666666666668', 'Office Supplies', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('66666666-6666-6666-6666-666666666669', 'Utilities', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('66666666-6666-6666-6666-66666666666a', 'Furniture', 'expense', '66666666-6666-6666-6666-666666666666', NULL),
('66666666-6666-6666-6666-66666666666b', 'Maintenance & Repairs', 'expense', '66666666-6666-6666-6666-666666666666', NULL);

-- Insert child categories under Client Revenue
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('77777777-7777-7777-7777-777777777778', 'Development Services', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('77777777-7777-7777-7777-777777777779', 'Consulting Services', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('77777777-7777-7777-7777-77777777777a', 'Maintenance & Support', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('77777777-7777-7777-7777-77777777777b', 'Project Management', 'income', '77777777-7777-7777-7777-777777777777', NULL),
('77777777-7777-7777-7777-77777777777c', 'Training Services', 'income', '77777777-7777-7777-7777-777777777777', NULL);

-- Insert child categories under Other Income
INSERT INTO categories (id, name, type, parent_id, created_by) VALUES
('88888888-8888-8888-8888-888888888889', 'Investment Returns', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('88888888-8888-8888-8888-88888888888a', 'Interest Income', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('88888888-8888-8888-8888-88888888888b', 'Grants & Subsidies', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('88888888-8888-8888-8888-88888888888c', 'Refunds', 'income', '88888888-8888-8888-8888-888888888888', NULL),
('88888888-8888-8888-8888-88888888888d', 'Miscellaneous Income', 'income', '88888888-8888-8888-8888-888888888888', NULL);
