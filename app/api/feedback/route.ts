import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, feedback, generationId, userId, dismissed } = body;

    if (!rating) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }
    
    const { error } = await supabase.from("feedback").insert({
      rating,
      feedback_text: feedback,
      generation_id: generationId || null,
      user_id: userId || null,
      dismissed: dismissed || false,
    });

    if (error) {
      console.error("Error saving feedback:", error);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - for admin panel
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }
    
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching feedback:", error);
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      total: feedback?.length || 0,
      yes: feedback?.filter((f) => f.rating === "yes").length || 0,
      kinda: feedback?.filter((f) => f.rating === "kinda").length || 0,
      no: feedback?.filter((f) => f.rating === "no").length || 0,
    };

    return NextResponse.json({ feedback, stats });
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

