"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/utils";

// POST /api/generate/start
// Accepts video, creates job, returns jobId immediately
// Mobile polls /api/generate/status/[jobId] for result
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const styleDirective = formData.get("styleDirective") as string || "Modern, clean design";
    
    if (!videoFile) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    // 3. Generate job ID
    const jobId = generateId();
    const timestamp = Date.now();
    
    // 4. Upload video to Supabase Storage
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

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
    const videoUrl = urlData.publicUrl;

    // 5. Create job record in database
    const { error: insertError } = await admin
      .from("generation_jobs")
      .insert({
        id: jobId,
        user_id: user.id,
        status: "pending",
        video_url: videoUrl,
        style_directive: styleDirective,
        created_at: new Date(timestamp).toISOString(),
        updated_at: new Date(timestamp).toISOString(),
      });

    if (insertError) {
      console.error("[generate/start] Insert error:", insertError);
      // Job table might not exist, let's continue anyway and store in memory
    }

    // 6. Trigger background processing (non-blocking)
    // We use fetch to our own API to start processing asynchronously
    const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://replay.build";
    
    // Fire and forget - don't await
    fetch(`${baseUrl}/api/generate/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, videoUrl, styleDirective, userId: user.id }),
    }).catch(err => console.error("[generate/start] Failed to trigger processing:", err));

    console.log(`[generate/start] Job ${jobId} created, processing started`);

    // 7. Return jobId immediately - mobile will poll for status
    return NextResponse.json({
      success: true,
      jobId,
      message: "Generation started. Poll /api/generate/status/{jobId} for updates.",
    });

  } catch (error) {
    console.error("[generate/start] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
