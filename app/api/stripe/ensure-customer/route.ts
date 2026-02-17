import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// Lazily create Stripe customer for users who don't have one yet
export async function POST() {
  try {
    const stripe = getStripe();
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already has customer
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (membership?.stripe_customer_id) {
      return NextResponse.json({ customerId: membership.stripe_customer_id, created: false });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });

    // Store in memberships
    await supabase
      .from("memberships")
      .update({ stripe_customer_id: customer.id })
      .eq("user_id", user.id);

    return NextResponse.json({ customerId: customer.id, created: true });
  } catch (error: any) {
    console.error("Ensure customer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
