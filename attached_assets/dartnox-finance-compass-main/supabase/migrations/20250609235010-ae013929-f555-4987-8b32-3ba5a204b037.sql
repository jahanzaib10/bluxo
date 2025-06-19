
-- Hard delete all spending records that reference employees
DELETE FROM public.spending WHERE employee_id IS NOT NULL;

-- Hard delete all existing employee data
DELETE FROM public.employees;

-- Reset the sequence to start from 1 again
ALTER SEQUENCE employees_worker_id_seq RESTART WITH 1;
