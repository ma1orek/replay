-- =============================================
-- REPLAY DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEMBERSHIPS TABLE (Plans & Subscriptions)
-- =============================================
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- CREDIT WALLETS TABLE
-- =============================================
CREATE TABLE public.credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_credits INT NOT NULL DEFAULT 0,
  rollover_credits INT NOT NULL DEFAULT 0,
  topup_credits INT NOT NULL DEFAULT 0,
  rollover_expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREDIT LEDGER TABLE (Audit Trail)
-- =============================================
CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  bucket TEXT NOT NULL CHECK (bucket IN ('monthly', 'rollover', 'topup')),
  amount INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'video_generate', 
    'ai_edit', 
    'monthly_refill', 
    'rollover_grant', 
    'topup_purchase', 
    'admin_adjust',
    'signup_bonus'
  )),
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GENERATIONS TABLE
-- =============================================
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'complete', 'failed')),
  cost_credits INT NOT NULL DEFAULT 0,
  input_video_url TEXT,
  input_context TEXT,
  input_style TEXT,
  input_trim_start FLOAT,
  input_trim_end FLOAT,
  output_code TEXT,
  output_design_system JSONB,
  output_architecture JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_stripe_customer ON public.memberships(stripe_customer_id);
CREATE INDEX idx_credit_ledger_user_id ON public.credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_created_at ON public.credit_ledger(created_at DESC);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_project_id ON public.generations(project_id);
CREATE INDEX idx_generations_status ON public.generations(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- MEMBERSHIPS policies
CREATE POLICY "Users can view own membership" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

-- CREDIT_WALLETS policies
CREATE POLICY "Users can view own wallet" ON public.credit_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- CREDIT_LEDGER policies
CREATE POLICY "Users can view own ledger" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- PROJECTS policies
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public projects" ON public.projects
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- GENERATIONS policies
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public generations" ON public.generations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = generations.project_id 
      AND projects.is_public = true
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create free membership
  INSERT INTO public.memberships (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  -- Create credit wallet with free tier credits
  INSERT INTO public.credit_wallets (user_id, monthly_credits, rollover_credits, topup_credits)
  VALUES (NEW.id, 100, 0, 0);
  
  -- Add ledger entry for signup bonus
  INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
  VALUES (NEW.id, 'credit', 'monthly', 100, 'signup_bonus', 'initial_grant');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get total credits
CREATE OR REPLACE FUNCTION public.get_total_credits(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  total INT;
BEGIN
  SELECT COALESCE(monthly_credits, 0) + COALESCE(rollover_credits, 0) + COALESCE(topup_credits, 0)
  INTO total
  FROM public.credit_wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits atomically
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id UUID,
  p_cost INT,
  p_reason TEXT,
  p_reference_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_remaining INT;
  v_from_monthly INT := 0;
  v_from_rollover INT := 0;
  v_from_topup INT := 0;
BEGIN
  -- Lock the wallet row for update
  SELECT * INTO v_wallet
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Calculate total available
  v_remaining := v_wallet.monthly_credits + v_wallet.rollover_credits + v_wallet.topup_credits;
  
  IF v_remaining < p_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'available', v_remaining, 'required', p_cost);
  END IF;
  
  -- Deduct in order: monthly -> rollover -> topup
  v_remaining := p_cost;
  
  -- From monthly
  IF v_remaining > 0 AND v_wallet.monthly_credits > 0 THEN
    v_from_monthly := LEAST(v_wallet.monthly_credits, v_remaining);
    v_remaining := v_remaining - v_from_monthly;
  END IF;
  
  -- From rollover
  IF v_remaining > 0 AND v_wallet.rollover_credits > 0 THEN
    v_from_rollover := LEAST(v_wallet.rollover_credits, v_remaining);
    v_remaining := v_remaining - v_from_rollover;
  END IF;
  
  -- From topup
  IF v_remaining > 0 AND v_wallet.topup_credits > 0 THEN
    v_from_topup := LEAST(v_wallet.topup_credits, v_remaining);
    v_remaining := v_remaining - v_from_topup;
  END IF;
  
  -- Update wallet
  UPDATE public.credit_wallets
  SET 
    monthly_credits = monthly_credits - v_from_monthly,
    rollover_credits = rollover_credits - v_from_rollover,
    topup_credits = topup_credits - v_from_topup,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Insert ledger entries
  IF v_from_monthly > 0 THEN
    INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
    VALUES (p_user_id, 'debit', 'monthly', v_from_monthly, p_reason, p_reference_id);
  END IF;
  
  IF v_from_rollover > 0 THEN
    INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
    VALUES (p_user_id, 'debit', 'rollover', v_from_rollover, p_reason, p_reference_id);
  END IF;
  
  IF v_from_topup > 0 THEN
    INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
    VALUES (p_user_id, 'debit', 'topup', v_from_topup, p_reason, p_reference_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'spent', jsonb_build_object(
      'monthly', v_from_monthly,
      'rollover', v_from_rollover,
      'topup', v_from_topup,
      'total', p_cost
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INT,
  p_bucket TEXT,
  p_reason TEXT,
  p_reference_id TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- Update wallet
  IF p_bucket = 'monthly' THEN
    UPDATE public.credit_wallets
    SET monthly_credits = monthly_credits + p_amount, updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_bucket = 'rollover' THEN
    UPDATE public.credit_wallets
    SET rollover_credits = rollover_credits + p_amount, updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_bucket = 'topup' THEN
    UPDATE public.credit_wallets
    SET topup_credits = topup_credits + p_amount, updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid bucket');
  END IF;
  
  -- Insert ledger entry
  INSERT INTO public.credit_ledger (user_id, type, bucket, amount, reason, reference_id)
  VALUES (p_user_id, 'credit', p_bucket, p_amount, p_reason, p_reference_id);
  
  RETURN jsonb_build_object('success', true, 'added', p_amount, 'bucket', p_bucket);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


