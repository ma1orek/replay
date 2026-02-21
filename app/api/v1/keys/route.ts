import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-auth";

// POST — Create a new API key (requires Supabase auth session)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = body.name || "Default";

    // Limit: max 5 active keys per user
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Server error" }, { status: 503 });
    }

    const { count } = await admin
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if ((count || 0) >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 active API keys per account" },
        { status: 400 }
      );
    }

    const { raw, hash, prefix } = generateApiKey();

    const { error } = await admin.from("api_keys").insert({
      user_id: user.id,
      key_hash: hash,
      key_prefix: prefix,
      name,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the raw key ONCE — it cannot be retrieved again
    return NextResponse.json({
      key: raw,
      prefix,
      name,
      message: "Save this key now. It will not be shown again.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — List user's API keys (masked)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, key_prefix, name, created_at, last_used_at, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ keys: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    if (!keyId) {
      return NextResponse.json({ error: "id parameter required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", keyId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
