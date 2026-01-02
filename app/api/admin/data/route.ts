import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Admin credentials from environment variables (secure)
// Support both ADMIN_PASSWORD and ADMIN_SECRET for flexibility
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Check if admin credentials are configured
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD.");
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }

    // Verify admin token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const expectedToken = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");
    
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error - missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 503 });
    }

    // Fetch auth users for email/created_at info
    const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching auth users:", authError);
    }

    const authUsers = authUsersData?.users || [];
    console.log("Found auth users:", authUsers.length);

    // Fetch memberships (plan info)
    const { data: memberships, error: membershipError } = await supabase
      .from("memberships")
      .select("*");
    
    if (membershipError) {
      console.error("Error fetching memberships:", membershipError);
    }
    console.log("Found memberships:", memberships?.length || 0);

    // Fetch credit wallets
    const { data: wallets, error: walletError } = await supabase
      .from("credit_wallets")
      .select("*");
    
    if (walletError) {
      console.error("Error fetching wallets:", walletError);
    }
    console.log("Found wallets:", wallets?.length || 0);

    // Fetch all generations
    const { data: generations, error: genError } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (genError) {
      console.error("Error fetching generations:", genError);
    }
    console.log("Found generations:", generations?.length || 0);

    // Map users with auth data, memberships, and wallets
    const mappedUsers = authUsers.map((authUser: any) => {
      const membership = (memberships || []).find((m: any) => m.user_id === authUser.id);
      const wallet = (wallets || []).find((w: any) => w.user_id === authUser.id);
      const userGenerations = (generations || []).filter((g: any) => g.user_id === authUser.id);
      
      const monthlyCredits = wallet?.monthly_credits || 0;
      const rolloverCredits = wallet?.rollover_credits || 0;
      const topupCredits = wallet?.topup_credits || 0;
      const totalCredits = monthlyCredits + rolloverCredits + topupCredits;
      
      return {
        id: authUser.id,
        email: authUser.email || "Unknown",
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at || null,
        credits_free: totalCredits,
        credits_purchased: topupCredits,
        membership: membership?.plan || "free",
        generations_count: userGenerations.length
      };
    });

    // Map generations with user emails and code
    const mappedGenerations = (generations || []).map((gen: any) => {
      const user = mappedUsers.find((u: any) => u.id === gen.user_id);
      return {
        id: gen.id,
        user_id: gen.user_id,
        user_email: user?.email || "Unknown",
        created_at: gen.created_at,
        video_duration: gen.video_duration || null,
        style_directive: gen.input_style || gen.style_directive || null,
        title: gen.title || "Untitled",
        status: gen.status || "complete",
        credits_used: gen.cost_credits || gen.credits_used || 10,
        token_usage: gen.token_usage || null,
        code: gen.output_code || null, // Include generated code for preview (stored as output_code)
        video_url: gen.input_video_url || null, // Include source video URL (stored as input_video_url)
      };
    });

    console.log("Mapped generations:", mappedGenerations.length);
    
    // Calculate total tokens used
    const totalTokensUsed = mappedGenerations.reduce((sum: number, g: any) => {
      if (g.token_usage?.totalTokens) {
        return sum + g.token_usage.totalTokens;
      }
      return sum;
    }, 0);
    
    // Estimate cost (Gemini 3 Pro: ~$1.25 per 1M input tokens, ~$5 per 1M output tokens)
    // Simplified: ~$3 per 1M tokens average
    const estimatedCostUSD = (totalTokensUsed / 1000000) * 3;

    // Calculate stats
    const totalCreditsUsed = mappedGenerations.reduce((sum: number, g: any) => sum + (g.credits_used || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = mappedUsers.filter((u: any) => {
      if (!u.last_sign_in_at) return false;
      const lastSignIn = new Date(u.last_sign_in_at);
      return lastSignIn >= today;
    }).length;

    // Style popularity
    const styleCounts: Record<string, number> = {};
    mappedGenerations.forEach((g: any) => {
      const style = g.style_directive || "Default";
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });
    const topStyles = Object.entries(styleCounts)
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generations per day (last 30 days)
    const generationsPerDay: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = mappedGenerations.filter((g: any) => {
        const genDate = new Date(g.created_at).toISOString().split("T")[0];
        return genDate === dateStr;
      }).length;
      generationsPerDay.push({ date: dateStr, count });
    }

    const stats = {
      totalUsers: mappedUsers.length,
      totalGenerations: mappedGenerations.length,
      totalCreditsUsed,
      totalTokensUsed,
      estimatedCostUSD: Math.round(estimatedCostUSD * 100) / 100,
      activeToday,
      avgGenerationsPerUser: mappedUsers.length > 0 
        ? Math.round(mappedGenerations.length / mappedUsers.length * 10) / 10 
        : 0,
      topStyles,
      generationsPerDay,
      proUsers: mappedUsers.filter((u: any) => u.membership === "pro").length,
    };

    return NextResponse.json({
      users: mappedUsers,
      generations: mappedGenerations,
      stats
    });

  } catch (error: any) {
    console.error("Admin API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

