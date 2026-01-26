import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPlanFromPriceId, PLAN_CREDITS, TOPUP_CREDITS } from "@/lib/stripe";
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
  
  if (!supabase) {
    console.error("SUPABASE_SERVICE_ROLE_KEY not set - cannot process webhook");
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
  }

  console.log("Received Stripe webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.metadata?.supabase_user_id || session.metadata?.user_id;
        const customerId = session.customer as string;

        console.log("Checkout completed:", { mode: session.mode, userId, customerId, metadata: session.metadata });

        if (!userId && customerId) {
          const { data: membership } = await supabase
            .from("memberships")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();
          
          if (membership) {
            userId = membership.user_id;
            console.log("Found user by customer ID:", userId);
          }
        }

        if (!userId) {
          console.log("No user ID found, skipping...");
          break;
        }

        if (session.mode === "subscription") {
          const plan = session.metadata?.plan || "pro";
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subData = subscription as any;

          // Update membership
          const { error: membershipError } = await supabase
            .from("memberships")
            .update({
              plan,
              status: "active",
              stripe_subscription_id: subscriptionId,
              current_period_start: subData.current_period_start ? new Date(subData.current_period_start * 1000).toISOString() : null,
              current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (membershipError) {
            console.error("Error updating membership:", membershipError);
          }

          // Grant monthly credits
          const credits = PLAN_CREDITS[plan] || PLAN_CREDITS.pro;
          await supabase
            .from("credit_wallets")
            .update({
              monthly_credits: credits,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          console.log("Updated membership for user:", userId, "Plan:", plan, "Credits:", credits);

        } else if (session.mode === "payment") {
          // Top-up payment completed
          let credits = parseInt(session.metadata?.credits_amount || "0");
          
          if (credits === 0) {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const priceId = lineItems.data[0]?.price?.id;
            if (priceId && TOPUP_CREDITS[priceId]) {
              credits = TOPUP_CREDITS[priceId];
            }
          }

          if (credits > 0) {
            const { data: wallet } = await supabase
              .from("credit_wallets")
              .select("topup_credits")
              .eq("user_id", userId)
              .single();

            const currentTopup = wallet?.topup_credits || 0;

            await supabase
              .from("credit_wallets")
              .update({
                topup_credits: currentTopup + credits,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);

            console.log("Added", credits, "topup credits for user:", userId);
          }
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subData = subscription as any;
        
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : "pro";

        const { data: membership } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (membership) {
          await supabase
            .from("memberships")
            .update({
              plan,
              status: subscription.status === "active" ? "active" : "trialing",
              stripe_subscription_id: subscription.id,
              current_period_start: subData.current_period_start ? new Date(subData.current_period_start * 1000).toISOString() : null,
              current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", membership.user_id);

          // Grant credits
          const credits = PLAN_CREDITS[plan] || PLAN_CREDITS.pro;
          await supabase
            .from("credit_wallets")
            .update({
              monthly_credits: credits,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", membership.user_id);

          console.log("Subscription created for user:", membership.user_id, "Plan:", plan, "Credits:", credits);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subData = subscription as any;
        
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : undefined;

        const { data: membership } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (membership) {
          const updateData: any = {
            status: subscription.status === "active" ? "active" : 
                   subscription.status === "past_due" ? "past_due" : 
                   subscription.status === "canceled" ? "canceled" : "active",
            current_period_start: subData.current_period_start ? new Date(subData.current_period_start * 1000).toISOString() : null,
            current_period_end: subData.current_period_end ? new Date(subData.current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          };
          
          if (plan && plan !== "free") {
            updateData.plan = plan;
            // Update credits on plan change
            const credits = PLAN_CREDITS[plan] || PLAN_CREDITS.pro;
            await supabase
              .from("credit_wallets")
              .update({ monthly_credits: credits, updated_at: new Date().toISOString() })
              .eq("user_id", membership.user_id);
          }

          await supabase
            .from("memberships")
            .update(updateData)
            .eq("user_id", membership.user_id);

          console.log("Updated subscription for user:", membership.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

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

          // Reset to free credits
          await supabase
            .from("credit_wallets")
            .update({
              monthly_credits: PLAN_CREDITS.free,
              rollover_credits: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", membership.user_id);

          console.log("Downgraded user to free:", membership.user_id);
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
            .select("user_id, plan")
            .eq("stripe_customer_id", customerId)
            .single();

          if (membership) {
            const plan = membership.plan as string;
            const credits = PLAN_CREDITS[plan] || PLAN_CREDITS.pro;

            await supabase
              .from("credit_wallets")
              .update({
                monthly_credits: credits,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", membership.user_id);

            console.log("Monthly refill for user:", membership.user_id, "Credits:", credits);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = (invoice as any).customer as string;

        const { data: membership } = await supabase
          .from("memberships")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (membership) {
          await supabase
            .from("memberships")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", membership.user_id);

          console.log("Marked subscription as past_due for user:", membership.user_id);
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
