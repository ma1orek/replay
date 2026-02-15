import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// Initialize credits for a user who doesn't have a wallet
// This handles cases where the trigger didn't fire properly
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    
    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    // Check if user already has a wallet
    const { data: existingWallet } = await adminClient
      .from("credit_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingWallet) {
      const total = (existingWallet.monthly_credits || 0) +
                    (existingWallet.rollover_credits || 0) +
                    (existingWallet.topup_credits || 0);

      // Fix: If wallet exists but has 0 credits AND user is on free plan, grant 300 credits
      // This handles wallets created by DB trigger with old 0-credit values
      if (total === 0) {
        const { data: membershipData } = await adminClient
          .from("memberships")
          .select("plan")
          .eq("user_id", user.id)
          .single();

        const isFree = !membershipData || membershipData.plan === "free";
        if (isFree) {
          console.log(`Topping up 0-credit wallet to 300 for free user ${user.email}`);
          const { data: updatedWallet } = await adminClient
            .from("credit_wallets")
            .update({ monthly_credits: 300 })
            .eq("user_id", user.id)
            .select()
            .single();

          await adminClient.from("credit_ledger").insert({
            user_id: user.id,
            type: "credit",
            bucket: "monthly",
            amount: 300,
            reason: "signup_bonus",
            reference_id: "initial_grant_topup"
          });

          return NextResponse.json({
            success: true,
            message: "Wallet topped up to 300 credits",
            wallet: updatedWallet || { ...existingWallet, monthly_credits: 300 },
            totalCredits: 300
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Wallet already exists",
        wallet: existingWallet,
        totalCredits: total
      });
    }

    // User doesn't have a wallet - create one with 300 free credits (2 generations)
    console.log(`Creating wallet for user ${user.id} (${user.email})`);

    // First, ensure membership exists
    const { data: existingMembership } = await adminClient
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existingMembership) {
      // Create free membership
      const { error: membershipError } = await adminClient
        .from("memberships")
        .insert({
          user_id: user.id,
          plan: "free",
          status: "active"
        });
      
      if (membershipError) {
        console.error("Failed to create membership:", membershipError);
      }
    }

    // Create credit wallet with 300 free credits (Free tier - 2 generations)
    const { data: newWallet, error: walletError } = await adminClient
      .from("credit_wallets")
      .insert({
        user_id: user.id,
        monthly_credits: 300,
        rollover_credits: 0,
        topup_credits: 0
      })
      .select()
      .single();

    if (walletError) {
      console.error("Failed to create wallet:", walletError);
      return NextResponse.json({ 
        error: "Failed to create wallet", 
        details: walletError.message 
      }, { status: 500 });
    }

    // Add ledger entry for wallet initialization (300 free credits)
    await adminClient
      .from("credit_ledger")
      .insert({
        user_id: user.id,
        type: "credit",
        bucket: "monthly",
        amount: 300,
        reason: "signup_bonus",
        reference_id: "initial_grant_manual"
      });

    console.log(`Created wallet with 300 credits (Free tier) for user ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Wallet created (Free tier - 300 credits). 2 free generations!",
      wallet: newWallet,
      totalCredits: 300
    });

  } catch (error: any) {
    console.error("Credit init error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to check wallet status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    
    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    const { data: wallet, error } = await adminClient
      .from("credit_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !wallet) {
      return NextResponse.json({ 
        hasWallet: false,
        message: "No wallet found - call POST to initialize"
      });
    }

    const total = (wallet.monthly_credits || 0) + 
                  (wallet.rollover_credits || 0) + 
                  (wallet.topup_credits || 0);

    return NextResponse.json({
      hasWallet: true,
      wallet,
      totalCredits: total
    });

  } catch (error: any) {
    console.error("Credit check error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}


