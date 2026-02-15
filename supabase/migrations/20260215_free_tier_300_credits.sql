-- Migration: Update free tier from 0 credits (sandbox) to 300 credits (2 free generations)
-- This updates the handle_new_user trigger so new signups get 300 credits

-- Add 'free_signup' to ledger reason CHECK constraint (for backward compat)
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
    'sandbox_signup',
    'free_signup'
  ));

-- Update the handle_new_user function: 0 → 300 credits for Free tier
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

  -- Create free membership
  INSERT INTO public.memberships (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  -- Create credit wallet with 300 credits (Free tier - 2 generations)
  INSERT INTO public.credit_wallets (user_id, monthly_credits, rollover_credits, topup_credits)
  VALUES (NEW.id, 300, 0, 0);

  -- Add ledger entry for free signup (300 credits)
  INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
  VALUES (NEW.id, 'credit', 'monthly', 300, 'signup_bonus', 'initial_grant');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix existing free users who have 0 credits (from old sandbox trigger)
UPDATE credit_wallets SET monthly_credits = 300
WHERE user_id IN (
  SELECT user_id FROM memberships WHERE plan = 'free'
)
AND monthly_credits = 0 AND rollover_credits = 0 AND topup_credits = 0;
