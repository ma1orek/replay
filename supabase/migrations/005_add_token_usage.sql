-- Add token_usage column to generations table
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS token_usage JSONB DEFAULT NULL;

-- Add index for faster queries on created_at for admin
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);



