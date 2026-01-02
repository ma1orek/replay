import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

// Admin endpoint to fix credits for a specific user by email
export async function POST(request: NextRequest) {
  try {
    // Verify admin token (same as other admin endpoints)
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - missing auth header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const expectedToken = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");
    
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const body = await request.json();
    const { email, credits = 150 } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    // Find user by email
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
    }

    // Check if user has a wallet
    const { data: existingWallet } = await adminClient
      .from("credit_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingWallet) {
      // Update existing wallet
      const { data: updatedWallet, error: updateError } = await adminClient
        .from("credit_wallets")
        .update({
          monthly_credits: credits,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Add ledger entry
      await adminClient.from("credit_ledger").insert({
        user_id: user.id,
        type: "credit",
        bucket: "monthly",
        amount: credits - existingWallet.monthly_credits,
        reason: "admin_fix",
        reference_id: `admin_fix_${Date.now()}`
      });

      return NextResponse.json({
        success: true,
        message: `Updated wallet for ${email}`,
        previousCredits: existingWallet.monthly_credits,
        newCredits: credits,
        wallet: updatedWallet
      });
    }

    // Check/create membership
    const { data: existingMembership } = await adminClient
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existingMembership) {
      await adminClient.from("memberships").insert({
        user_id: user.id,
        plan: "free",
        status: "active"
      });
    }

    // Create new wallet
    const { data: newWallet, error: createError } = await adminClient
      .from("credit_wallets")
      .insert({
        user_id: user.id,
        monthly_credits: credits,
        rollover_credits: 0,
        topup_credits: 0
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Add ledger entry
    await adminClient.from("credit_ledger").insert({
      user_id: user.id,
      type: "credit",
      bucket: "monthly",
      amount: credits,
      reason: "signup_bonus",
      reference_id: "initial_grant_manual"
    });

    return NextResponse.json({
      success: true,
      message: `Created wallet for ${email} with ${credits} credits`,
      wallet: newWallet
    });

  } catch (error: any) {
    console.error("Admin fix credits error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// GET to check a user's credits
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized - missing auth header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const expectedToken = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");
    
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    // Find user by email
    const { data: users } = await adminClient.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
    }

    // Get wallet
    const { data: wallet } = await adminClient
      .from("credit_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get membership
    const { data: membership } = await adminClient
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      hasWallet: !!wallet,
      wallet,
      hasMembership: !!membership,
      membership,
      totalCredits: wallet 
        ? (wallet.monthly_credits || 0) + (wallet.rollover_credits || 0) + (wallet.topup_credits || 0)
        : 0
    });

  } catch (error: any) {
    console.error("Admin check credits error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

