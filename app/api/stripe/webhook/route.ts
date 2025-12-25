import { NextRequest, NextResponse } from "next/server";
import { getStripe, TOPUP_CREDITS, PLAN_CREDITS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) break;

        if (session.mode === "subscription") {
          // Subscription created - update membership
          const plan = session.metadata?.plan as "pro" | "agency";
          const subscriptionId = session.subscription as string;
          
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;

          await supabase
            .from("memberships")
            .update({
              plan,
              status: "active",
              stripe_subscription_id: subscriptionId,
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          // Grant monthly credits for new plan
          const credits = PLAN_CREDITS[plan];
          await supabase.rpc("add_credits", {
            p_user_id: userId,
            p_amount: credits,
            p_bucket: "monthly",
            p_reason: "monthly_refill",
            p_reference_id: subscriptionId,
          });

        } else if (session.mode === "payment") {
          // Top-up payment completed
          const priceId = session.line_items?.data[0]?.price?.id;
          const credits = priceId ? TOPUP_CREDITS[priceId] : 0;

          if (credits > 0) {
            await supabase.rpc("add_credits", {
              p_user_id: userId,
              p_amount: credits,
              p_bucket: "topup",
              p_reason: "topup_purchase",
              p_reference_id: session.payment_intent as string,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subData = subscription as any;

        // Find user by customer ID
        const { data: membership } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (membership) {
          await supabase
            .from("memberships")
            .update({
              status: subscription.status === "active" ? "active" : 
                     subscription.status === "past_due" ? "past_due" : 
                     subscription.status === "canceled" ? "canceled" : "active",
              current_period_start: subData.current_period_start ? new Date(subData.current_period_start * 1000).toISOString() : null,
              current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", membership.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user and downgrade to free
        const { data: membership } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (membership) {
          await supabase
            .from("memberships")
            .update({
              plan: "free",
              status: "active",
              stripe_subscription_id: null,
              current_period_start: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", membership.user_id);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as any;
        const subscriptionId = invoiceData.subscription as string;
        const customerId = invoiceData.customer as string;

        // Monthly refill on subscription renewal
        if (subscriptionId && invoiceData.billing_reason === "subscription_cycle") {
          const { data: membership } = await supabase
            .from("memberships")
            .select("user_id, plan, monthly_credits:credit_wallets(monthly_credits)")
            .eq("stripe_customer_id", customerId)
            .single();

          if (membership) {
            const plan = membership.plan as "pro" | "agency";
            const credits = PLAN_CREDITS[plan];

            // Calculate rollover from remaining monthly credits
            // @ts-ignore
            const remainingMonthly = membership.monthly_credits?.[0]?.monthly_credits || 0;
            const rolloverCap = plan === "pro" ? 600 : plan === "agency" ? 2000 : 0;
            const rollover = Math.min(remainingMonthly, rolloverCap);

            // Reset monthly credits
            await supabase.rpc("add_credits", {
              p_user_id: membership.user_id,
              p_amount: credits,
              p_bucket: "monthly",
              p_reason: "monthly_refill",
              p_reference_id: invoice.id,
            });

            // Grant rollover if any
            if (rollover > 0) {
              await supabase.rpc("add_credits", {
                p_user_id: membership.user_id,
                p_amount: rollover,
                p_bucket: "rollover",
                p_reason: "rollover_grant",
                p_reference_id: invoice.id,
              });
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

