import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

// Verify admin token (base64 encoded email:password)
function verifyAdminToken(token: string): { valid: boolean; email?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return { valid: true, email };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

// Create admin Supabase client
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}

// PATCH - Update user (membership, credits, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { valid } = verifyAdminToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await request.json();
    const { userId, membership, planTier, credits, isTopup } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Handle Starter Pack (isTopup=true): Add credits to topup_credits AND set membership to "starter"
    if (isTopup && credits && typeof credits === "number") {
      // Update membership to "starter"
      const { data: existingMembership } = await adminSupabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingMembership) {
        await adminSupabase
          .from("memberships")
          .update({ plan: "starter" })
          .eq("user_id", userId);
      } else {
        await adminSupabase
          .from("memberships")
          .insert({ 
            user_id: userId, 
            plan: "starter",
            created_at: new Date().toISOString()
          });
      }

      // Add credits to topup_credits
      const { data: wallet } = await adminSupabase
        .from("credit_wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
        
      if (wallet) {
        const newTopup = (wallet.topup_credits || 0) + credits;
        await adminSupabase
          .from("credit_wallets")
          .update({ topup_credits: newTopup })
          .eq("user_id", userId);
      } else {
        await adminSupabase
          .from("credit_wallets")
          .insert({
            user_id: userId,
            monthly_credits: 100,
            topup_credits: credits,
            rollover_credits: 0
          });
      }

      return NextResponse.json({ 
        success: true, 
        message: `User upgraded to Starter Pack with ${credits} credits` 
      });
    }

    // Handle membership update (uses memberships table with 'plan' field)
    if (membership !== undefined) {
      // First check if membership record exists
      const { data: existingMembership } = await adminSupabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .single();

      const membershipData: any = { 
        plan: membership,
      };

      if (existingMembership) {
        // Update existing membership
        const { error: updateError } = await adminSupabase
          .from("memberships")
          .update(membershipData)
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating membership:", updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
      } else {
        // Create new membership record
        const { error: insertError } = await adminSupabase
          .from("memberships")
          .insert({ 
            user_id: userId, 
            ...membershipData,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error("Error creating membership:", insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }
      
      // If credits are specified, also update the user's credits
      if (credits && typeof credits === "number") {
        const { data: wallet } = await adminSupabase
          .from("credit_wallets")
          .select("*")
          .eq("user_id", userId)
          .single();
          
        if (wallet) {
          await adminSupabase
            .from("credit_wallets")
            .update({ monthly_credits: credits })
            .eq("user_id", userId);
        } else {
          await adminSupabase
            .from("credit_wallets")
            .insert({
              user_id: userId,
              monthly_credits: credits,
              topup_credits: 0,
              rollover_credits: 0
            });
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `User set to ${planTier || membership}${credits ? ` with ${credits} credits` : ''}` 
      });
    }

    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });

  } catch (error: any) {
    console.error("Error in users PATCH:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// POST - Add credits to a user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { valid } = verifyAdminToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body = await request.json();
    const { userId, addCredits, creditType = "topup" } = body;

    if (!userId || addCredits === undefined) {
      return NextResponse.json({ error: "User ID and addCredits are required" }, { status: 400 });
    }

    // Get current wallet
    const { data: currentWallet, error: fetchError } = await adminSupabase
      .from("credit_wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching wallet:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Determine which credit column to update
    const columnName = creditType === "monthly" ? "monthly_credits" : "topup_credits";
    const currentCredits = currentWallet?.[columnName] || 0;
    const newCredits = currentCredits + addCredits;

    if (currentWallet) {
      // Update existing wallet
      const { data, error } = await adminSupabase
        .from("credit_wallets")
        .update({ [columnName]: newCredits })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating credits:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, wallet: data });
    } else {
      // Create new wallet
      const { data, error } = await adminSupabase
        .from("credit_wallets")
        .insert({ 
          user_id: userId, 
          [columnName]: addCredits,
          monthly_credits: creditType === "monthly" ? addCredits : 0,
          rollover_credits: 0,
          topup_credits: creditType === "topup" ? addCredits : 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating wallet:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, wallet: data });
    }

  } catch (error: any) {
    console.error("Error in users POST:", error);
    return NextResponse.json({ error: error.message || "Failed to add credits" }, { status: 500 });
  }
}

