import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

// Use service role for atomic update (RLS bypass)
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Lazily create Stripe customer for users who don't have one yet
// Handles race conditions + existing Stripe customers by email
export async function POST() {
  try {
    const stripe = getStripe();
    const supabase = await createServerSupabaseClient();
    const adminSupabase = getAdminSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double-check with service role (freshest data, no RLS)
    const { data: membership } = await adminSupabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (membership?.stripe_customer_id) {
      return NextResponse.json({ customerId: membership.stripe_customer_id, created: false });
    }

    // Check if Stripe already has a customer with this email (prevents duplicates)
    const existing = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string;

    if (existing.data.length > 0) {
      // Reuse existing Stripe customer
      customerId = existing.data[0].id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Atomic update — only set if still null (race condition guard)
    const { data: updated } = await adminSupabase
      .from("memberships")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id)
      .is("stripe_customer_id", null)
      .select("stripe_customer_id")
      .single();

    // If update didn't match (another request already set it), read the current value
    if (!updated) {
      const { data: current } = await adminSupabase
        .from("memberships")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();
      return NextResponse.json({ customerId: current?.stripe_customer_id, created: false });
    }

    return NextResponse.json({ customerId, created: existing.data.length === 0 });
  } catch (error: any) {
    console.error("Ensure customer error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
