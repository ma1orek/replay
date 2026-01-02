import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!membership?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: membership.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=plans`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

