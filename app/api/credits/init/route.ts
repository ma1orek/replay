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
      // User already has a wallet
      const total = (existingWallet.monthly_credits || 0) + 
                    (existingWallet.rollover_credits || 0) + 
                    (existingWallet.topup_credits || 0);
      return NextResponse.json({ 
        success: true, 
        message: "Wallet already exists",
        wallet: existingWallet,
        totalCredits: total
      });
    }

    // User doesn't have a wallet - create one with 100 free credits
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

    // Create credit wallet with 0 credits (Sandbox tier - must upgrade to Pro for credits)
    const { data: newWallet, error: walletError } = await adminClient
      .from("credit_wallets")
      .insert({
        user_id: user.id,
        monthly_credits: 0,
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

    // Add ledger entry for wallet initialization (0 credits - Sandbox tier)
    await adminClient
      .from("credit_ledger")
      .insert({
        user_id: user.id,
        type: "credit",
        bucket: "monthly",
        amount: 0,
        reason: "sandbox_signup",
        reference_id: "initial_grant_manual"
      });

    console.log(`Created wallet with 0 credits (Sandbox) for user ${user.email}`);

    return NextResponse.json({ 
      success: true, 
      message: "Wallet created (Sandbox - 0 credits). Upgrade to Pro for credits.",
      wallet: newWallet,
      totalCredits: 0
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


