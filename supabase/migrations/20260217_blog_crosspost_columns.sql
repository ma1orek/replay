-- Add crosspost tracking columns to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS devto_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hashnode_url TEXT;
