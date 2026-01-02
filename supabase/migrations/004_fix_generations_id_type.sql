-- Change generations.id from UUID to TEXT to support custom IDs from frontend
-- First drop the primary key constraint
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_pkey;

-- Change the column type
ALTER TABLE public.generations ALTER COLUMN id TYPE TEXT;

-- Add the primary key back
ALTER TABLE public.generations ADD PRIMARY KEY (id);



