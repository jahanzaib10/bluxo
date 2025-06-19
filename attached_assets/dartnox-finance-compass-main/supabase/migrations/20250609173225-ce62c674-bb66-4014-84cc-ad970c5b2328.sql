
-- Make payment_receiver_id nullable in subscriptions table
ALTER TABLE public.subscriptions 
ALTER COLUMN payment_receiver_id DROP NOT NULL;
