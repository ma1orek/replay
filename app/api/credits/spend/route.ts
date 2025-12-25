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

    // Use admin client for atomic spend
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient.rpc("spend_credits", {
      p_user_id: user.id,
      p_cost: cost,
      p_reason: reason,
      p_reference_id: referenceId || null,
    });

    if (error) {
      console.error("Credit spend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || "Failed to spend credits", ...data },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Credit spend error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

