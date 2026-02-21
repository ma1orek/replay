import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

// Admin client for API key lookups (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Generate a new API key: returns { raw, hash, prefix } */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = "rk_live_" + randomBytes(32).toString("hex");
  return { raw, hash: hashKey(raw), prefix: raw.slice(0, 16) + "..." };
}

/** Authenticate a request via Authorization: Bearer rk_live_... header.
 *  Returns { user_id } on success, null on failure. */
export async function authenticateApiKey(
  request: NextRequest
): Promise<{ user_id: string } | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer rk_live_")) return null;

  const key = auth.slice(7); // strip "Bearer "
  const admin = getAdminClient();
  if (!admin) return null;

  const hash = hashKey(key);
  const { data, error } = await admin
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", hash)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  // Update last_used_at (fire-and-forget)
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", hash)
    .then(() => {});

  return { user_id: data.user_id };
}

/** Spend credits for an API call. Returns true if successful. */
export async function spendCreditsForApi(
  userId: string,
  cost: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();
  if (!admin) return { success: false, error: "Server configuration error" };

  const { data, error } = await admin.rpc("spend_credits", {
    p_user_id: userId,
    p_cost: cost,
    p_reason: reason,
    p_reference_id: null,
  });

  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error || "Insufficient credits" };
  return { success: true };
}
