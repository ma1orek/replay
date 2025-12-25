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

// Price IDs from environment
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_PRICE_ID_MONTHLY!,
  PRO_YEARLY: process.env.STRIPE_PRO_PRICE_ID_YEARLY!,
  AGENCY_MONTHLY: process.env.STRIPE_AGENCY_PRICE_ID_MONTHLY!,
  AGENCY_YEARLY: process.env.STRIPE_AGENCY_PRICE_ID_YEARLY!,
  TOPUP_20: process.env.STRIPE_TOPUP_20_PRICE_ID!,
  TOPUP_50: process.env.STRIPE_TOPUP_50_PRICE_ID!,
  TOPUP_100: process.env.STRIPE_TOPUP_100_PRICE_ID!,
};

// Top-up credit amounts
export const TOPUP_CREDITS = {
  [process.env.STRIPE_TOPUP_20_PRICE_ID!]: 2000,
  [process.env.STRIPE_TOPUP_50_PRICE_ID!]: 5500,
  [process.env.STRIPE_TOPUP_100_PRICE_ID!]: 12000,
};

// Plan monthly credits
export const PLAN_CREDITS = {
  free: 150,
  pro: 3000,
  agency: 10000,
};

