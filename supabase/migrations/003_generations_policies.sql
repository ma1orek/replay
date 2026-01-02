-- Add INSERT and UPDATE policies for generations table

-- Allow users to insert their own generations
CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own generations  
CREATE POLICY "Users can update own generations" ON public.generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own generations
CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING (auth.uid() = user_id);




