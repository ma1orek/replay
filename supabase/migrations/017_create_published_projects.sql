-- Create published_projects table for public project pages
-- This table stores published versions of projects that are publicly accessible

CREATE TABLE IF NOT EXISTS public.published_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  thumbnail_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_published_projects_slug ON public.published_projects(slug);
CREATE INDEX IF NOT EXISTS idx_published_projects_user_id ON public.published_projects(user_id);

-- Enable RLS
ALTER TABLE public.published_projects ENABLE ROW LEVEL SECURITY;

-- Anyone can view published projects (they're public)
CREATE POLICY "Anyone can view published projects" ON public.published_projects
  FOR SELECT USING (true);

-- Authenticated users can insert their own projects
CREATE POLICY "Users can insert own published projects" ON public.published_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own projects
CREATE POLICY "Users can update own published projects" ON public.published_projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own published projects" ON public.published_projects
  FOR DELETE USING (auth.uid() = user_id);
