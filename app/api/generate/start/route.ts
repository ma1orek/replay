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

    // 3. Check and spend credits
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check credits
    const { data: creditData } = await admin
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!creditData || creditData.balance < CREDIT_COSTS.VIDEO_GENERATE) {
      return NextResponse.json({ 
        error: "Insufficient credits",
        required: CREDIT_COSTS.VIDEO_GENERATE,
        available: creditData?.balance || 0
      }, { status: 402 });
    }

    // Deduct credits
    await admin
      .from("user_credits")
      .update({ balance: creditData.balance - CREDIT_COSTS.VIDEO_GENERATE })
      .eq("user_id", user.id);

    console.log(`[generate/start] Credits deducted: ${CREDIT_COSTS.VIDEO_GENERATE}`);

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
      // Refund credits
      await admin
        .from("user_credits")
        .update({ balance: creditData.balance })
        .eq("user_id", user.id);
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
      // Generation failed - refund credits
      await admin
        .from("user_credits")
        .update({ balance: creditData.balance })
        .eq("user_id", user.id);
        
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
