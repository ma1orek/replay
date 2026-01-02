import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// Test endpoint to add credits - REMOVE IN PRODUCTION
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = body.amount || 1000;

    const adminClient = createAdminClient();
    
    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    // Check if wallet exists
    const { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      // Create wallet if it doesn't exist
      await adminClient
        .from("credit_wallets")
        .insert({
          user_id: user.id,
          monthly_credits: amount,
          rollover_credits: 0,
          topup_credits: 0,
        });

      // Also create membership if missing
      await adminClient
        .from("memberships")
        .upsert({
          user_id: user.id,
          plan: "free",
          status: "active",
        }, { onConflict: "user_id" });

      // Create profile if missing
      await adminClient
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
        }, { onConflict: "id" });

    } else {
      // Add credits to existing wallet
      await adminClient
        .from("credit_wallets")
        .update({
          monthly_credits: wallet.monthly_credits + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Add ledger entry
    await adminClient
      .from("credit_ledger")
      .insert({
        user_id: user.id,
        type: "credit",
        bucket: "monthly",
        amount: amount,
        reason: "admin_adjust",
        reference_id: "test_credits",
      });

    return NextResponse.json({ 
      success: true, 
      message: `Added ${amount} test credits`,
      newTotal: (wallet?.monthly_credits || 0) + amount
    });

  } catch (error) {
    console.error("Test credits error:", error);
    return NextResponse.json({ error: "Failed to add test credits" }, { status: 500 });
  }
}


