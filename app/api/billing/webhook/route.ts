import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import crypto from "crypto";

// Facebook Conversions API
const FB_PIXEL_ID = "REDACTED_FB_PIXEL_ID";
const FB_ACCESS_TOKEN = "REDACTED_FB_ACCESS_TOKEN";

async function trackFBPurchase(userId: string, email: string | null, value: number, eventName: "Purchase" | "Subscribe") {
  try {
    const hashedEmail = email ? crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex") : null;
    const hashedUserId = crypto.createHash("sha256").update(userId).digest("hex");
    
    await fetch(`https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: "https://replay.build/settings",
          action_source: "website",
          user_data: {
            em: hashedEmail,
            external_id: hashedUserId,
          },
          custom_data: {
            currency: "USD",
            value: value,
          },
        }],
      }),
    });
    console.log(`FB Event: ${eventName} - $${value} for user ${userId}`);
  } catch (error) {
    console.warn("FB tracking failed:", error);
  }
}

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PRO_MONTHLY_CREDITS = 3000;
const PRO_MAX_ROLLOVER = 600;

// Credit amounts for top-ups
const CREDITS_BY_PRICE: Record<string, number> = {
  [process.env.STRIPE_CREDITS_PRICE_ID_2000 || ""]: 2000,
  [process.env.STRIPE_CREDITS_PRICE_ID_5500 || ""]: 5500,
  [process.env.STRIPE_CREDITS_PRICE_ID_12000 || ""]: 12000,
};

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("Received Stripe event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.supabase_user_id || session.client_reference_id;
        
        console.log("Checkout completed:", { mode: session.mode, userId });
        
        // Handle subscription purchase
        if (session.mode === "subscription" && userId && session.subscription) {
          await supabase
            .from("memberships")
            .update({
              plan: "pro",
              status: "active",
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          // Track subscription purchase to Facebook
          const customerEmail = session.customer_details?.email || session.customer_email;
          await trackFBPurchase(userId, customerEmail, session.amount_total ? session.amount_total / 100 : 29, "Subscribe");
          
          console.log("Updated membership to Pro for user:", userId);
        }
        
        // Handle top-up purchase (one-time payment)
        if (session.mode === "payment" && userId) {
          const creditsAmount = parseInt(session.metadata?.credits_amount || "0");
          
          if (creditsAmount > 0) {
            // Add credits to user's wallet
            const { data: wallet } = await supabase
              .from("credit_wallets")
              .select("topup_credits")
              .eq("user_id", userId)
              .single();
            
            const currentTopup = wallet?.topup_credits || 0;
            
            await supabase
              .from("credit_wallets")
              .update({
                topup_credits: currentTopup + creditsAmount,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            
            // Log to ledger
            await supabase
              .from("credit_ledger")
              .insert({
                user_id: userId,
                type: "credit",
                bucket: "topup",
                amount: creditsAmount,
                reason: "topup_purchase",
                reference_id: session.id,
              });
            
            // Track top-up purchase to Facebook
            const customerEmail = session.customer_details?.email || session.customer_email;
            await trackFBPurchase(userId, customerEmail, session.amount_total ? session.amount_total / 100 : 20, "Purchase");
            
            console.log("Added", creditsAmount, "credits for user:", userId);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.supabase_user_id;
        
        if (userId) {
          const status = subscription.status;
          const periodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000) 
            : null;
          const periodStart = subscription.current_period_start 
            ? new Date(subscription.current_period_start * 1000) 
            : null;
          
          await supabase
            .from("memberships")
            .update({
              plan: status === "active" || status === "trialing" ? "pro" : "free",
              status: status,
              stripe_subscription_id: subscription.id,
              current_period_start: periodStart?.toISOString() || null,
              current_period_end: periodEnd?.toISOString() || null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          console.log("Updated subscription for user:", userId, "status:", status);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.supabase_user_id;
        
        if (userId) {
          // Downgrade to free
          await supabase
            .from("memberships")
            .update({
              plan: "free",
              status: "canceled",
              stripe_subscription_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          // Reset credits to free tier
          await supabase
            .from("credit_wallets")
            .update({
              monthly_credits: 150,
              rollover_credits: 0,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
          
          console.log("Downgraded user to free:", userId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          // Get subscription to find user
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.supabase_user_id;
          
          if (userId) {
            // Get current credits
            const { data: wallet } = await supabase
              .from("credit_wallets")
              .select("monthly_credits, rollover_credits")
              .eq("user_id", userId)
              .single();

            // Calculate rollover (unused monthly credits, max 600)
            const currentMonthly = wallet?.monthly_credits || 0;
            const currentRollover = wallet?.rollover_credits || 0;
            const newRollover = Math.min(currentRollover + currentMonthly, PRO_MAX_ROLLOVER);

            // Allocate new monthly credits
            await supabase
              .from("credit_wallets")
              .update({
                monthly_credits: PRO_MONTHLY_CREDITS,
                rollover_credits: newRollover,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);

            // Log to ledger
            await supabase
              .from("credit_ledger")
              .insert({
                user_id: userId,
                type: "credit",
                bucket: "monthly",
                amount: PRO_MONTHLY_CREDITS,
                reason: "monthly_refill",
                reference_id: invoice.id,
              });

            if (newRollover > currentRollover) {
              await supabase
                .from("credit_ledger")
                .insert({
                  user_id: userId,
                  type: "credit",
                  bucket: "rollover",
                  amount: newRollover - currentRollover,
                  reason: "rollover_grant",
                  reference_id: invoice.id,
                });
            }
            
            console.log("Refilled credits for user:", userId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.supabase_user_id;
          
          if (userId) {
            await supabase
              .from("memberships")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", userId);
            
            console.log("Marked subscription as past_due for user:", userId);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
