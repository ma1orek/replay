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
  20: { priceId: process.env.STRIPE_CREDITS_PRICE_ID_2000 || "", credits: 2000 },
  50: { priceId: process.env.STRIPE_CREDITS_PRICE_ID_5500 || "", credits: 5500 },
  100: { priceId: process.env.STRIPE_CREDITS_PRICE_ID_12000 || "", credits: 12000 },
};

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, plan, interval, topupAmount } = body;

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

    // Handle subscription checkout (Pro plan)
    if (type === "subscription") {
      const priceId = interval === "yearly" 
        ? process.env.STRIPE_PRO_PRICE_ID_YEARLY 
        : process.env.STRIPE_PRO_PRICE_ID_MONTHLY;

      if (!priceId) {
        return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
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
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=plans&success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=plans&canceled=1`,
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
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

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
