import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { transmuteVideoToCode } from "@/actions/transmute";

// Vercel config - allow large video uploads and long generation time
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for generation

// POST /api/generate/start
// Accepts video, processes it, returns result
// IMPORTANT: Credits should be spent by the frontend BEFORE calling this endpoint
// (same pattern as desktop - frontend calls /api/credits/spend first)
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[generate/start] User ${user.id} starting generation`);

    // 2. Parse request - supports both FormData (with file) and JSON (with URL)
    const contentType = request.headers.get("content-type") || "";
    let videoUrl: string;
    let styleDirective: string = "Modern, clean design";
    const jobId = generateId();

    // Get admin client for storage upload (if needed)
    const admin = createAdminClient();
    if (!admin) {
      console.error("[generate/start] Admin client is null - check SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (contentType.includes("application/json")) {
      // JSON body with pre-uploaded video URL
      const body = await request.json();
      videoUrl = body.videoUrl;
      styleDirective = body.styleDirective || styleDirective;
      
      if (!videoUrl) {
        return NextResponse.json({ error: "No videoUrl provided" }, { status: 400 });
      }
      console.log(`[generate/start] Using pre-uploaded video: ${videoUrl}`);
    } else {
      // FormData with video file - upload to storage first
      const formData = await request.formData() as unknown as globalThis.FormData;
      const videoFile = formData.get("video") as File | null;
      styleDirective = (formData.get("styleDirective") as string) || styleDirective;
      
      if (!videoFile) {
        return NextResponse.json({ error: "No video provided" }, { status: 400 });
      }

      console.log(`[generate/start] Video file received: ${videoFile.size} bytes, ${videoFile.type}`);

      // Upload video to Supabase Storage
      const fileExt = videoFile.type.includes("webm") ? "webm" : "mp4";
      const fileName = `mobile-jobs/${jobId}.${fileExt}`;
      const arrayBuffer = await videoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await admin.storage
        .from("videos")
        .upload(fileName, buffer, {
          contentType: videoFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("[generate/start] Upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
      }

      // Get public URL
      const { data: urlData } = admin.storage.from("videos").getPublicUrl(fileName);
      videoUrl = urlData.publicUrl;
      console.log(`[generate/start] Video uploaded: ${videoUrl}`);
    }

    // NOTE: Credits are spent by the frontend before calling this endpoint

    // 5. Generate code
    console.log(`[generate/start] Calling transmuteVideoToCode...`);
    
    const result = await transmuteVideoToCode({
      videoUrl,
      styleDirective,
    });

    const duration = Date.now() - startTime;
    console.log(`[generate/start] Generation complete in ${duration}ms:`, { 
      success: result.success, 
      hasCode: !!result.code,
      codeLength: result.code?.length 
    });

    if (result.success && result.code) {
      // Extract title from code
      let title: string | undefined;
      const titleMatch = result.code.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const extractedTitle = titleMatch[1].trim();
        if (extractedTitle && extractedTitle.length > 0 && extractedTitle.length < 50 && !extractedTitle.toLowerCase().includes("untitled")) {
          title = extractedTitle;
        }
      }

      return NextResponse.json({
        success: true,
        jobId,
        status: "complete",
        code: result.code,
        title,
        videoUrl,
        duration,
      });
    } else {
      // Generation failed - credits already spent (same as desktop behavior)
      return NextResponse.json({ 
        success: false,
        error: result.error || "Generation failed - no code returned" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("[generate/start] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
