import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Use admin client for storage operations (bypass RLS)
    const adminClient = createAdminClient();
    const supabase = await createServerSupabaseClient();
    
    // Get user (optional - allow anonymous uploads for now)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anon";

    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // Check file size (50MB max)
    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json({ 
        error: `Video too large. Maximum size is ${maxSizeMB}MB.` 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "webm";
    const filename = `${userId}/${timestamp}.${extension}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using admin client
    const { data, error } = await adminClient.storage
      .from("videos")
      .upload(filename, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "video/webm",
      });

    if (error) {
      console.error("Upload error:", error);
      // Check if bucket doesn't exist
      if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
        return NextResponse.json({ 
          error: "Storage not configured. Please create 'videos' bucket in Supabase." 
        }, { status: 500 });
      }
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from("videos")
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      size: file.size,
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

