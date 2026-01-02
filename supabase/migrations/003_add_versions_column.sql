-- Add versions column to generations table for version history
ALTER TABLE public.generations
ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.generations.versions IS 'Array of version snapshots for rollback functionality';




