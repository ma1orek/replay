-- Rename 'starter' plan to 'maker' 
-- Maker is a one-time purchase plan with 300 credits

-- First, update any existing 'starter' memberships to 'maker'
UPDATE memberships SET plan = 'maker' WHERE plan = 'starter';

-- Drop the old constraint
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_plan_check;

-- Add new constraint with 'maker' instead of 'starter'
ALTER TABLE memberships ADD CONSTRAINT memberships_plan_check 
  CHECK (plan IN ('free', 'maker', 'pro', 'agency', 'enterprise'));

-- Comment for documentation
COMMENT ON CONSTRAINT memberships_plan_check ON memberships IS 
  'Allowed plans: free (default), maker ($9 one-time 300 credits), pro (subscription), agency, enterprise';
