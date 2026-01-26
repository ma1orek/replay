-- =============================================
-- NEW PRICING TIERS & PROJECT LIMITS
-- =============================================
-- Tiers: sandbox (demo only), pro ($149/mo), agency ($499/mo), enterprise (custom)

-- STEP 1: First update any legacy plan values to 'free' before changing constraint
-- This handles: 'maker', 'starter', 'basic', or any other old plan names
UPDATE memberships 
SET plan = 'free' 
WHERE plan NOT IN ('free', 'pro', 'agency', 'enterprise');

-- STEP 2: Now safe to update the constraint
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_plan_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_plan_check 
  CHECK (plan IN ('free', 'pro', 'agency', 'enterprise'));

-- Add is_archived to projects for "active project slots" feature
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on active projects
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(user_id, is_archived);

-- =============================================
-- PLAN LIMITS CONFIGURATION
-- =============================================
-- Instead of storing limits in DB, we define them in code for flexibility
-- This comment documents the limits:
--
-- sandbox: 0 active projects (demo only, no upload)
-- pro: 1 active project, 1 team seat
-- agency: 10 active projects, 5 team seats
-- enterprise: unlimited (custom)

-- =============================================
-- FUNCTION: Get active project count for user
-- =============================================
CREATE OR REPLACE FUNCTION public.get_active_project_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  count INT;
BEGIN
  SELECT COUNT(*)::INT INTO count
  FROM public.projects
  WHERE user_id = p_user_id 
    AND is_archived = false;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Check if user can create new project
-- =============================================
CREATE OR REPLACE FUNCTION public.can_create_project(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_plan TEXT;
  v_active_count INT;
  v_limit INT;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan
  FROM public.memberships
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'No membership found');
  END IF;
  
  -- Get active project count
  v_active_count := public.get_active_project_count(p_user_id);
  
  -- Determine limit based on plan
  CASE v_plan
    WHEN 'sandbox', 'free' THEN v_limit := 0;
    WHEN 'pro' THEN v_limit := 1;
    WHEN 'agency' THEN v_limit := 10;
    WHEN 'enterprise' THEN v_limit := 999999; -- effectively unlimited
    ELSE v_limit := 0;
  END CASE;
  
  IF v_active_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'Project limit reached',
      'current', v_active_count,
      'limit', v_limit,
      'plan', v_plan
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_active_count,
    'limit', v_limit,
    'plan', v_plan
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Archive a project
-- =============================================
CREATE OR REPLACE FUNCTION public.archive_project(p_project_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.projects
  SET is_archived = true, updated_at = NOW()
  WHERE id = p_project_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Unarchive a project (if slot available)
-- =============================================
CREATE OR REPLACE FUNCTION public.unarchive_project(p_project_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_can_create JSONB;
BEGIN
  -- Check if user has available slot
  v_can_create := public.can_create_project(p_user_id);
  
  IF NOT (v_can_create->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'No available project slots',
      'details', v_can_create
    );
  END IF;
  
  UPDATE public.projects
  SET is_archived = false, updated_at = NOW()
  WHERE id = p_project_id AND user_id = p_user_id AND is_archived = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found or not archived');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE projects IS 'User projects. is_archived controls active project slots - archived projects don''t count towards limit.';
