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

    console.log("[Feedback] Received:", { rating, hasText: !!feedback, generationId, userId });

    if (!rating) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      console.error("[Feedback] No Supabase client - check SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ success: false, error: "No database connection" });
    }
    
    const { data, error } = await supabase.from("feedback").insert({
      rating,
      feedback_text: feedback || null,
      generation_id: generationId || null,
      user_id: userId || null,
      dismissed: dismissed || false,
      created_at: new Date().toISOString(),
    }).select();

    if (error) {
      console.error("[Feedback] Insert error:", error.message, error.details, error.hint);
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.error("[Feedback] TABLE DOES NOT EXIST! Run this SQL in Supabase:");
        console.error(`
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating TEXT NOT NULL,
  feedback_text TEXT,
  generation_id TEXT,
  user_id TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow inserts
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all feedback inserts" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all feedback reads" ON public.feedback FOR SELECT USING (true);
        `);
        return NextResponse.json({ success: false, error: "Table does not exist" });
      }
      
      return NextResponse.json({ success: false, error: error.message });
    }

    console.log("[Feedback] Saved successfully:", data);
    return NextResponse.json({ success: true, id: data?.[0]?.id });
  } catch (error: any) {
    console.error("[Feedback] Exception:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}

// GET - for admin panel
export async function GET(request: Request) {
  try {
    console.log("[Feedback GET] Fetching feedback...");
    
    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      console.error("[Feedback GET] No Supabase client");
      return NextResponse.json({ 
        feedback: [], 
        stats: { total: 0, yes: 0, kinda: 0, no: 0 },
        error: "No database connection - check SUPABASE_SERVICE_ROLE_KEY"
      });
    }
    
    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Feedback GET] Error:", error.message, error.details);
      
      // Return empty data if table doesn't exist
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          feedback: [], 
          stats: { total: 0, yes: 0, kinda: 0, no: 0 },
          error: "Feedback table does not exist - create it in Supabase SQL Editor"
        });
      }
      return NextResponse.json({ 
        feedback: [], 
        stats: { total: 0, yes: 0, kinda: 0, no: 0 },
        error: error.message 
      });
    }

    console.log("[Feedback GET] Found", feedback?.length || 0, "entries");

    // Calculate stats
    const stats = {
      total: feedback?.length || 0,
      yes: feedback?.filter((f) => f.rating === "yes").length || 0,
      kinda: feedback?.filter((f) => f.rating === "kinda").length || 0,
      no: feedback?.filter((f) => f.rating === "no").length || 0,
    };

    return NextResponse.json({ feedback: feedback || [], stats });
  } catch (error: any) {
    console.error("[Feedback GET] Exception:", error);
    return NextResponse.json({ 
      feedback: [], 
      stats: { total: 0, yes: 0, kinda: 0, no: 0 },
      error: error.message 
    });
  }
}

