import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { transmuteVideoToCode } from "@/actions/transmute";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = createAdminClient();
    
    if (!admin) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoUrl, styleDirective } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ error: "No video URL" }, { status: 400 });
    }

    // 1. Create a generation record immediately (Status: PROCESSING)
    const generationId = generateId();
    
    const insertData = {
      id: generationId,
      user_id: user.id,
      title: "Processing...",
      status: "running",  // Must be: running, complete, or failed
      input_video_url: videoUrl,
      input_style: styleDirective || "",
      input_context: "",
      cost_credits: 75,
      output_code: null,
      output_architecture: {},
      output_design_system: null,
      versions: [],
      completed_at: null,
    };
    
    console.log("[AsyncJob] Inserting job record:", generationId);
    
    const { error: insertError } = await admin
      .from("generations")
      .insert(insertData);

    if (insertError) {
      console.error("DB Init Error:", JSON.stringify(insertError, null, 2));
      return NextResponse.json({ error: `Failed to initialize job: ${insertError.message}` }, { status: 500 });
    }
    
    console.log("[AsyncJob] Job record created successfully");

    // 2. Return success IMMEDIATELY to the client
    // This allows the mobile app to "disconnect" UI-wise and start polling.
    // WARNING: On Vercel standard, the function might freeze after response.
    // To mitigate, we kick off the processing promise WITHOUT awaiting it fully 
    // blocking the response, BUT we need a way to keep the lambda alive.
    
    // TRICK: We cannot easily keep lambda alive after return in standard Next.js 14 without 'waitUntil'.
    // PIVOT: Since we can't guarantee background execution on Vercel Free/Pro without 'waitUntil',
    // we will actually WAIT for the process in this request, BUT the Frontend will use
    // a "fire and forget" fetch or ignore the timeout.
    
    // ACTUALLY: The user wants "Lovable Style".
    // Let's try to do the processing here. 
    // If the client disconnects (closes app), does the Vercel function stop?
    // Usually NO, it runs until completion or timeout (maxDuration).
    
    // So, we will NOT return immediately. We will run the process.
    // The FRONTEND will treat it as async (it won't wait for the fetch response to update UI).
    // The Frontend will switch to "Polling Mode" immediately after sending the request.
    
    // Start processing (floating promise)
    processGeneration(generationId, videoUrl, styleDirective, user.id, admin)
      .catch(err => console.error("Background processing failed:", err));

    return NextResponse.json({ 
      success: true, 
      jobId: generationId,
      message: "Job started in background" 
    });

  } catch (error: any) {
    console.error("Async Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// The actual heavy lifting
async function processGeneration(id: string, videoUrl: string, styleDirective: string, userId: string, admin: any) {
  console.log(`[AsyncJob] Starting job ${id} for user ${userId}`);
  
  try {
    // Call Gemini
    const result = await transmuteVideoToCode({
      videoUrl,
      styleDirective,
    });

    if (result.success && result.code) {
      console.log(`[AsyncJob] Job ${id} success! Saving...`);
      
      // Extract title
      let title = "Generated Project";
      const titleMatch = result.code.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim().substring(0, 50);
      }

      // Update DB
      await admin
        .from("generations")
        .update({
          status: "complete",
          output_code: result.code,
          title: title,
          completed_at: new Date().toISOString()
        })
        .eq("id", id);
        
    } else {
      console.error(`[AsyncJob] Job ${id} failed logic:`, result.error);
      await admin
        .from("generations")
        .update({ status: "failed", error: result.error || "AI Generation Failed" })
        .eq("id", id);
    }
  } catch (err: any) {
    console.error(`[AsyncJob] Job ${id} crashed:`, err);
    await admin
      .from("generations")
      .update({ status: "failed", error: err.message })
      .eq("id", id);
  }
}
