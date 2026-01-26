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
// NEW PRICING TIERS (January 2026)
// ═══════════════════════════════════════════════════════════════
// Sandbox: $0 (demo only)
// Pro: $149/mo (1 active project, unlimited iterations)
// Agency: $499/mo (10 active projects, 5 team seats)
// Enterprise: Custom (contact sales)
// ═══════════════════════════════════════════════════════════════

// Price IDs from Stripe Dashboard (January 2026)
export const STRIPE_PRICES = {
  // Pro plan ($149/mo or $119/mo yearly)
  PRO_MONTHLY: "price_1SttxZAxch1s4iBGchJgatG6",
  PRO_YEARLY: "price_1Stty3Axch1s4iBGaQxPAF82",
  
  // Agency plan ($499/mo or $399/mo yearly)
  AGENCY_MONTHLY: "price_1SttyTAxch1s4iBGhsSdu8pm",
  AGENCY_YEARLY: "price_1SttynAxch1s4iBGshtjRh8R",
};

// Plan limits configuration
export type PlanTier = "sandbox" | "free" | "pro" | "agency" | "enterprise";

export interface PlanConfig {
  name: string;
  price: number; // in cents
  activeProjects: number;
  teamSeats: number;
  canUpload: boolean;
  canExport: boolean;
  priorityGpu: boolean;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  sandbox: {
    name: "Sandbox",
    price: 0,
    activeProjects: 0,
    teamSeats: 1,
    canUpload: false,
    canExport: false,
    priorityGpu: false,
  },
  free: {
    name: "Free",
    price: 0,
    activeProjects: 0,
    teamSeats: 1,
    canUpload: false,
    canExport: false,
    priorityGpu: false,
  },
  pro: {
    name: "Pro",
    price: 14900, // $149
    activeProjects: 1,
    teamSeats: 1,
    canUpload: true,
    canExport: true,
    priorityGpu: false,
  },
  agency: {
    name: "Agency",
    price: 49900, // $499
    activeProjects: 10,
    teamSeats: 5,
    canUpload: true,
    canExport: true,
    priorityGpu: true,
  },
  enterprise: {
    name: "Enterprise",
    price: 0, // Custom pricing
    activeProjects: 999999,
    teamSeats: 999999,
    canUpload: true,
    canExport: true,
    priorityGpu: true,
  },
};

// Map Stripe Price ID to plan tier
export function getPlanFromPriceId(priceId: string): PlanTier {
  if (priceId === STRIPE_PRICES.PRO_MONTHLY) return "pro";
  if (priceId === STRIPE_PRICES.PRO_YEARLY) return "pro";
  if (priceId === STRIPE_PRICES.AGENCY_MONTHLY) return "agency";
  if (priceId === STRIPE_PRICES.AGENCY_YEARLY) return "agency";
  return "free";
}

// Get config for a plan
export function getPlanConfig(plan: PlanTier): PlanConfig {
  return PLAN_CONFIGS[plan] || PLAN_CONFIGS.free;
}
