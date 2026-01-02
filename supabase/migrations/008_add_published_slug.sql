-- Add published_slug column to generations table
ALTER TABLE generations ADD COLUMN IF NOT EXISTS published_slug TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_generations_published_slug ON generations(published_slug);

