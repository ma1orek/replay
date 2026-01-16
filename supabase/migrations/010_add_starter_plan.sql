-- Add 'starter' to allowed membership plans
-- Starter Pack is a one-time purchase plan with 200 credits

-- Drop the old constraint
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_plan_check;

-- Add new constraint with 'starter' included
ALTER TABLE memberships ADD CONSTRAINT memberships_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'enterprise'));

-- Comment for documentation
COMMENT ON CONSTRAINT memberships_plan_check ON memberships IS 
  'Allowed plans: free (default), starter ($9 one-time 200 credits), pro (subscription), agency, enterprise';
