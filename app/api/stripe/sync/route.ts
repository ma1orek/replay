import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { getStripe, PLAN_CREDITS } from "@/lib/stripe";

// Endpoint to manually sync subscription status from Stripe
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    const stripe = getStripe();
    
    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const debugInfo: any = {
      userId: user.id,
      userEmail: user.email,
    };

    // Get membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id, stripe_subscription_id, plan, status")
      .eq("user_id", user.id)
      .single();

    debugInfo.existingMembership = membership;

    // Find ALL customers with this email
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 10,
    });
    
    debugInfo.customersFoundByEmail = customers.data.map(c => ({ id: c.id, email: c.email }));

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: "No Stripe customer found for your email.", 
        debug: debugInfo,
      }, { status: 400 });
    }

    // Check ALL customers for subscriptions (user might have multiple customer IDs)
    let activeSub: any = null;
    let activeCustomerId: string | null = null;
    const allSubscriptionsInfo: any[] = [];

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 10,
      });

      for (const sub of subs.data) {
        const subData = sub as any;
        allSubscriptionsInfo.push({
          customerId: customer.id,
          subscriptionId: sub.id,
          status: sub.status,
          created: new Date(sub.created * 1000).toISOString(),
          currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
        });

        // Found an active subscription!
        if ((sub.status === "active" || sub.status === "trialing") && !activeSub) {
          activeSub = sub;
          activeCustomerId = customer.id;
        }
      }
    }

    debugInfo.allSubscriptionsAcrossCustomers = allSubscriptionsInfo;
    debugInfo.activeSubscriptionFound = activeSub ? { id: activeSub.id, customerId: activeCustomerId, status: activeSub.status } : null;

    if (activeSub && activeCustomerId) {
      const subData = activeSub as any;

      // Update membership to Pro with the correct customer ID (use admin client to bypass RLS)
      const { error: membershipError } = await adminSupabase
        .from("memberships")
        .update({
          plan: "pro",
          status: "active",
          stripe_customer_id: activeCustomerId,
          stripe_subscription_id: activeSub.id,
          current_period_start: subData.current_period_start ? new Date(subData.current_period_start * 1000).toISOString() : null,
          current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (membershipError) {
        debugInfo.membershipUpdateError = membershipError;
        return NextResponse.json({ 
          error: "Failed to update membership: " + membershipError.message,
          debug: debugInfo,
        }, { status: 500 });
      }

      // Check if user already has a credit wallet with Pro credits
      // Only update credits if this is the FIRST time syncing (wallet has free-tier credits)
      const { data: currentWallet } = await adminSupabase
        .from("credit_wallets")
        .select("monthly_credits")
        .eq("user_id", user.id)
        .single();
      
      // Only upgrade credits if currently at free tier level (150 or less)
      // This prevents abuse where users click Sync to reset their credits
      if (currentWallet && currentWallet.monthly_credits <= 150) {
        const { error: creditsError } = await adminSupabase
          .from("credit_wallets")
          .update({
            monthly_credits: PLAN_CREDITS.pro,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
        
        if (creditsError) {
          debugInfo.creditsUpdateError = creditsError;
        }
        debugInfo.creditsUpgraded = true;
      } else {
        debugInfo.creditsUpgraded = false;
        debugInfo.reason = "Credits already at Pro level or above";
      }

      return NextResponse.json({ 
        success: true, 
        message: "Subscription synced! You now have Pro access.",
        plan: "pro",
        debug: debugInfo,
      });
    }

    // No active subscription found
    return NextResponse.json({ 
      success: false, 
      message: allSubscriptionsInfo.length > 0 
        ? `Found ${allSubscriptionsInfo.length} subscription(s) across ${customers.data.length} customers but none are active. Check if payment completed.`
        : "No subscriptions found across any of your Stripe accounts.",
      debug: debugInfo,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
