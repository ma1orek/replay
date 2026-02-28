import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when env vars aren't set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

// ═══════════════════════════════════════════════════════════════
// PRICING TIERS (February 2026) - CREDIT-BASED
// ═══════════════════════════════════════════════════════════════
// Free: 300 credits - preview + flow only
// Pro: $19/mo = 1,500 credits/month
// Agency: $99/mo = 15,000 credits/month, 5 team members
// Enterprise: Custom
//
// CREDIT COSTS:
// - Video generation: ~150 credits
// - AI edit: ~10 credits
// ═══════════════════════════════════════════════════════════════

// Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  // Subscriptions
  PRO_MONTHLY: "price_1T5tG4Axch1s4iBG8U87YxF7",
  PRO_YEARLY: "price_1Stty3Axch1s4iBGaQxPAF82",
  AGENCY_MONTHLY: "price_1T5tGeAxch1s4iBG8pTzl3EZ",
  AGENCY_YEARLY: "price_1SttynAxch1s4iBGshtjRh8R",
  
  // Top-ups (one-time purchases)
  CREDITS_2000: process.env.STRIPE_PRICE_CREDITS_2000 || "price_credits_2000",
  CREDITS_5500: process.env.STRIPE_PRICE_CREDITS_5500 || "price_credits_5500",
  CREDITS_12000: process.env.STRIPE_PRICE_CREDITS_12000 || "price_credits_12000",
};

// Credits per plan (monthly)
export const PLAN_CREDITS: Record<string, number> = {
  free: 300,      // Free tier
  pro: 1500,      // $19/mo
  agency: 15000,  // $99/mo
  enterprise: 999999,
};

// Top-up credits by price ID
export const TOPUP_CREDITS: Record<string, number> = {
  [STRIPE_PRICES.CREDITS_2000]: 2000,
  [STRIPE_PRICES.CREDITS_5500]: 5500,
  [STRIPE_PRICES.CREDITS_12000]: 12000,
};

// Plan configuration
export type PlanTier = "free" | "pro" | "agency" | "enterprise";

export interface PlanConfig {
  name: string;
  price: number; // in cents/month
  yearlyPrice: number; // in cents/month (with discount)
  credits: number;
  teamSeats: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    credits: 300,
    teamSeats: 1,
    features: [
      "300 credits (2 generations)",
      "Preview & Flow Map",
      "30s max video",
      "Upgrade for Code, Editor, Library",
    ],
  },
  pro: {
    name: "Pro",
    price: 1900, // $19
    yearlyPrice: 1500, // $15 (yearly discount)
    credits: 1500,
    teamSeats: 1,
    features: [
      "1,500 credits/month",
      "Unlimited projects",
      "React + Tailwind export",
      "Flow Map & Design System",
      "AI visual editing",
    ],
  },
  agency: {
    name: "Agency",
    price: 9900, // $99
    yearlyPrice: 7900, // $79 (yearly discount)
    credits: 15000,
    teamSeats: 5,
    features: [
      "15,000 credits/month",
      "5 team members",
      "Shared Design System",
      "Priority GPU processing",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 0, // Custom
    yearlyPrice: 0,
    credits: 999999,
    teamSeats: 999999,
    features: [
      "Custom credits",
      "Unlimited projects",
      "Unlimited team seats",
      "On-premise / Private Cloud",
      "SSO & Security audit",
      "Dedicated support",
      "SLA",
    ],
  },
};

// Map Stripe Price ID to plan tier
// Legacy Stripe price IDs (existing subscribers still on old prices)
const LEGACY_PRO_MONTHLY = "price_1SttxZAxch1s4iBGchJgatG6";
const LEGACY_AGENCY_MONTHLY = "price_1SttyTAxch1s4iBGhsSdu8pm";

export function getPlanFromPriceId(priceId: string): PlanTier {
  if (priceId === STRIPE_PRICES.PRO_MONTHLY || priceId === STRIPE_PRICES.PRO_YEARLY || priceId === LEGACY_PRO_MONTHLY) return "pro";
  if (priceId === STRIPE_PRICES.AGENCY_MONTHLY || priceId === STRIPE_PRICES.AGENCY_YEARLY || priceId === LEGACY_AGENCY_MONTHLY) return "agency";
  return "free";
}

// Get config for a plan
export function getPlanConfig(plan: PlanTier): PlanConfig {
  return PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
}
