import { NextRequest, NextResponse } from "next/server";
import { getStripe, getPlanFromPriceId } from "@/lib/stripe";
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

          console.log("Updated membership for user:", userId, "Plan:", plan);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subData = subscription as any;
        
        // Determine plan from price ID
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

          console.log("Subscription created for user:", membership.user_id, "Plan:", plan);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subData = subscription as any;
        
        // Determine plan from price ID (in case of upgrade/downgrade)
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
          
          // Update plan if changed
          if (plan && plan !== "free") {
            updateData.plan = plan;
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

          console.log("Downgraded user to free:", membership.user_id);
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
