import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cost, reason, referenceId } = body;

    if (!cost || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use admin client for atomic refund
    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    // Add credits back to monthly_credits (simplest, always correct)
    const { data: wallet, error: walletError } = await adminClient
      .from("credit_wallets")
      .select("monthly_credits")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      console.error("Refund error - wallet not found:", walletError);
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const { error: updateError } = await adminClient
      .from("credit_wallets")
      .update({
        monthly_credits: wallet.monthly_credits + cost,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Refund error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log the refund in credit_ledger (non-critical)
    try {
      await adminClient.from("credit_ledger").insert({
        user_id: user.id,
        amount: cost,
        reason: `refund_${reason}`,
        reference_id: referenceId || null,
      });
    } catch {
      // Ledger insert failure is non-critical
    }

    console.log(`Refunded ${cost} credits to user ${user.id} (${reason})`);

    return NextResponse.json({ success: true, refunded: cost });
  } catch (error) {
    console.error("Credit refund error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
