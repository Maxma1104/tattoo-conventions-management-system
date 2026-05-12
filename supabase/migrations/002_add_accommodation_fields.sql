ALTER TABLE public.accommodations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE public.accommodations ADD COLUMN IF NOT EXISTS access_code VARCHAR(50);
ALTER TABLE public.accommodations ADD COLUMN IF NOT EXISTS notes TEXT;
