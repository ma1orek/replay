-- =============================================
-- ENHANCED GENERATIONS FOR HISTORY FEATURE
-- =============================================

-- Add new columns to generations table
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS auto_title BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS output_flow_nodes JSONB,
ADD COLUMN IF NOT EXISTS output_flow_edges JSONB,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Create index for active generations
CREATE INDEX IF NOT EXISTS idx_generations_active ON public.generations(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_generations_created_desc ON public.generations(user_id, created_at DESC);

-- Function to generate title from context/style
CREATE OR REPLACE FUNCTION public.generate_generation_title(
  p_context TEXT,
  p_style TEXT,
  p_video_url TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_title TEXT;
BEGIN
  -- Try to extract meaningful title from context first
  IF p_context IS NOT NULL AND LENGTH(p_context) > 3 THEN
    -- Take first 40 chars, cut at word boundary
    v_title := SUBSTRING(p_context FROM 1 FOR 40);
    IF LENGTH(p_context) > 40 THEN
      v_title := REVERSE(SUBSTRING(REVERSE(v_title) FROM POSITION(' ' IN REVERSE(v_title))));
    END IF;
    RETURN v_title;
  END IF;
  
  -- Fall back to style directive
  IF p_style IS NOT NULL AND LENGTH(p_style) > 3 THEN
    v_title := SUBSTRING(p_style FROM 1 FOR 30);
    RETURN v_title || ' Design';
  END IF;
  
  -- Default fallback
  RETURN 'Generation ' || TO_CHAR(NOW(), 'Mon DD HH24:MI');
END;
$$ LANGUAGE plpgsql;

-- Function to create a new generation
CREATE OR REPLACE FUNCTION public.create_generation(
  p_user_id UUID,
  p_video_url TEXT,
  p_context TEXT,
  p_style TEXT,
  p_trim_start FLOAT,
  p_trim_end FLOAT
)
RETURNS UUID AS $$
DECLARE
  v_gen_id UUID;
  v_title TEXT;
BEGIN
  -- Generate title
  v_title := public.generate_generation_title(p_context, p_style, p_video_url);
  
  -- Deactivate current active generation
  UPDATE public.generations
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Create new generation
  INSERT INTO public.generations (
    user_id,
    title,
    auto_title,
    status,
    input_video_url,
    input_context,
    input_style,
    input_trim_start,
    input_trim_end,
    is_active,
    created_at
  ) VALUES (
    p_user_id,
    v_title,
    true,
    'running',
    p_video_url,
    p_context,
    p_style,
    p_trim_start,
    p_trim_end,
    true,
    NOW()
  ) RETURNING id INTO v_gen_id;
  
  RETURN v_gen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a generation
CREATE OR REPLACE FUNCTION public.complete_generation(
  p_generation_id UUID,
  p_code TEXT,
  p_design_system JSONB,
  p_flow_nodes JSONB,
  p_flow_edges JSONB,
  p_cost INT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.generations
  SET 
    status = 'complete',
    output_code = p_code,
    output_design_system = p_design_system,
    output_flow_nodes = p_flow_nodes,
    output_flow_edges = p_flow_edges,
    cost_credits = p_cost,
    completed_at = NOW()
  WHERE id = p_generation_id;
  
  RETURN jsonb_build_object('success', true, 'id', p_generation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get generation history
CREATE OR REPLACE FUNCTION public.get_generation_history(p_user_id UUID, p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  title TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN,
  thumbnail_url TEXT,
  input_style TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.title,
    g.status,
    g.created_at,
    g.completed_at,
    g.is_active,
    g.thumbnail_url,
    g.input_style
  FROM public.generations g
  WHERE g.user_id = p_user_id
  ORDER BY g.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow users to create generations
CREATE POLICY "Users can create own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update own generations
CREATE POLICY "Users can update own generations" ON public.generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete own generations
CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING (auth.uid() = user_id);

