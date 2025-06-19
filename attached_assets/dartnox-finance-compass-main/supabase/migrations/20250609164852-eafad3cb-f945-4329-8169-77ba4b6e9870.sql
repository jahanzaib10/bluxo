
-- Add missing columns to the subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS category_id uuid,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'Company' CHECK (type IN ('Personal', 'Company')),
ADD COLUMN IF NOT EXISTS recurring_end_date date;

-- Add foreign key constraint for category_id
ALTER TABLE public.subscriptions 
ADD CONSTRAINT fk_subscriptions_category 
FOREIGN KEY (category_id) REFERENCES public.categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_category_id ON public.subscriptions(category_id);
