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

    // 2. Process generation synchronously (MUST await to prevent Vercel from killing)
    // Frontend will start polling immediately after sending request, so this is fine.
    // Even if client disconnects, Vercel continues until maxDuration.
    
    console.log("[AsyncJob] Starting synchronous processing...");
    
    try {
      const result = await transmuteVideoToCode({
        videoUrl,
        styleDirective,
      });

      if (result.success && result.code) {
        console.log(`[AsyncJob] Job ${generationId} success!`);
        
        // Extract title from generated code
        let title = "Generated Project";
        const titleMatch = result.code.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const extractedTitle = titleMatch[1].trim();
          if (extractedTitle && extractedTitle.length > 0 && extractedTitle.length < 50) {
            title = extractedTitle;
          }
        }

        // Update DB with completed status
        const { error: updateError } = await admin
          .from("generations")
          .update({
            status: "complete",
            output_code: result.code,
            title: title,
            completed_at: new Date().toISOString()
          })
          .eq("id", generationId);
          
        if (updateError) {
          console.error("[AsyncJob] Update error:", updateError);
        }

        return NextResponse.json({ 
          success: true, 
          jobId: generationId,
          status: "complete",
          code: result.code,
          title: title,
        });
          
      } else {
        console.error(`[AsyncJob] Job ${generationId} AI failed:`, result.error);
        
        await admin
          .from("generations")
          .update({ status: "failed" })
          .eq("id", generationId);
          
        return NextResponse.json({ 
          success: false, 
          jobId: generationId,
          error: result.error || "AI Generation Failed" 
        }, { status: 500 });
      }
    } catch (processError: any) {
      console.error(`[AsyncJob] Job ${generationId} crashed:`, processError);
      
      await admin
        .from("generations")
        .update({ status: "failed" })
        .eq("id", generationId);
        
      return NextResponse.json({ 
        success: false, 
        jobId: generationId,
        error: processError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Async Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
