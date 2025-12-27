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
  plan: "free" | "pro" | "agency";
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string | null;
  current_period_end: string | null;
}

interface CreditsContextType {
  wallet: CreditWallet | null;
  membership: Membership | null;
  totalCredits: number;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  canAfford: (cost: number) => boolean;
}

// Plan limits
export const PLAN_LIMITS = {
  free: {
    monthlyCredits: 150,
    rolloverCap: 0,
    rolloverExpiry: 0,
  },
  pro: {
    monthlyCredits: 3000,
    rolloverCap: 600,
    rolloverExpiry: 90,
  },
  agency: {
    monthlyCredits: 10000,
    rolloverCap: 2000,
    rolloverExpiry: 90,
  },
};

// Credit costs
export const CREDIT_COSTS = {
  VIDEO_GENERATE: 75,
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
      // Fetch wallet
      const { data: walletData } = await supabase
        .from("credit_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (walletData) {
        setWallet({
          monthly_credits: walletData.monthly_credits,
          rollover_credits: walletData.rollover_credits,
          topup_credits: walletData.topup_credits,
          rollover_expires_at: walletData.rollover_expires_at,
        });
      }

      // Fetch membership
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("plan, status, current_period_start, current_period_end")
        .eq("user_id", user.id)
        .single();

      if (membershipData) {
        setMembership(membershipData as Membership);
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

  return (
    <CreditsContext.Provider
      value={{
        wallet,
        membership,
        totalCredits,
        isLoading,
        refreshCredits: fetchCredits,
        canAfford,
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


