"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";
import { transmuteVideoToCode } from "@/actions/transmute";
import { CREDIT_COSTS } from "@/lib/credits/context";

// POST /api/generate/start
// Accepts video, processes it, returns result
// This is synchronous - mobile waits for result
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

    // 2. Parse form data
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const styleDirective = formData.get("styleDirective") as string || "Modern, clean design";
    
    if (!videoFile) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    console.log(`[generate/start] Video received: ${videoFile.size} bytes, ${videoFile.type}`);

    // 3. Spend credits using RPC (same as desktop)
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Use the same RPC function as /api/credits/spend
    const { data: spendResult, error: spendError } = await admin.rpc("spend_credits", {
      p_user_id: user.id,
      p_cost: CREDIT_COSTS.VIDEO_GENERATE,
      p_reason: "video_generate",
      p_reference_id: `mobile_gen_${Date.now()}`,
    });

    if (spendError) {
      console.error("[generate/start] Credit spend RPC error:", spendError);
      return NextResponse.json({ error: spendError.message }, { status: 500 });
    }

    if (!spendResult?.success) {
      console.log("[generate/start] Insufficient credits:", spendResult);
      return NextResponse.json({ 
        error: spendResult?.error || "Insufficient credits",
        required: CREDIT_COSTS.VIDEO_GENERATE,
        available: spendResult?.remaining || 0
      }, { status: 402 });
    }

    console.log(`[generate/start] Credits spent: ${CREDIT_COSTS.VIDEO_GENERATE}, remaining: ${spendResult.remaining}`);

    // 4. Upload video to Supabase Storage
    const jobId = generateId();
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
      // Note: Credits already spent - no refund (same as desktop behavior)
      return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = admin.storage.from("videos").getPublicUrl(fileName);
    const videoUrl = urlData.publicUrl;

    console.log(`[generate/start] Video uploaded: ${videoUrl}`);

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
