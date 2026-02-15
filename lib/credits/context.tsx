"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";

export interface CreditWallet {
  monthly_credits: number;
  rollover_credits: number;
  topup_credits: number;
  rollover_expires_at: string | null;
}

export interface Membership {
  plan: "free" | "pro" | "agency" | "enterprise";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
}

interface CreditsContextType {
  wallet: CreditWallet | null;
  membership: Membership | null;
  totalCredits: number;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  canAfford: (cost: number) => boolean;
  isSandbox: boolean; // True if user is on free plan (limited features)
  isPaidPlan: boolean; // True if user has pro/agency/enterprise
}

// Plan limits - Free tier gets 300 credits (2 generations), preview + flow only
export const PLAN_LIMITS: Record<string, { monthlyCredits: number; rolloverCap: number; rolloverExpiry: number }> = {
  free: {
    monthlyCredits: 300, // Free tier - 2 generations, preview + flow only
    rolloverCap: 0,
    rolloverExpiry: 0,
  },
  pro: {
    monthlyCredits: 15000, // ~100 generations
    rolloverCap: 3000,
    rolloverExpiry: 90,
  },
  agency: {
    monthlyCredits: 60000, // ~400 generations
    rolloverCap: 12000,
    rolloverExpiry: 90,
  },
  enterprise: {
    monthlyCredits: 50000,
    rolloverCap: 10000,
    rolloverExpiry: 180,
  },
};

// Credit costs
export const CREDIT_COSTS = {
  VIDEO_GENERATE: 150,
  AI_EDIT: 10,
};

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      // PERF: Fetch wallet + membership in PARALLEL (saves 300-500ms)
      const [walletResult, membershipResult] = await Promise.all([
        supabase
          .from("credit_wallets")
          .select("monthly_credits, rollover_credits, topup_credits, rollover_expires_at")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("memberships")
          .select("plan, status, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id")
          .eq("user_id", user.id)
          .single(),
      ]);

      const { data: walletData, error: walletError } = walletResult;
      const { data: membershipData, error: membershipError } = membershipResult;

      // Process wallet
      if (walletData) {
        setWallet({
          monthly_credits: walletData.monthly_credits,
          rollover_credits: walletData.rollover_credits,
          topup_credits: walletData.topup_credits,
          rollover_expires_at: walletData.rollover_expires_at,
        });
      } else if (walletError && walletError.code === "PGRST116") {
        // No wallet found - initialize it via API (only for brand new users)
        console.log("No wallet found, initializing for user:", user.email);
        try {
          const initRes = await fetch("/api/credits/init", { method: "POST" });
          const initData = await initRes.json();
          if (initData.success && initData.wallet) {
            setWallet({
              monthly_credits: initData.wallet.monthly_credits,
              rollover_credits: initData.wallet.rollover_credits,
              topup_credits: initData.wallet.topup_credits,
              rollover_expires_at: initData.wallet.rollover_expires_at,
            });
            console.log("Wallet initialized with", initData.totalCredits, "credits");
          }
        } catch (initError) {
          console.error("Failed to initialize wallet:", initError);
        }
      }

      // Process membership
      if (membershipData) {
        setMembership(membershipData as Membership);
      } else if (membershipError && membershipError.code === "PGRST116") {
        setMembership({
          plan: "free",
          status: "active",
          current_period_start: null,
          current_period_end: null,
        });
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const totalCredits = wallet
    ? wallet.monthly_credits + wallet.rollover_credits + wallet.topup_credits
    : 0;

  const canAfford = useCallback(
    (cost: number) => totalCredits >= cost,
    [totalCredits]
  );

  // Check if user is on free plan (limited features - preview + flow only)
  const isSandbox = membership?.plan === "free" || !membership;
  
  // Check if user has a paid plan
  const isPaidPlan = membership?.plan === "pro" || membership?.plan === "agency" || membership?.plan === "enterprise";

  return (
    <CreditsContext.Provider
      value={{
        wallet,
        membership,
        totalCredits,
        isLoading,
        refreshCredits: fetchCredits,
        canAfford,
        isSandbox,
        isPaidPlan,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}


