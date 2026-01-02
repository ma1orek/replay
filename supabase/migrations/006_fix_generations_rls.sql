-- Fix RLS policies for generations table
-- Currently only SELECT policies exist, need INSERT, UPDATE, DELETE

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own generations" ON public.generations;
DROP POLICY IF EXISTS "Users can view public generations" ON public.generations;

-- Create full CRUD policies for generations
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON public.generations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to do everything (for admin API)
-- This is automatic when using service_role key, but let's be explicit



