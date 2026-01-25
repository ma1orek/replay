-- Add library_data column to generations table for storing component library per project
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS library_data JSONB;

-- Comment explaining the column
COMMENT ON COLUMN public.generations.library_data IS 'Stores the extracted component library data (components, tokens, docs) for this generation/project';
