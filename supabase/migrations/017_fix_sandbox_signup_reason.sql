-- Migration: Fix sandbox signup - use 'signup_bonus' reason (which exists in CHECK constraint)
-- The previous migration used 'sandbox_signup' which is not in the allowed values

-- First, add 'sandbox_signup' to the CHECK constraint
ALTER TABLE public.credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_reason_check;
ALTER TABLE public.credit_ledger ADD CONSTRAINT credit_ledger_reason_check 
  CHECK (reason IN (
    'video_generate', 
    'ai_edit', 
    'monthly_refill', 
    'rollover_grant', 
    'topup_purchase', 
    'admin_adjust',
    'signup_bonus',
    'sandbox_signup'
  ));

-- Recreate the handle_new_user function with correct reason
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create free membership (Sandbox tier)
  INSERT INTO public.memberships (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- Create credit wallet with 0 credits (Sandbox tier - must upgrade for credits)
  INSERT INTO public.credit_wallets (user_id, monthly_credits, rollover_credits, topup_credits)
  VALUES (NEW.id, 0, 0, 0);
  
  -- Add ledger entry for sandbox signup (0 credits) - now using allowed value
  INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
  VALUES (NEW.id, 'credit', 'monthly', 0, 'sandbox_signup', 'initial_grant');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
