-- Migration: Sandbox tier gets 0 credits (not 100)
-- New users must upgrade to Pro or Agency to get credits

-- Update the handle_new_user function to give 0 credits
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
  
  -- Add ledger entry for sandbox signup (0 credits)
  INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
  VALUES (NEW.id, 'credit', 'monthly', 0, 'sandbox_signup', 'initial_grant');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Existing users who already have 100 credits will keep them.
-- Only NEW users created after this migration will start with 0 credits.
