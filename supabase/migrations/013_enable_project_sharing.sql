-- Enable project sharing via link for multiplayer collaboration
-- Anyone with the link can READ the project, but only owner can WRITE

-- Add a policy for public read access (link sharing)
-- This allows anyone (even anonymous) to view a project by ID
CREATE POLICY "Anyone can view projects by direct link" ON public.generations
  FOR SELECT USING (true);

-- Note: The existing policies for INSERT, UPDATE, DELETE still require auth.uid() = user_id
-- So only the owner can modify the project, but anyone can view it
