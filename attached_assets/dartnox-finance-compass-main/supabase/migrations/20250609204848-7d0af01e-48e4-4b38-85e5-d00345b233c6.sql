
-- First delete all spending records that reference employees
DELETE FROM public.spending WHERE employee_id IS NOT NULL;

-- Then delete all existing employee data
DELETE FROM public.employees;

-- Drop the unique constraint first
ALTER TABLE public.employees 
DROP CONSTRAINT IF EXISTS employees_worker_id_key;

-- Remove the default value temporarily
ALTER TABLE public.employees 
ALTER COLUMN worker_id DROP DEFAULT;

-- Change the column type to integer
ALTER TABLE public.employees 
ALTER COLUMN worker_id TYPE INTEGER USING CASE 
  WHEN worker_id ~ '^[0-9]+$' THEN worker_id::INTEGER 
  ELSE 1 
END;

-- Create a sequence for worker_id
DROP SEQUENCE IF EXISTS employees_worker_id_seq;
CREATE SEQUENCE employees_worker_id_seq START 1;

-- Set the default value to use the sequence
ALTER TABLE public.employees 
ALTER COLUMN worker_id SET DEFAULT nextval('employees_worker_id_seq');

-- Add the unique constraint back
ALTER TABLE public.employees 
ADD CONSTRAINT employees_worker_id_key UNIQUE (worker_id);
