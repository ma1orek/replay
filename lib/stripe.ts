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
// PRICING TIERS (January 2026) - CREDIT-BASED
// ═══════════════════════════════════════════════════════════════
// Free: 300 credits (2 generations) - preview + flow only
// Pro: $149/mo = 15,000 credits/month (~100 generations)
// Agency: $499/mo = 60,000 credits/month (~400 generations)
// Enterprise: Custom
//
// CREDIT COSTS:
// - Video generation: ~150 credits
// - AI edit: ~10 credits
// ═══════════════════════════════════════════════════════════════

// Price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  // Subscriptions
  PRO_MONTHLY: "price_1SttxZAxch1s4iBGchJgatG6",
  PRO_YEARLY: "price_1Stty3Axch1s4iBGaQxPAF82",
  AGENCY_MONTHLY: "price_1SttyTAxch1s4iBGhsSdu8pm",
  AGENCY_YEARLY: "price_1SttynAxch1s4iBGshtjRh8R",
  
  // Top-ups (one-time purchases)
  CREDITS_2000: process.env.STRIPE_PRICE_CREDITS_2000 || "price_credits_2000",
  CREDITS_5500: process.env.STRIPE_PRICE_CREDITS_5500 || "price_credits_5500",
  CREDITS_12000: process.env.STRIPE_PRICE_CREDITS_12000 || "price_credits_12000",
};

// Credits per plan (monthly)
export const PLAN_CREDITS: Record<string, number> = {
  free: 300,      // Free tier - 2 generations
  pro: 15000,     // ~100 generations
  agency: 60000,  // ~400 generations
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
    price: 14900, // $149
    yearlyPrice: 11900, // $119 (yearly discount)
    credits: 15000,
    teamSeats: 1,
    features: [
      "15,000 credits/month (~100 generations)",
      "Unlimited projects",
      "React/Tailwind export",
      "Flow Map & Library",
      "AI editing",
    ],
  },
  agency: {
    name: "Agency",
    price: 49900, // $499
    yearlyPrice: 39900, // $399 (yearly discount)
    credits: 60000,
    teamSeats: 5,
    features: [
      "60,000 credits/month (~400 generations)",
      "Unlimited projects",
      "5 team seats",
      "Shared Design System",
      "Priority GPU",
      "API access",
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
export function getPlanFromPriceId(priceId: string): PlanTier {
  if (priceId === STRIPE_PRICES.PRO_MONTHLY || priceId === STRIPE_PRICES.PRO_YEARLY) return "pro";
  if (priceId === STRIPE_PRICES.AGENCY_MONTHLY || priceId === STRIPE_PRICES.AGENCY_YEARLY) return "agency";
  return "free";
}

// Get config for a plan
export function getPlanConfig(plan: PlanTier): PlanConfig {
  return PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
}
