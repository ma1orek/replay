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

// Price IDs from environment - using the correct env var names
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRO_PRICE_ID_MONTHLY!,
  PRO_YEARLY: process.env.STRIPE_PRO_PRICE_ID_YEARLY!,
  CREDITS_2000: process.env.STRIPE_CREDITS_PRICE_ID_2000!,
  CREDITS_5500: process.env.STRIPE_CREDITS_PRICE_ID_5500!,
  CREDITS_12000: process.env.STRIPE_CREDITS_PRICE_ID_12000!,
};

// Top-up credit amounts - mapped to the correct env vars
export const TOPUP_CREDITS: Record<string, number> = {};
if (process.env.STRIPE_CREDITS_PRICE_ID_2000) {
  TOPUP_CREDITS[process.env.STRIPE_CREDITS_PRICE_ID_2000] = 2000;
}
if (process.env.STRIPE_CREDITS_PRICE_ID_5500) {
  TOPUP_CREDITS[process.env.STRIPE_CREDITS_PRICE_ID_5500] = 5500;
}
if (process.env.STRIPE_CREDITS_PRICE_ID_12000) {
  TOPUP_CREDITS[process.env.STRIPE_CREDITS_PRICE_ID_12000] = 12000;
}

// Plan monthly credits
export const PLAN_CREDITS: Record<string, number> = {
  free: 150,
  pro: 3000,
  enterprise: 50000,
};
