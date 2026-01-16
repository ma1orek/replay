import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Map top-up amounts to price IDs and credit amounts
const TOPUP_MAP: Record<number, { priceId: string; credits: number }> = {
  20: { priceId: process.env.STRIPE_CREDITS_PRICE_ID_2000 || "", credits: 900 },
  50: { priceId: process.env.STRIPE_CREDITS_PRICE_ID_5500 || "", credits: 2400 },
  100: { priceId: process.env.STRIPE_CREDITS_PRICE_ID_12000 || "", credits: 5250 },
};

// Starter Pack - $9 one-time for 300 credits
const STARTER_PACK_PRICE_ID = process.env.STRIPE_STARTER_PACK_PRICE_ID || "price_1Spo05Axch1s4iBGydOPAd2i";
const STARTER_PACK_CREDITS = 300;

// Valid Stripe Price IDs for subscriptions (for validation)
const VALID_SUBSCRIPTION_PRICE_IDS = new Set([
  // Monthly
  "price_1SotL1Axch1s4iBGWMvO0JBZ",
  "price_1SotLqAxch1s4iBG1ViXkfc2",
  "price_1SotMYAxch1s4iBGLZZ7ATBs",
  "price_1SotN4Axch1s4iBGUJEfzznw",
  "price_1SotNMAxch1s4iBGzRD7B7VI",
  "price_1SotNuAxch1s4iBGPl81sHqx",
  "price_1SotO9Axch1s4iBGCDE83jPv",
  "price_1SotOOAxch1s4iBGWiUHzG1M",
  // Yearly
  "price_1SotSpAxch1s4iBGbDC8je02",
  "price_1SotT5Axch1s4iBGUt6BTDDf",
  "price_1SotTJAxch1s4iBGYRBGTHK6",
  "price_1SotTdAxch1s4iBGpyDigl9b",
  "price_1SotTqAxch1s4iBGgaWwuU0Z",
  "price_1SotU1Axch1s4iBGC1uEWWXN",
  "price_1SotUEAxch1s4iBGUqWwl9Db",
  "price_1SotV0Axch1s4iBGZYfILH0H",
]);

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, priceId, tierId, credits, interval, topupAmount } = body;

    // Get user's membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = membership?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update membership with Stripe customer ID
      await supabase
        .from("memberships")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // Handle subscription checkout (Pro plan with elastic pricing)
    if (type === "subscription") {
      // Use priceId from frontend if provided and valid
      let finalPriceId = priceId;
      
      // Validate priceId if provided
      if (priceId && !VALID_SUBSCRIPTION_PRICE_IDS.has(priceId)) {
        // Fallback to env vars if invalid
        finalPriceId = interval === "yearly" 
          ? process.env.STRIPE_PRO_PRICE_ID_YEARLY 
          : process.env.STRIPE_PRO_PRICE_ID_MONTHLY;
      }
      
      // Final fallback to env vars
      if (!finalPriceId) {
        finalPriceId = interval === "yearly" 
          ? process.env.STRIPE_PRO_PRICE_ID_YEARLY 
          : process.env.STRIPE_PRO_PRICE_ID_MONTHLY;
      }

      if (!finalPriceId) {
        return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=plans&success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=plans&canceled=1`,
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            tier_id: tierId || "pro",
            credits_amount: credits?.toString() || "0",
            interval: interval || "monthly",
          },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Handle top-up checkout (credits)
    if (type === "topup" && topupAmount) {
      const topup = TOPUP_MAP[topupAmount];
      
      if (!topup || !topup.priceId) {
        return NextResponse.json({ error: "Invalid top-up amount" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: topup.priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=credits&success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=credits&canceled=1`,
        metadata: {
          supabase_user_id: user.id,
          credits_amount: topup.credits.toString(),
          purchase_type: "topup",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Handle Starter Pack checkout ($9 one-time for 300 credits)
    if (type === "starter") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: STARTER_PACK_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tool?success=starter`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tool?canceled=1`,
        metadata: {
          supabase_user_id: user.id,
          tier_id: "starter",
          credits_amount: STARTER_PACK_CREDITS.toString(),
          purchase_type: "starter_pack",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Handle Pro subscription from modal
    if (type === "pro") {
      const priceId = process.env.STRIPE_PRO_PRICE_ID_MONTHLY;
      if (!priceId) {
        return NextResponse.json({ error: "Pro price not configured" }, { status: 500 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tool?success=pro`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tool?canceled=1`,
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            tier_id: "pro",
            credits_amount: "3000",
            interval: "monthly",
          },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
