import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error("Missing Supabase credentials for feedback");
    return null;
  }
  
  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, feedback, generationId, userId, dismissed } = body;

    if (!rating) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      // Still return success so user experience isn't affected
      console.warn("Feedback not saved - no Supabase client");
      return NextResponse.json({ success: true, warning: "Feedback not saved" });
    }
    
    const { error } = await supabase.from("feedback").insert({
      rating,
      feedback_text: feedback || null,
      generation_id: generationId || null,
      user_id: userId || null,
      dismissed: dismissed || false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving feedback:", error);
      // Check if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.warn("Feedback table doesn't exist - please create it manually in Supabase SQL Editor:");
        console.warn(`
          CREATE TABLE IF NOT EXISTS feedback (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            rating TEXT NOT NULL,
            feedback_text TEXT,
            generation_id TEXT,
            user_id TEXT,
            dismissed BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
      }
      // Still return success so UI isn't affected
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    // Return success anyway so user experience isn't disrupted
    return NextResponse.json({ success: true });
  }
}

// GET - for admin panel
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json({ 
        feedback: [], 
        stats: { total: 0, yes: 0, kinda: 0, no: 0 },
        error: "No database connection"
      });
    }
    
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching feedback:", error);
      // Return empty data if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          feedback: [], 
          stats: { total: 0, yes: 0, kinda: 0, no: 0 },
          warning: "Feedback table not yet created"
        });
      }
      return NextResponse.json({ 
        feedback: [], 
        stats: { total: 0, yes: 0, kinda: 0, no: 0 },
        error: error.message 
      });
    }

    // Calculate stats
    const stats = {
      total: feedback?.length || 0,
      yes: feedback?.filter((f) => f.rating === "yes").length || 0,
      kinda: feedback?.filter((f) => f.rating === "kinda").length || 0,
      no: feedback?.filter((f) => f.rating === "no").length || 0,
    };

    return NextResponse.json({ feedback: feedback || [], stats });
  } catch (error: any) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ 
      feedback: [], 
      stats: { total: 0, yes: 0, kinda: 0, no: 0 },
      error: error.message 
    });
  }
}

