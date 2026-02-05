-- =============================================
-- DESIGN SYSTEMS ARCHITECTURE
-- Migration: 018_create_design_systems.sql
-- =============================================

-- =============================================
-- 1. DESIGN SYSTEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.design_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Design System',
  
  -- Source information (where this DS came from)
  source_type TEXT CHECK (source_type IN ('video', 'storybook', 'manual', 'figma')),
  source_url TEXT,
  
  -- Design tokens (colors, typography, spacing, etc.)
  tokens JSONB DEFAULT '{}',
  
  -- Flags
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for design_systems
CREATE INDEX IF NOT EXISTS idx_design_systems_user_id ON public.design_systems(user_id);
CREATE INDEX IF NOT EXISTS idx_design_systems_default ON public.design_systems(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_design_systems_public ON public.design_systems(is_public) WHERE is_public = true;

-- =============================================
-- 2. DESIGN SYSTEM COMPONENTS TABLE
-- NOTE: source_generation_id is TEXT because generations.id is TEXT
-- =============================================
CREATE TABLE IF NOT EXISTS public.design_system_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_system_id UUID NOT NULL REFERENCES public.design_systems(id) ON DELETE CASCADE,
  
  -- Component identity
  name TEXT NOT NULL,
  layer TEXT CHECK (layer IN ('foundations', 'primitives', 'elements', 'components', 'patterns', 'product')),
  category TEXT,
  
  -- Component code and metadata
  code TEXT NOT NULL,
  variants JSONB DEFAULT '[]',
  props JSONB DEFAULT '[]',
  docs JSONB DEFAULT '{}',
  
  -- Provenance (where this component came from)
  -- Using TEXT type because generations.id is TEXT (not UUID)
  source_generation_id TEXT,
  
  -- Status
  is_approved BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique component names per design system
  UNIQUE(design_system_id, name)
);

-- Indexes for design_system_components
CREATE INDEX IF NOT EXISTS idx_ds_components_ds_id ON public.design_system_components(design_system_id);
CREATE INDEX IF NOT EXISTS idx_ds_components_layer ON public.design_system_components(layer);
CREATE INDEX IF NOT EXISTS idx_ds_components_source ON public.design_system_components(source_generation_id);

-- =============================================
-- 3. ALTER GENERATIONS TABLE
-- =============================================
-- Add design_system_id to link generations to design systems
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS design_system_id UUID REFERENCES public.design_systems(id) ON DELETE SET NULL;

-- Add local_components for project-specific components (not yet saved to library)
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS local_components JSONB DEFAULT '[]';

-- Index for the new column
CREATE INDEX IF NOT EXISTS idx_generations_ds_id ON public.generations(design_system_id);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on design_systems
ALTER TABLE public.design_systems ENABLE ROW LEVEL SECURITY;

-- Users can view their own design systems
CREATE POLICY "Users can view own design systems" ON public.design_systems
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view public design systems
CREATE POLICY "Users can view public design systems" ON public.design_systems
  FOR SELECT USING (is_public = true);

-- Users can create their own design systems
CREATE POLICY "Users can create own design systems" ON public.design_systems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own design systems
CREATE POLICY "Users can update own design systems" ON public.design_systems
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own design systems
CREATE POLICY "Users can delete own design systems" ON public.design_systems
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on design_system_components
ALTER TABLE public.design_system_components ENABLE ROW LEVEL SECURITY;

-- Users can view components of their own design systems
CREATE POLICY "Users can view components of own DS" ON public.design_system_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.design_systems ds
      WHERE ds.id = design_system_id 
      AND ds.user_id = auth.uid()
    )
  );

-- Users can view components of public design systems
CREATE POLICY "Users can view components of public DS" ON public.design_system_components
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.design_systems ds
      WHERE ds.id = design_system_id 
      AND ds.is_public = true
    )
  );

-- Users can insert components into their own design systems
CREATE POLICY "Users can insert components into own DS" ON public.design_system_components
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_systems ds
      WHERE ds.id = design_system_id 
      AND ds.user_id = auth.uid()
    )
  );

-- Users can update components in their own design systems
CREATE POLICY "Users can update components in own DS" ON public.design_system_components
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.design_systems ds
      WHERE ds.id = design_system_id 
      AND ds.user_id = auth.uid()
    )
  );

-- Users can delete components from their own design systems
CREATE POLICY "Users can delete components from own DS" ON public.design_system_components
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.design_systems ds
      WHERE ds.id = design_system_id 
      AND ds.user_id = auth.uid()
    )
  );

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to ensure only one default design system per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_ds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset any existing default for this user
    UPDATE public.design_systems
    SET is_default = false, updated_at = NOW()
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce single default
DROP TRIGGER IF EXISTS ensure_single_default_ds_trigger ON public.design_systems;
CREATE TRIGGER ensure_single_default_ds_trigger
  BEFORE INSERT OR UPDATE ON public.design_systems
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_ds();

-- Function to increment usage count when a component is used
CREATE OR REPLACE FUNCTION public.increment_component_usage(component_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.design_system_components
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE id = component_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's default design system
CREATE OR REPLACE FUNCTION public.get_default_design_system(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  ds_id UUID;
BEGIN
  SELECT id INTO ds_id
  FROM public.design_systems
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;
  
  RETURN ds_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. UPDATED_AT TRIGGERS
-- =============================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to design_systems
DROP TRIGGER IF EXISTS update_design_systems_updated_at ON public.design_systems;
CREATE TRIGGER update_design_systems_updated_at
  BEFORE UPDATE ON public.design_systems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to design_system_components
DROP TRIGGER IF EXISTS update_ds_components_updated_at ON public.design_system_components;
CREATE TRIGGER update_ds_components_updated_at
  BEFORE UPDATE ON public.design_system_components
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
