import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const stripe = getStripe();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, plan, interval } = body;

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    // Get or create Stripe customer
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = membership?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      // Update membership with customer ID
      await supabase
        .from("memberships")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    if (type === "subscription") {
      // Subscription checkout - Pro or Agency
      let priceId: string;
      
      if (plan === "pro") {
        priceId = interval === "yearly" ? STRIPE_PRICES.PRO_YEARLY : STRIPE_PRICES.PRO_MONTHLY;
      } else if (plan === "agency") {
        priceId = interval === "yearly" ? STRIPE_PRICES.AGENCY_YEARLY : STRIPE_PRICES.AGENCY_MONTHLY;
      } else {
        return NextResponse.json({ error: "Invalid plan. Use 'pro' or 'agency'" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/settings?tab=plans&success=true`,
        cancel_url: `${origin}/settings?tab=plans&canceled=true`,
        metadata: { user_id: user.id, plan },
        subscription_data: {
          metadata: { supabase_user_id: user.id, plan },
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid checkout type" }, { status: 400 });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
