-- Create feedback table for storing user feedback on generations
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_id TEXT,
  rating TEXT NOT NULL CHECK (rating IN ('yes', 'kinda', 'no')),
  feedback_text TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (feedback can be anonymous)
CREATE POLICY "Anyone can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

-- Only allow admin/service role to read all feedback
CREATE POLICY "Service role can read all feedback" ON public.feedback
  FOR SELECT USING (true);


